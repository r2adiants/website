import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Confirmation code required" }, { status: 400 });
  }

  const reservation = db
    .prepare(
      `SELECT r.*, rt.name as room_type_name, rt.description as room_type_description
       FROM reservations r
       JOIN room_types rt ON rt.id = r.room_type_id
       WHERE r.confirmation_code = ?`
    )
    .get(code);

  if (!reservation) {
    return NextResponse.json({ error: "No reservation found with that code." }, { status: 404 });
  }

  const thread = db
    .prepare("SELECT id FROM mail_thread WHERE reservation_id = ?")
    .get((reservation as { id: number }).id) as { id: number } | undefined;

  return NextResponse.json({ reservation, threadId: thread?.id || null });
}
