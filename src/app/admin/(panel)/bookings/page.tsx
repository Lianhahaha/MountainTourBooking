"use client";

import { useEffect, useState } from "react";
import type { BookingRequest, BookingStatus } from "@/types";
import { formatDate, formatPrice, cn } from "@/lib/utils";

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        status === "pending" && "bg-surface-elevated text-muted border border-border",
        status === "confirmed" && "bg-primary-muted text-primary",
        status === "cancelled" && "bg-danger-muted text-danger"
      )}
    >
      {status}
    </span>
  );
}

function BookingCard({
  booking,
  onUpdate,
}: {
  booking: BookingRequest;
  onUpdate: () => void;
}) {
  const [acting, setActing] = useState(false);
  const [ownerNote, setOwnerNote] = useState("");
  const [message, setMessage] = useState("");

  async function updateStatus(status: "confirmed" | "cancelled") {
    const label = status === "confirmed" ? "approve" : "decline";
    if (!confirm(`${status === "confirmed" ? "Approve" : "Decline"} booking ${booking.id}? The hiker will receive an email.`)) {
      return;
    }

    setActing(true);
    setMessage("");

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ownerNote: ownerNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed to ${label}`);

      setMessage(
        status === "confirmed"
          ? `Approved — confirmation email sent to ${booking.email}`
          : `Declined — notification email sent to ${booking.email}`
      );
      onUpdate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(false);
    }
  }

  return (
    <article className="rounded-md border border-border bg-surface p-2.5 text-xs sm:p-5 sm:text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-foreground">{booking.tripTitle}</p>
          <p className="text-muted">{booking.id}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-4 grid gap-2 text-muted sm:grid-cols-2">
        <p><span className="font-medium text-foreground">Lead:</span> {booking.leadName}</p>
        <p><span className="font-medium text-foreground">Email:</span> {booking.email}</p>
        <p><span className="font-medium text-foreground">Phone:</span> {booking.phone}</p>
        <p><span className="font-medium text-foreground">Pax:</span> {booking.paxCount} · {formatPrice(booking.estimatedTotal)}</p>
        <p>
          <span className="font-medium text-foreground">Trek date:</span>{" "}
          {booking.preferredDate ? formatDate(booking.preferredDate) : "—"}
          {booking.trekTime ? ` · ${booking.trekTime}` : ""}
        </p>
        <p>
          <span className="font-medium text-foreground">Submitted:</span>{" "}
          {new Date(booking.createdAt).toLocaleString("en-PH")}
        </p>
        <p className="sm:col-span-2">
          <span className="font-medium text-foreground">Emergency:</span>{" "}
          {booking.emergencyContactName} ({booking.emergencyContactPhone})
        </p>
        {booking.participantNames.filter(Boolean).length > 0 && (
          <p className="sm:col-span-2">
            <span className="font-medium text-foreground">Participants:</span>{" "}
            {booking.participantNames.filter(Boolean).join(", ")}
          </p>
        )}
        {booking.notes && (
          <p className="sm:col-span-2">
            <span className="font-medium text-foreground">Notes:</span> {booking.notes}
          </p>
        )}
      </div>

      {booking.status === "pending" && (
        <div className="mt-4 border-t border-border pt-4">
          <label className="block text-xs font-medium text-foreground">
            Optional message to hiker (included in email)
          </label>
          <textarea
            rows={2}
            value={ownerNote}
            onChange={(e) => setOwnerNote(e.target.value)}
            placeholder="e.g. Please arrive 15 minutes early. Bring your own tent."
            className="field-input mt-1"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={acting}
              onClick={() => updateStatus("confirmed")}
              className="btn-cta-sm disabled:opacity-60"
            >
              {acting ? "Processing..." : "Approve & email hiker"}
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => updateStatus("cancelled")}
              className="rounded-md border border-danger/40 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger-muted disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={cn("mt-3 text-xs", message.includes("sent") ? "text-accent" : "text-danger")}>
          {message}
        </p>
      )}
    </article>
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | BookingStatus>("pending");

  function loadBookings() {
    setLoading(true);
    fetch("/api/bookings")
      .then(async (res) => {
        if (res.status === 401) throw new Error("Session expired — please log in again");
        if (!res.ok) throw new Error("Failed to load bookings");
        return res.json();
      })
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const pending = bookings.filter((b) => b.status === "pending");
  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) return <p className="text-muted">Loading booking queue...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div>
      <h1 className="text-lg font-bold text-foreground md:text-2xl">Booking queue</h1>
      <p className="mt-0.5 text-xs text-muted md:mt-1 md:text-base">
        Review requests, approve slots, and hikers get an automatic email when you approve or decline.
      </p>

      {pending.length > 0 && (
        <div className="mt-4 rounded-md border border-border bg-surface-elevated px-4 py-3 text-sm text-muted">
          <strong className="text-foreground">{pending.length}</strong> booking{pending.length !== 1 ? "s" : ""} waiting for your review
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1 md:mt-6 md:gap-2">
        {(["pending", "confirmed", "cancelled", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] sm:text-xs font-medium capitalize transition md:px-3 md:py-1.5 md:text-sm",
                filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-surface-elevated text-muted hover:border-muted hover:text-foreground"
            )}
          >
            {f === "all" ? "All" : f}
            {f !== "all" && (
              <span className="ml-1 opacity-70">
                ({bookings.filter((b) => b.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-muted">
          {filter === "pending" ? "No pending bookings — you're all caught up!" : "No bookings in this category."}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((b) => (
            <BookingCard key={b.id} booking={b} onUpdate={loadBookings} />
          ))}
        </div>
      )}
    </div>
  );
}
