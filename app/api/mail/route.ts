import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");

  if (threadId) {
    // Public: a guest with a valid threadId (learned via their confirmation
    // page) can read their own conversation. Threads are opaque IDs, not
    // guessable in sequence in a way that matters for this RP use case.
    const messages = db
      .prepare("SELECT * FROM mail_message WHERE thread_id = ? ORDER BY created_at ASC")
      .all(threadId);
    db.prepare("UPDATE mail_thread SET is_read = 1 WHERE id = ?").run(threadId);
    return NextResponse.json({ messages });
  }

  // Staff-only: full thread list across all guests
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = db
    .prepare("SELECT * FROM mail_thread ORDER BY updated_at DESC")
    .all();

  return NextResponse.json({ threads });
}
