import { NextResponse } from "next/server";
import db from "@/lib/db";
import { generateConciergeReply } from "@/lib/concierge";

// Called when a guest sends a new message on their confirmation page,
// or when staff asks the AI concierge to draft the next reply.
export async function POST(req: Request) {
  const body = await req.json();
  const { threadId, guestMessage } = body;

  if (!threadId) {
    return NextResponse.json({ error: "threadId required" }, { status: 400 });
  }

  const thread = db.prepare("SELECT * FROM mail_thread WHERE id = ?").get(threadId) as
    | { id: number; guest_name: string; guest_email: string; subject: string; reservation_id: number | null }
    | undefined;

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (guestMessage) {
    db.prepare(
      `INSERT INTO mail_message (thread_id, sender, body) VALUES (?, 'guest', ?)`
    ).run(threadId, guestMessage);
  }

  const history = db
    .prepare("SELECT sender, body FROM mail_message WHERE thread_id = ? ORDER BY created_at ASC")
    .all(threadId) as { sender: "guest" | "concierge"; body: string }[];

  let reservationSummary: string | undefined;
  if (thread.reservation_id) {
    const res = db
      .prepare(
        `SELECT r.*, rt.name as room_type_name FROM reservations r
         JOIN room_types rt ON rt.id = r.room_type_id WHERE r.id = ?`
      )
      .get(thread.reservation_id) as
      | {
          room_type_name: string;
          check_in: string;
          check_out: string;
          guests: number;
          total_price: number;
          confirmation_code: string;
          status: string;
        }
      | undefined;

    if (res) {
      reservationSummary = `Room: ${res.room_type_name}\nCheck-in: ${res.check_in}\nCheck-out: ${res.check_out}\nGuests: ${res.guests}\nTotal: $${res.total_price}\nConfirmation code: ${res.confirmation_code}\nStatus: ${res.status}`;
    }
  }

  const reply = await generateConciergeReply({
    guestName: thread.guest_name,
    subject: thread.subject,
    threadHistory: history,
    reservationSummary,
  });

  db.prepare(
    `INSERT INTO mail_message (thread_id, sender, body) VALUES (?, 'concierge', ?)`
  ).run(threadId, reply);

  db.prepare("UPDATE mail_thread SET updated_at = datetime('now'), is_read = 0 WHERE id = ?").run(
    threadId
  );

  return NextResponse.json({ reply });
}
