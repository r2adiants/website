import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

const VALID_STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  db.prepare("UPDATE reservations SET status = ? WHERE id = ?").run(status, id);

  return NextResponse.json({ success: true });
}
