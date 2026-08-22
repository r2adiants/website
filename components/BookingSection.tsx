"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RoomType {
  id: number;
  name: string;
  description: string;
  price_per_night: number;
  capacity: number;
  total_rooms: number;
  image_seed: string;
}

const ROOM_ART: Record<string, string> = {
  standard:
    "linear-gradient(135deg, #c9b896 0%, #a89268 100%)",
  deluxe:
    "linear-gradient(135deg, #8fa896 0%, #4d6b5a 100%)",
  suite:
    "linear-gradient(135deg, #b08d57 0%, #1f2e28 100%)",
};

export default function BookingSection() {
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selected, setSelected] = useState<RoomType | null>(null);
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    specialRequests: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/room-types")
      .then((r) => r.json())
      .then((data) => setRoomTypes(data.roomTypes));
  }, []);

  const nights =
    form.checkIn && form.checkOut
      ? Math.max(
          1,
          Math.round(
            (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const totalPrice = selected ? nights * selected.price_per_night : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, roomTypeId: selected.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      router.push(`/confirmation/${data.reservation.confirmationCode}`);
    } catch {
      setError("Could not reach the reservations desk. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section id="rooms" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 max-w-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-brass mb-3">Accommodations</p>
        <h2 className="font-display text-3xl md:text-4xl text-forest">
          Choose your room
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-14">
        {roomTypes.map((room) => (
          <button
            key={room.id}
            onClick={() => setSelected(room)}
            className={`text-left rounded-lg overflow-hidden border transition-all ${
              selected?.id === room.id
                ? "border-brass ring-2 ring-brass/40"
                : "border-line hover:border-brass/60"
            }`}
          >
            <div
              className="h-32 w-full relative"
              style={{ background: ROOM_ART[room.image_seed] || ROOM_ART.standard }}
            >
              <span className="absolute bottom-3 left-4 font-display italic text-white/90 text-sm">
                {room.capacity} guests max
              </span>
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-display text-lg text-forest mb-1">{room.name}</h3>
              <p className="text-sm text-forest/70 mb-3 leading-relaxed">
                {room.description}
              </p>
              <p className="text-brass font-medium">
                ${room.price_per_night}
                <span className="text-forest/50 text-sm font-normal"> / night</span>
              </p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="border border-line rounded-lg bg-white p-8 max-w-2xl">
          <h3 className="font-display text-2xl text-forest mb-1">
            Reserve the {selected.name}
          </h3>
          <p className="text-sm text-forest/60 mb-6">
            Fill in your details below — no account needed.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
                  Full name
                </label>
                <input
                  required
                  value={form.guestName}
                  onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={form.guestEmail}
                  onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
                  placeholder="jane@example.com"
                />
              </div>
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
                  max={selected.capacity}
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                  className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
                Special requests (optional)
              </label>
              <textarea
                value={form.specialRequests}
                onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
                rows={2}
                placeholder="Late arrival, quiet room, etc."
              />
            </div>

            {nights > 0 && (
              <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
                <span className="text-forest/70">
                  {nights} night{nights > 1 ? "s" : ""} × ${selected.price_per_night}
                </span>
                <span className="font-display text-lg text-forest">${totalPrice}</span>
              </div>
            )}

            {error && <p className="text-clay text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest text-ivory rounded py-3 font-medium tracking-wide hover:bg-forest-light transition-colors disabled:opacity-60"
            >
              {loading ? "Confirming with concierge…" : "Confirm Reservation"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
