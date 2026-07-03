import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function currentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id as string;
}

/**
 * Grind för server actions och route handlers. Skickar till /login när
 * sessionen saknas eller är ogiltig istället för att kasta fel — ger en mjuk
 * upplevelse för utgångna sessioner och gamla öppna flikar.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id as string;
}

export async function requireAuth(): Promise<void> {
  await requireUserId();
}
