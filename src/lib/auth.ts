import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

// Giltig bcrypt-hash (cost 10) att jämföra mot när e-posten är okänd, så att
// inloggningsförsök mot en obefintlig användare tar lika lång tid som mot en
// befintlig. Motverkar timing-baserad användaruppräkning. Motsvarar ingen
// verklig lösenordssträng.
const DUMMY_HASH =
  "$2b$10$BiRVcreMAviLQ3aTqBUA/ONi35DsDmohgLxARxKT1Hp31wX/JP7Ra";

// Best-effort-throttling per (IP + e-post) mot lösenordsgissning.
// OBS: in-memory — nollställs per serverless-instans på Vercel och delas inte
// mellan instanser. För robust skydd, byt till en delad store (Upstash Redis
// eller en DB-backad lockout). Nyckeln kombinerar IP och e-post så att en
// delad kontors-IP inte låser ut all personal, och så att en angripare inte
// kan låsa ut en enskild användares konto från godtycklig IP.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function isLocked(key: string): boolean {
  const rec = attempts.get(key);
  if (!rec) return false;
  if (Date.now() > rec.resetAt) {
    attempts.delete(key);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now > rec.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    rec.count++;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const ip =
          request?.headers
            ?.get("x-forwarded-for")
            ?.split(",")[0]
            ?.trim() || "unknown";
        const key = `${ip}:${email.toLowerCase()}`;

        if (isLocked(key)) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Kör alltid en bcrypt-jämförelse (dummy-hash när användaren saknas)
        // så att svarstiden är konstant oavsett om e-posten finns.
        const hash = user?.passwordHash ?? DUMMY_HASH;
        const valid = await bcrypt.compare(password, hash);

        if (!user || !valid) {
          recordFailure(key);
          return null;
        }

        attempts.delete(key);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
