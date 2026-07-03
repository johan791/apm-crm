import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Använder next-auth:s middleware, som verifierar JWT-signaturen på
// sessions-cookien via authorized-callbacken i auth.config.ts.
// (Ersätter den tidigare kontrollen som bara kollade att cookien fanns.)
// Default-export så att Next.js 16 entydigt känner igen den som en
// middleware-funktion (en destrukturerad const-export gör inte det).
export default NextAuth(authConfig).auth;

export const config = {
  // Undanta hela /api från middleware — de skyddas var för sig i sina
  // route handlers (auth() eller CRON_SECRET). Detta gör också att
  // cron-endpointen inte längre redirectas till /login.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
