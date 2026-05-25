"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function login(
  _previousState: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return "Fel e-post eller lösenord.";
    }
    throw error;
  }
}
