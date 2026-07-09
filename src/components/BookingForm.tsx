"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trips, getTripById } from "@/data/trips";
import { formatDate, formatPrice, cn } from "@/lib/utils";
import type { Trip, TripType, TrekSession } from "@/types";

const STEPS = [
  { id: 0, label: "Trek", short: "1" },
  { id: 1, label: "Group", short: "2" },
  { id: 2, label: "Contact", short: "3" },
  { id: 3, label: "Confirm", short: "4" },
];

function sessionSlotsRemaining(session: TrekSession): number {
  return Math.max(0, session.maxSlots - session.bookedCount);
}

interface FormData {
  tripId: string;
  sessionId: string;
  preferredDate: string;
  locationPreference: string;
  paxCount: number | "";
  participantNames: string[];
  leadName: string;
  phone: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  fitnessConfirmed: boolean;
  waiverAccepted: boolean;
  ageConfirmed: boolean;
  paymentAcknowledged: boolean;
}

const initialForm: FormData = {
  tripId: "",
  sessionId: "",
  preferredDate: "",
  locationPreference: "",
  paxCount: 1,
  participantNames: [""],
  leadName: "",
  phone: "",
  email: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
  fitnessConfirmed: false,
  waiverAccepted: false,
  ageConfirmed: false,
  paymentAcknowledged: false,
};

export function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTrip = searchParams.get("trip") ?? "";
  const preselectedSession = searchParams.get("session") ?? "";

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    ...initialForm,
    tripId: preselectedTrip,
    sessionId: preselectedSession,
  });
  const [sessions, setSessions] = useState<TrekSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/trek-sessions?available=true")
      .then((res) => res.json())
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, []);

  useEffect(() => {
    if (sessionsLoading || !preselectedTrip) return;

    const trip = getTripById(preselectedTrip);
    if (!trip) return;

    if (
      preselectedSession &&
      trip.type === "scheduled" &&
      sessions.some(
        (s) => s.id === preselectedSession && sessionSlotsRemaining(s) > 0
      )
    ) {
      setForm((prev) => ({
        ...prev,
        tripId: preselectedTrip,
        sessionId: preselectedSession,
      }));
      setStep(1);
    }
  }, [sessionsLoading, sessions, preselectedTrip, preselectedSession]);

  const selectedTrip = useMemo(
    () => (form.tripId ? getTripById(form.tripId) : undefined),
    [form.tripId]
  );

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === form.sessionId),
    [sessions, form.sessionId]
  );

  const isPrivate = selectedTrip?.type === "private";
  const isScheduled = selectedTrip?.type === "scheduled";
  const estimatedTotal = selectedTrip ? (selectedSession?.price ?? selectedTrip.price) * (Number(form.paxCount) || 1) : 0;
  const maxPaxForStep = isPrivate
    ? selectedTrip?.maxSlots ?? 1
    : selectedSession
      ? sessionSlotsRemaining(selectedSession)
      : 0;

  function updatePaxCount(val: string) {
    let count: number | "" = val === "" ? "" : parseInt(val, 10);
    if (typeof count === "number" && isNaN(count)) count = "";
    
    const numPax = typeof count === "number" ? Math.max(1, count) : 1;
    const names = [...form.participantNames];
    while (names.length < numPax) names.push("");
    while (names.length > numPax) names.pop();
    
    setForm({ ...form, paxCount: count, participantNames: names });
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        if (!form.tripId || !selectedTrip) return false;
        if (isScheduled && sessions.length === 0) return false;
        return true;
      case 1:
        if (isPrivate) {
          return !!form.preferredDate && typeof form.paxCount === "number" && form.paxCount >= 1;
        }
        return (
          !!form.sessionId &&
          !!selectedSession &&
          typeof form.paxCount === "number" &&
          form.paxCount >= 1 &&
          sessionSlotsRemaining(selectedSession) >= form.paxCount
        );
      case 2:
        return (
          !!form.leadName &&
          !!form.phone &&
          !!form.email &&
          !!form.emergencyContactName &&
          !!form.emergencyContactPhone
        );
      case 3:
        return (
          form.fitnessConfirmed &&
          form.waiverAccepted &&
          form.ageConfirmed &&
          form.paymentAcknowledged
        );
      default:
        return false;
    }
  }

  async function handleSubmit() {
    if (!selectedTrip) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: isScheduled ? selectedTrip.id : null,
          sessionId: isScheduled ? form.sessionId : null,
          tripType: selectedTrip.type as TripType,
          tripTitle: selectedTrip.title,
          preferredDate: isPrivate ? form.preferredDate : selectedSession?.date ?? null,
          trekTime: isScheduled ? selectedSession?.time ?? null : null,
          locationPreference: isPrivate ? form.locationPreference : null,
          paxCount: typeof form.paxCount === "number" ? form.paxCount : 1,
          participantNames: form.participantNames.filter(Boolean),
          leadName: form.leadName,
          phone: form.phone,
          email: form.email,
          emergencyContactName: form.emergencyContactName,
          emergencyContactPhone: form.emergencyContactPhone,
          notes: form.notes,
          fitnessConfirmed: form.fitnessConfirmed,
          waiverAccepted: form.waiverAccepted,
          ageConfirmed: form.ageConfirmed,
          estimatedTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");

      router.push(`/book/success?id=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <nav aria-label="Booking progress" className="mb-6">
        <ol className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition",
                    step > s.id && "border border-primary/50 bg-primary-muted text-primary",
                    step === s.id && "border border-primary/60 bg-primary-muted text-primary ring-2 ring-primary/15",
                    step < s.id && "border border-border bg-surface text-muted"
                  )}
                >
                  {step > s.id ? "✓" : s.short}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    step === s.id ? "text-foreground" : "text-muted"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 sm:mx-2",
                    step > s.id ? "bg-primary/40" : "bg-border"
                  )}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="rounded-md border border-border bg-surface p-4 sm:p-6">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">Select your trek</h2>
            <div className="booking-callout mt-3">
              <p className="text-sm font-medium text-foreground">
                Pick one option below to continue.
              </p>
              <p className="mt-1 text-sm text-muted">
                Mt. Apo group trek or a private group booking on your schedule.
              </p>
            </div>
            <div className="mt-6 space-y-3">
              {trips.map((trip) => {
                const noDates = trip.type === "scheduled" && !sessionsLoading && sessions.length === 0;
                const selected = form.tripId === trip.id;
                const sessionCount = trip.type === "scheduled" ? sessions.length : 0;

                return (
                  <button
                    key={trip.id}
                    type="button"
                    disabled={noDates}
                    onClick={() =>
                      setForm({ ...form, tripId: trip.id, sessionId: "" })
                    }
                    className={cn(
                      "booking-option-card",
                      selected ? "booking-option-card--selected" : "booking-option-card--idle",
                      noDates && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-foreground">{trip.title}</span>
                          {trip.type === "private" && (
                            <span className="rounded-full border border-border bg-surface-elevated px-2.5 py-0.5 text-xs font-semibold text-muted">
                              Private
                            </span>
                          )}
                          {noDates && (
                            <span className="rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-bold text-muted">
                              No dates available
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm text-muted">{trip.location}</p>
                        {trip.type === "scheduled" && sessionCount > 0 && !sessionsLoading && (
                          <p className="booking-slots-badge mt-3">
                            {sessionCount} hiking day{sessionCount !== 1 ? "s" : ""} open for booking
                          </p>
                        )}
                        <p className="mt-3 text-base font-bold text-foreground">
                          {trip.type === "scheduled"
                            ? sessionsLoading
                              ? "Loading available dates..."
                              : sessionCount > 0
                              ? `${formatPrice(selectedTrip.type === "scheduled" && sessionCount === 1 && sessions[0].price ? sessions[0].price : trip.price)}/person`
                                : "No hiking days scheduled yet"
                            : `From ${formatPrice(trip.price)}/person · Flexible dates`}
                        </p>
                      </div>
                      <SelectionIndicator selected={selected} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && selectedTrip && (
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">Group details</h2>
            <TripSummary trip={selectedTrip} session={selectedSession} />

            {isScheduled && (
              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="booking-section-label">Choose your hiking day</p>
                  <span className="booking-required-badge">Required</span>
                </div>
                <div className="booking-callout mt-2">
                  <p className="text-sm font-semibold text-foreground">
                    These are the only dates available for group treks.
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    Tap a date below — you cannot book without selecting one.
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  {sessions.map((session) => {
                    const remaining = sessionSlotsRemaining(session);
                    const selected = form.sessionId === session.id;
                    const lowSlots = remaining <= 3;

                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          const max = remaining;
                          setForm({
                            ...form,
                            sessionId: session.id,
                            paxCount: typeof form.paxCount === "number" ? Math.min(form.paxCount, max) : 1,
                          });
                        }}
                        className={cn(
                          "booking-option-card",
                          selected ? "booking-option-card--selected" : "booking-option-card--idle"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="booking-date-badge">
                                {formatDate(session.date)}
                              </span>
                              <span className="booking-time-badge">
                                {session.time}
                              </span>
                            </div>
                            <p className={cn(
                              "mt-3",
                              lowSlots ? "booking-slots-low" : "booking-slots-badge"
                            )}>
                              {remaining} slot{remaining !== 1 ? "s" : ""} left
                              {lowSlots && " — book soon"}
                            </p>
                            {session.price && (
                              <p className="mt-2 text-sm font-semibold text-primary">
                                Special Rate: {formatPrice(session.price)}/person
                              </p>
                            )}
                            {session.notes && (
                              <div className="booking-note-callout">
                                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                                  Meet-up info
                                </p>
                                <p className="mt-1 font-medium">{session.notes}</p>
                              </div>
                            )}
                          </div>
                          <SelectionIndicator selected={selected} large />
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!form.sessionId && (
                  <p className="mt-3 text-sm font-semibold text-foreground/80">
                    ↑ Select a date above to set your group size
                  </p>
                )}
              </div>
            )}

            {isPrivate && (
              <div className="mt-6 space-y-4">
                <ImportantField label="Preferred trek date" required>
                  <input
                    type="date"
                    required
                    value={form.preferredDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                    className="field-input text-base font-semibold"
                  />
                </ImportantField>
                <Field label="Trail preference (optional)">
                  <input
                    type="text"
                    placeholder="e.g. Sta. Cruz trail, Kidapawan trail"
                    value={form.locationPreference}
                    onChange={(e) => setForm({ ...form, locationPreference: e.target.value })}
                    className="field-input"
                  />
                </Field>
              </div>
            )}

            <div className="mt-6">
              <ImportantField
                label="Number of participants"
                required
                hint={
                  isScheduled && selectedSession
                    ? `${sessionSlotsRemaining(selectedSession)} slots available on your selected date`
                    : undefined
                }
              >
                <input
                  type="number"
                  min={1}
                  max={maxPaxForStep || 1}
                  value={form.paxCount}
                  onChange={(e) => updatePaxCount(e.target.value)}
                  className="field-input w-32 text-lg font-bold"
                  disabled={isScheduled && !form.sessionId}
                />
              </ImportantField>
            </div>

            {typeof form.paxCount === "number" && form.paxCount > 1 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Other participant names (optional)</p>
                {form.participantNames.slice(1).map((name, i) => (
                  <input
                    key={i + 1}
                    type="text"
                    placeholder={`Participant ${i + 2}`}
                    value={name}
                    onChange={(e) => {
                      const names = [...form.participantNames];
                      names[i + 1] = e.target.value;
                      setForm({ ...form, participantNames: names });
                    }}
                    className="field-input"
                  />
                ))}
              </div>
            )}

            <div className="booking-total-box mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Estimated total
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{formatPrice(estimatedTotal)}</p>
              <p className="mt-1 text-xs text-muted">Collected in person on trek day</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">Contact information</h2>
            <div className="booking-callout mt-3">
              <p className="text-sm font-semibold text-foreground">
                We will email you when your booking is approved.
              </p>
              <p className="mt-1 text-sm text-muted">
                Double-check your email and phone — these are how we reach you about your trek.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ImportantField label="Full name" required className="sm:col-span-2">
                <input
                  required
                  value={form.leadName}
                  onChange={(e) => setForm({ ...form, leadName: e.target.value })}
                  className="field-input"
                />
              </ImportantField>
              <ImportantField label="Mobile number" required>
                <input
                  required
                  type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="field-input"
                />
              </ImportantField>
              <ImportantField label="Email" required>
                <input
                  required
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="field-input"
                />
              </ImportantField>
              <div className="sm:col-span-2">
                <div className="booking-callout">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    Emergency contact
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Required for all Mt. Apo treks — someone we can call if needed on trail day.
                  </p>
                </div>
              </div>
              <ImportantField label="Emergency contact name" required>
                <input
                  required
                  value={form.emergencyContactName}
                  onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                  className="field-input"
                />
              </ImportantField>
              <ImportantField label="Emergency contact phone" required>
                <input
                  required
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                  className="field-input"
                />
              </ImportantField>
              <Field label="Notes or special requests" className="sm:col-span-2">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="field-input"
                  placeholder="Experience level, gear rental, dietary needs..."
                />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && selectedTrip && (
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">Review & confirm</h2>
            <div className="booking-callout mt-3">
              <p className="text-sm font-semibold text-foreground">
                Check these details carefully before submitting.
              </p>
              <p className="mt-1 text-sm text-muted">
                The owner will review and email you once approved.
              </p>
            </div>

            <div className="mt-6 space-y-3 rounded-md border border-border bg-surface-elevated p-4 text-sm">
              <ReviewRow label="Trek" value={selectedTrip.title} />
              <div className="booking-review-highlight space-y-2">
                <ReviewRow
                  label="Date"
                  value={
                    isPrivate
                      ? formatDate(form.preferredDate)
                      : selectedSession
                        ? formatDate(selectedSession.date)
                        : "—"
                  }
                  highlight
                />
                {isScheduled && selectedSession && (
                  <ReviewRow label="Price per pax" value={formatPrice(selectedSession.price ?? selectedTrip.price)} />
                )}
                {isScheduled && selectedSession && (
                  <ReviewRow label="Meet-up time" value={selectedSession.time} highlight />
                )}
                {isScheduled && selectedSession?.notes && (
                  <div className="border-t border-primary/15 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">Meet-up info</p>
                    <p className="mt-1 font-semibold text-foreground">{selectedSession.notes}</p>
                  </div>
                )}
              </div>
              <ReviewRow label="Participants" value={String(form.paxCount)} />
              <ReviewRow label="Name" value={form.leadName} />
              <ReviewRow label="Email" value={form.email} />
              <ReviewRow label="Phone" value={form.phone} />
              <div className="booking-total-box !p-3">
                <ReviewRow label="Total (on trek day)" value={formatPrice(estimatedTotal)} highlight />
              </div>
            </div>

            <p className="mt-6 text-sm font-bold text-foreground">
              Required confirmations before you submit:
            </p>
            <div className="mt-3 space-y-3">
              <ImportantCheckbox
                checked={form.fitnessConfirmed}
                onChange={(v) => setForm({ ...form, fitnessConfirmed: v })}
                label="I confirm all participants are physically fit for this Hard-rated Mt. Apo trek."
              />
              <ImportantCheckbox
                checked={form.ageConfirmed}
                onChange={(v) => setForm({ ...form, ageConfirmed: v })}
                label="All participants are 16+ (with guardian for 16–17), or I am a guardian booking for a minor."
              />
              <ImportantCheckbox
                checked={form.waiverAccepted}
                onChange={(v) => setForm({ ...form, waiverAccepted: v })}
                label="I agree to follow the guide's instructions and practice leave-no-trace on the trail."
              />
              <ImportantCheckbox
                checked={form.paymentAcknowledged}
                onChange={(v) => setForm({ ...form, paymentAcknowledged: v })}
                label="I understand payment is collected in person on trek day (cash or GCash) — no online payment on this site."
                emphasized
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-md border border-danger/40 bg-danger-muted px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="btn-secondary w-full disabled:opacity-40 sm:w-auto"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="btn-cta w-full disabled:opacity-40 sm:w-auto"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className="btn-cta w-full disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Submitting..." : "Submit booking request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TripSummary({
  trip,
  session,
}: {
  trip: Trip;
  session?: TrekSession;
}) {
  return (
    <div className="booking-callout mt-4">
      <p className="font-bold text-foreground">{trip.title}</p>
      <p className="mt-1 text-sm text-muted">{trip.location} · {trip.difficulty} · {trip.duration}</p>
      {trip.type === "scheduled" && session && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="booking-date-badge">{formatDate(session.date)}</span>
          <span className="booking-time-badge">{session.time}</span>
        </div>
      )}
      {trip.type === "scheduled" && session && (
        <p className="mt-2 text-sm font-medium text-foreground">{trip.meetupPoint}</p>
      )}
      {trip.type === "scheduled" && session?.notes && (
        <div className="booking-note-callout">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Meet-up info</p>
          <p className="mt-1 font-medium">{session.notes}</p>
        </div>
      )}
    </div>
  );
}

function SelectionIndicator({ selected, large }: { selected: boolean; large?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 font-bold transition",
        large ? "h-7 w-7 text-sm" : "mt-1 h-6 w-6 text-xs",
        selected
          ? "border-primary/60 bg-primary-muted text-primary"
          : "border-border bg-surface text-transparent"
      )}
      aria-hidden
    >
      ✓
    </span>
  );
}

function ImportantField({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-bold text-foreground">{label}</label>
        {required && <span className="booking-required-badge">Required</span>}
      </div>
      {hint && <p className="mt-1 text-xs font-medium text-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ImportantCheckbox({
  checked,
  onChange,
  label,
  emphasized,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  emphasized?: boolean;
}) {
  return (
    <label
      className={cn(
        "booking-important-checkbox",
        checked && "booking-important-checkbox--checked",
        emphasized && !checked && "border-primary/35"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
      />
      <span className={cn(
        "text-sm leading-relaxed",
        emphasized ? "font-semibold text-foreground" : "text-foreground"
      )}>
        {label}
      </span>
    </label>
  );
}

function ReviewRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className={cn(highlight ? "font-semibold text-foreground" : "text-muted")}>
        {label}
      </span>
      <span className={cn(
        "text-right",
        highlight ? "text-base font-bold text-foreground" : "font-medium text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
}
