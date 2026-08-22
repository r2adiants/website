"use client";

import { useEffect, useState } from "react";

interface Message {
  id: number;
  sender: "guest" | "concierge";
  body: string;
  created_at: string;
}

export default function MailThread({ threadId }: { threadId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    const res = await fetch(`/api/mail?threadId=${threadId}`);
    const data = await res.json();
    setMessages(data.messages || []);
  }

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    await fetch("/api/mail/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, guestMessage: draft }),
    });
    setDraft("");
    await loadMessages();
    setSending(false);
  }

  return (
    <div className="border border-line rounded-lg bg-white overflow-hidden">
      <div className="border-b border-line px-5 py-3 bg-ivory-texture">
        <p className="text-xs uppercase tracking-wide text-forest/60">Concierge Inbox</p>
      </div>

      <div className="max-h-96 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-forest/50 italic">No messages yet.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === "concierge" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-line ${
                m.sender === "concierge"
                  ? "bg-forest/5 text-forest border border-line"
                  : "bg-forest text-ivory"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wide opacity-60 mb-1">
                {m.sender === "concierge" ? "Concierge Team" : "You"}
              </p>
              {m.body}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-line p-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Write a message to the concierge…"
          className="flex-1 border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass/50"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-brass text-white px-4 py-2 rounded text-sm font-medium hover:bg-brass-light transition-colors disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
