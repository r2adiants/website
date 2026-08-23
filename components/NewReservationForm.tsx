"use client";

import { useEffect, useState } from "react";

interface RoomType {
  id: number;
  name: string;
  price_per_night: number;
  capacity: number;
}

export default function NewReservationForm({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    roomTypeId: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    specialRequests: "",
    status: "pending",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/room-types")
      .then((r) => r.json())
      .then((data) => {
        setRoomTypes(data.roomTypes);
        if (data.roomTypes[0]) {
          setForm((f) => ({ ...f, roomTypeId: String(data.roomTypes[0].id) }));
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        roomTypeId: Number(form.roomTypeId),
        createdByStaff: true,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Could not create reservation.");
      setLoading(false);
      return;
    }

    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-forest/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border border-line max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-forest">New Reservation</h3>
          <button onClick={onClose} className="text-forest/40 hover:text-forest text-sm">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
                Guest name
              </label>
              <input
                required
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
                Guest email
              </label>
              <input
                required
                type="email"
                value={form.guestEmail}
                onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
              Room type
            </label>
            <select
              value={form.roomTypeId}
              onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
              className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
            >
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} — ${rt.price_per_night}/night
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
                Check-in
              </label>
              <input
                required
                type="date"
                value={form.checkIn}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
                Check-out
              </label>
              <input
                required
                type="date"
                value={form.checkOut}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
                Guests
              </label>
              <input
                required
                type="number"
                min={1}
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
              Initial status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
            >
              <option value="pending">Pending (no email sent yet)</option>
              <option value="confirmed">Confirmed (sends confirmation email now)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={form.specialRequests}
              onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
              className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
              rows={2}
            />
          </div>

          {error && <p className="text-clay text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-ivory rounded py-2.5 font-medium hover:bg-forest-light transition-colors disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create Reservation"}
          </button>
        </form>
      </div>
    </div>
  );
}
