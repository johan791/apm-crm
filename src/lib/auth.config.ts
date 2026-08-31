import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  logger: {
    error(error) {
      // En trasig eller förfalskad sessions-cookie ger JWTSessionError
      // (JWEInvalid) vid varje förfrågan — det är förväntat när någon skickar
      // en ogiltig cookie, inte ett driftfel. Tysta det bruset; logga allt
      // annat som vanligt.
      if (error?.name === "JWTSessionError") return;
      console.error(error);
    },
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Inloggad användare som besöker /login skickas till startsidan.
      if (pathname === "/login") {
        if (isLoggedIn) return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }

      // Alla andra sidor kräver en giltig session (JWT-signaturen verifieras).
      // Returnerar false → next-auth redirectar till signIn-sidan (/login).
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
  providers: [],
};
