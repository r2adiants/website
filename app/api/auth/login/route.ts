import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { signSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const staff = db.prepare("SELECT * FROM staff WHERE email = ?").get(email) as
    | { id: number; name: string; email: string; password_hash: string; role: string }
    | undefined;

  if (!staff || !bcrypt.compareSync(password, staff.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = signSession({
    id: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
  });

  await setSessionCookie(token);

  return NextResponse.json({
    staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role },
  });
}
