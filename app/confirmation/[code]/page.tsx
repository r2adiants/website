"use client";

import { useEffect, useState, use } from "react";
import SiteHeader from "@/components/SiteHeader";
import MailThread from "@/components/MailThread";

interface Reservation {
  id: number;
  confirmation_code: string;
  guest_name: string;
  guest_email: string;
  room_type_name: string;
  room_type_description: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  total_price: number;
  special_requests: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  cancelled: "Cancelled",
};

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reservations/lookup?code=${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setReservation(data.reservation);
          setThreadId(data.threadId);
        }
      });
  }, [code]);

  return (
    <div className="flex flex-col flex-1 bg-ivory-texture">
      <SiteHeader />

      <main className="mx-auto max-w-2xl w-full px-6 py-16 flex-1">
        {error && (
          <p className="text-clay text-center">{error}</p>
        )}

        {reservation && (
          <>
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-[0.2em] text-brass mb-3">
                {STATUS_LABEL[reservation.status]}
              </p>
              <h1 className="font-display text-3xl text-forest mb-2">
                Thank you, {reservation.guest_name.split(" ")[0]}
              </h1>
              <p className="text-forest/60 text-sm">
                Confirmation code:{" "}
                <span className="font-medium text-forest">
                  {reservation.confirmation_code}
                </span>
              </p>
            </div>

            <div className="border border-line rounded-lg bg-white p-6 mb-8">
              <h2 className="font-display text-xl text-forest mb-4">
                {reservation.room_type_name}
              </h2>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-forest/50">Check-in</dt>
                <dd className="text-forest">{reservation.check_in}</dd>
                <dt className="text-forest/50">Check-out</dt>
                <dd className="text-forest">{reservation.check_out}</dd>
                <dt className="text-forest/50">Guests</dt>
                <dd className="text-forest">{reservation.guests}</dd>
                <dt className="text-forest/50">Total</dt>
                <dd className="text-forest font-medium">${reservation.total_price}</dd>
                {reservation.special_requests && (
                  <>
                    <dt className="text-forest/50">Requests</dt>
                    <dd className="text-forest">{reservation.special_requests}</dd>
                  </>
                )}
              </dl>
            </div>

            {threadId && <MailThread threadId={threadId} />}
          </>
        )}
      </main>
    </div>
  );
}
