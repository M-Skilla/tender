"use server";

import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { findUserByEmail } from "@/services/amanadb";

export type SignInState = {
  email: string;
  errors?: { email?: string; password?: string };
};

/** Only local paths, so the return address cannot send someone to another site. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// Sign in (spec flow 1): look the user up by email, check the scrypt hash, start the session.
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email) return { email, errors: { email: "Enter your email address." } };
  if (!password) return { email, errors: { password: "Enter your password." } };

  const user = await findUserByEmail(email);
  // The same message whether the email or the password is wrong, so accounts cannot be probed.
  if (!user || !(await verifyPassword(password, user.data.passwordHash))) {
    return { email, errors: { password: "Email or password is not correct. Check both and try again." } };
  }
  if (!user.data.active) {
    return { email, errors: { email: "This account has been deactivated. Contact the procuring entity." } };
  }

  await startSession({ userId: user.key, name: user.data.name, email: user.data.email, role: user.data.role });
  redirect(safeNext(formData.get("next")));
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/sign-in");
}
