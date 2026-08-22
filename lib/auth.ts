import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me-in-production";
const COOKIE_NAME = "hotel_staff_session";

export interface StaffSession {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function signSession(payload: StaffSession) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string): StaffSession | null {
  try {
    return jwt.verify(token, SECRET) as StaffSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<StaffSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
