import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const roomTypes = db.prepare("SELECT * FROM room_types ORDER BY price_per_night ASC").all();
  return NextResponse.json({ roomTypes });
}
