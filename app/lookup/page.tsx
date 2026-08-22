"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

export default function LookupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/reservations/lookup?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    router.push(`/confirmation/${code.trim().toUpperCase()}`);
  }

  return (
    <div className="flex flex-col flex-1 bg-ivory-texture">
      <SiteHeader />
      <main className="mx-auto max-w-md w-full px-6 py-24 flex-1">
        <h1 className="font-display text-3xl text-forest mb-2 text-center">
          Find your reservation
        </h1>
        <p className="text-forest/60 text-sm text-center mb-8">
          Enter the confirmation code from your booking email.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="RES-XXXXXX"
            className="w-full border border-line rounded px-4 py-3 text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-brass/50"
          />
          {error && <p className="text-clay text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-forest text-ivory rounded py-3 font-medium tracking-wide hover:bg-forest-light transition-colors"
          >
            Find Reservation
          </button>
        </form>
      </main>
    </div>
  );
}
