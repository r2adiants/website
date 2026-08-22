import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateBookingConfirmationEmail } from "@/lib/concierge";

function generateConfirmationCode() {
  return "RES-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function nightsBetween(checkIn: string, checkOut: string) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const ms = outDate.getTime() - inDate.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export async function GET() {
  // Staff-only: list all reservations
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservations = db
    .prepare(
      `SELECT r.*, rt.name as room_type_name
       FROM reservations r
       JOIN room_types rt ON rt.id = r.room_type_id
       ORDER BY r.created_at DESC`
    )
    .all();

  return NextResponse.json({ reservations });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { guestName, guestEmail, roomTypeId, checkIn, checkOut, guests, specialRequests } = body;

  if (!guestName || !guestEmail || !roomTypeId || !checkIn || !checkOut) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const roomType = db.prepare("SELECT * FROM room_types WHERE id = ?").get(roomTypeId) as
    | { id: number; name: string; price_per_night: number; total_rooms: number }
    | undefined;

  if (!roomType) {
    return NextResponse.json({ error: "Invalid room type" }, { status: 400 });
  }

  // Check availability: count overlapping active reservations for this room type
  const overlapping = db
    .prepare(
      `SELECT COUNT(*) as c FROM reservations
       WHERE room_type_id = ?
       AND status NOT IN ('cancelled')
       AND NOT (check_out <= ? OR check_in >= ?)`
    )
    .get(roomTypeId, checkIn, checkOut) as { c: number };

  if (overlapping.c >= roomType.total_rooms) {
    return NextResponse.json(
      { error: "No rooms of this type are available for the selected dates." },
      { status: 409 }
    );
  }

  const nights = nightsBetween(checkIn, checkOut);
  const totalPrice = nights * roomType.price_per_night;
  const confirmationCode = generateConfirmationCode();

  const result = db
    .prepare(
      `INSERT INTO reservations
       (confirmation_code, guest_name, guest_email, room_type_id, check_in, check_out, guests, special_requests, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`
    )
    .run(
      confirmationCode,
      guestName,
      guestEmail,
      roomTypeId,
      checkIn,
      checkOut,
      guests || 1,
      specialRequests || null,
      totalPrice
    );

  const reservationId = result.lastInsertRowid as number;

  // Create a mail thread + AI-generated confirmation message
  const threadResult = db
    .prepare(
      `INSERT INTO mail_thread (reservation_id, guest_email, guest_name, subject, is_read)
       VALUES (?, ?, ?, ?, 0)`
    )
    .run(reservationId, guestEmail, guestName, "Your Reservation Confirmation");

  const threadId = threadResult.lastInsertRowid as number;

  db.prepare(
    `INSERT INTO mail_message (thread_id, sender, body) VALUES (?, 'guest', ?)`
  ).run(threadId, `I just booked a room. Please confirm my reservation details.`);

  let confirmationEmail: string;
  try {
    confirmationEmail = await generateBookingConfirmationEmail({
      guestName,
      roomTypeName: roomType.name,
      checkIn,
      checkOut,
      guests: guests || 1,
      totalPrice,
      confirmationCode,
    });
  } catch (err) {
    console.error("Concierge email generation failed:", err);
    confirmationEmail = `Dear ${guestName},\n\nYour reservation (${confirmationCode}) for the ${roomType.name} from ${checkIn} to ${checkOut} is confirmed. Total: $${totalPrice}.\n\nWarm regards,\nConcierge Team`;
  }

  db.prepare(
    `INSERT INTO mail_message (thread_id, sender, body) VALUES (?, 'concierge', ?)`
  ).run(threadId, confirmationEmail);

  return NextResponse.json({
    reservation: {
      id: reservationId,
      confirmationCode,
      guestName,
      guestEmail,
      roomTypeName: roomType.name,
      checkIn,
      checkOut,
      guests: guests || 1,
      totalPrice,
      status: "confirmed",
    },
    threadId,
  });
}
