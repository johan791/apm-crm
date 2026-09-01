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
  //
  // Bildfiler i /public undantas också. De behövs innan man är inloggad
  // (logotypen på inloggningssidan), och Next:s bildoptimerare hämtar dem
  // internt utan sessionscookie — utan undantaget får den en redirect till
  // /login i stället för en bild och svarar 400. Bara bildändelser räknas
  // upp, så eventuella dokument i /public förblir skyddade.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif)$).*)",
  ],
};
