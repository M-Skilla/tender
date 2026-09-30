import "server-only";

// Sessions and role checks (spec sections 5 and 6). The session is a signed, encrypted cookie
// (iron-session); there is no session store. Pages use requirePageUser; every server action
// uses requireActionUser, which re-reads the user from AmanaDB so deactivation applies at once.
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { getUser } from "@/services/amanadb";

export type SessionUser = { userId: string; name: string; email: string; role: UserRole };

type SessionData = { user?: SessionUser };

function options(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return {
    password,
    cookieName: "tender_session",
    ttl: 60 * 60 * 8,
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
  };
}

async function session() {
  return getIronSession<SessionData>(await cookies(), options());
}

export async function currentUser(): Promise<SessionUser | null> {
  return (await session()).user ?? null;
}

export async function startSession(user: SessionUser): Promise<void> {
  const s = await session();
  s.user = user;
  await s.save();
}

export async function endSession(): Promise<void> {
  (await session()).destroy();
}

/** For pages: sends signed-out visitors to sign in (and back); returns null for the wrong role. */
export async function requirePageUser(roles: UserRole[], returnTo: string): Promise<SessionUser | null> {
  const user = await currentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return roles.includes(user.role) ? user : null;
}

export class NotAuthorizedError extends Error {
  constructor(message = "You are not allowed to do this. Sign in with an account that has this role.") {
    super(message);
    this.name = "NotAuthorizedError";
  }
}

/** For server actions: the signed-in user, re-read from AmanaDB, if active and in one of `roles`. */
export async function requireActionUser(roles: UserRole[]): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new NotAuthorizedError("Your session has ended. Sign in again.");
  const record = await getUser(user.userId);
  if (!record || !record.data.active || !roles.includes(record.data.role)) throw new NotAuthorizedError();
  return { userId: record.key, name: record.data.name, email: record.data.email, role: record.data.role };
}
