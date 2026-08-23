"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MailThread from "@/components/MailThread";
import NewReservationForm from "@/components/NewReservationForm";

interface Reservation {
  id: number;
  confirmation_code: string;
  guest_name: string;
  guest_email: string;
  room_type_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  total_price: number;
}

interface Thread {
  id: number;
  guest_name: string;
  subject: string;
  is_read: number;
  updated_at: string;
}

interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
}

const STATUS_OPTIONS = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"];

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  checked_in: "bg-blue-100 text-blue-800",
  checked_out: "bg-zinc-100 text-zinc-600",
  cancelled: "bg-red-100 text-red-700",
};

export default function StaffDashboard() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [tab, setTab] = useState<"reservations" | "mail">("reservations");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.staff) {
          router.push("/staff/login");
        } else {
          setStaff(data.staff);
          setLoadingAuth(false);
        }
      });
  }, [router]);

  async function loadReservations() {
    const res = await fetch("/api/reservations");
    const data = await res.json();
    setReservations(data.reservations || []);
  }

  async function loadThreads() {
    const res = await fetch("/api/mail");
    const data = await res.json();
    setThreads(data.threads || []);
  }

  useEffect(() => {
    if (!loadingAuth) {
      loadReservations();
      loadThreads();
    }
  }, [loadingAuth]);

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notifyGuest: true }),
    });
    const data = await res.json();
    loadReservations();
    loadThreads();
    if (data.staffMessage) {
      setToast(data.staffMessage);
      setTimeout(() => setToast(null), 5000);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/staff/login");
  }

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center text-forest/50">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-ivory-texture">
      <header className="border-b border-line bg-forest">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brass text-brass font-display italic text-sm">
              A
            </span>
            <span className="font-display text-lg text-ivory">Staff Dashboard</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ivory/60">{staff?.name}</span>
            <button
              onClick={handleLogout}
              className="text-ivory/60 hover:text-ivory transition-colors text-xs uppercase tracking-wide border border-ivory/20 rounded px-3 py-1.5"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex gap-2 mb-6 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("reservations")}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                tab === "reservations" ? "bg-forest text-ivory" : "bg-white text-forest/60 border border-line"
              }`}
            >
              Reservations
            </button>
            <button
              onClick={() => setTab("mail")}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                tab === "mail" ? "bg-forest text-ivory" : "bg-white text-forest/60 border border-line"
              }`}
            >
              Concierge Mail
              {threads.some((t) => !t.is_read) && (
                <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-clay" />
              )}
            </button>
          </div>
          {tab === "reservations" && (
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 rounded text-sm font-medium bg-brass text-white hover:bg-brass-light transition-colors"
            >
              + New Reservation
            </button>
          )}
        </div>

        {tab === "reservations" && (
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ivory-texture border-b border-line text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-forest/60">Code</th>
                  <th className="px-4 py-3 font-medium text-forest/60">Guest</th>
                  <th className="px-4 py-3 font-medium text-forest/60">Room</th>
                  <th className="px-4 py-3 font-medium text-forest/60">Dates</th>
                  <th className="px-4 py-3 font-medium text-forest/60">Total</th>
                  <th className="px-4 py-3 font-medium text-forest/60">Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-forest/70">
                      {r.confirmation_code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-forest">{r.guest_name}</p>
                      <p className="text-forest/40 text-xs">{r.guest_email}</p>
                    </td>
                    <td className="px-4 py-3 text-forest/80">{r.room_type_name}</td>
                    <td className="px-4 py-3 text-forest/80 text-xs">
                      {r.check_in} → {r.check_out}
                    </td>
                    <td className="px-4 py-3 text-forest font-medium">${r.total_price}</td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                        className={`text-xs rounded px-2 py-1 border-0 font-medium ${STATUS_COLOR[r.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-forest/40">
                      No reservations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "mail" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-line rounded-lg overflow-hidden md:col-span-1 h-fit">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={`w-full text-left px-4 py-3 border-b border-line last:border-0 hover:bg-ivory-texture transition-colors ${
                    activeThreadId === t.id ? "bg-ivory-texture" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-forest font-medium">{t.guest_name}</p>
                    {!t.is_read && <span className="h-1.5 w-1.5 rounded-full bg-clay" />}
                  </div>
                  <p className="text-xs text-forest/50">{t.subject}</p>
                </button>
              ))}
              {threads.length === 0 && (
                <p className="px-4 py-6 text-center text-forest/40 text-sm">No messages yet.</p>
              )}
            </div>

            <div className="md:col-span-2">
              {activeThreadId ? (
                <MailThread threadId={activeThreadId} />
              ) : (
                <div className="border border-line rounded-lg bg-white p-8 text-center text-forest/40 text-sm">
                  Select a conversation to view.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showNewForm && (
        <NewReservationForm
          onClose={() => setShowNewForm(false)}
          onCreated={() => {
            setShowNewForm(false);
            loadReservations();
            loadThreads();
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-forest text-ivory px-5 py-3 rounded-lg shadow-lg text-sm max-w-sm z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
