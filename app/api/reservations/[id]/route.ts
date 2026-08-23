import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateStatusUpdateEmail } from "@/lib/concierge";

const VALID_STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, notifyGuest } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  db.prepare("UPDATE reservations SET status = ? WHERE id = ?").run(status, id);

  if (!notifyGuest) {
    return NextResponse.json({ success: true, notified: false });
  }

  const reservation = db
    .prepare(
      `SELECT r.*, rt.name as room_type_name FROM reservations r
       JOIN room_types rt ON rt.id = r.room_type_id WHERE r.id = ?`
    )
    .get(id) as
    | {
        id: number;
        guest_name: string;
        confirmation_code: string;
        check_in: string;
        check_out: string;
        room_type_name: string;
      }
    | undefined;

  if (!reservation) {
    return NextResponse.json({ success: true, notified: false });
  }

  const thread = db
    .prepare("SELECT id FROM mail_thread WHERE reservation_id = ?")
    .get(reservation.id) as { id: number } | undefined;

  if (!thread) {
    return NextResponse.json({ success: true, notified: false });
  }

  let message: string;
  try {
    message = await generateStatusUpdateEmail({
      guestName: reservation.guest_name,
      roomTypeName: reservation.room_type_name,
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      confirmationCode: reservation.confirmation_code,
      newStatus: status,
    });
  } catch (err) {
    console.error("Status update email generation failed:", err);
    message = `Dear ${reservation.guest_name},\n\nYour reservation (${reservation.confirmation_code}) status has been updated to "${status.replace(
      "_",
      " "
    )}".\n\nWarm regards,\nConcierge Team`;
  }

  db.prepare(
    `INSERT INTO mail_message (thread_id, sender, body) VALUES (?, 'concierge', ?)`
  ).run(thread.id, message);

  db.prepare("UPDATE mail_thread SET updated_at = datetime('now') WHERE id = ?").run(thread.id);

  return NextResponse.json({
    success: true,
    notified: true,
    staffMessage: `The guest has been notified — their status is now "${status.replace("_", " ")}".`,
  });
}
