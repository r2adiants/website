"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed.");
      setLoading(false);
      return;
    }

    router.push("/staff/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-brass text-brass font-display italic text-2xl mb-4">
            A
          </span>
          <h1 className="font-display text-2xl text-ivory">Staff Portal</h1>
          <p className="text-ivory/50 text-sm mt-1">The Aldervale Hotel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-ivory rounded-lg p-6 space-y-4 border border-brass/20"
        >
          <div>
            <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-forest/60 mb-1.5">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass/50"
            />
          </div>

          {error && <p className="text-clay text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-ivory rounded py-2.5 font-medium hover:bg-forest-light transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p className="text-xs text-forest/40 text-center pt-2">
            Default: manager@hotel.rp / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
