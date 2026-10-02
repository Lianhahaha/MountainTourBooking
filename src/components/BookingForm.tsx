"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trips, getTripById } from "@/data/trips";
import { formatDate, formatPrice, cn, todayInManila } from "@/lib/utils";
import type { Trip, TripType, TrekSession } from "@/types";
import { Icon } from "@/components/Icon";

const STEPS = [
  { id: 0, label: "Trek", short: "1" },
  { id: 1, label: "Group", short: "2" },
  { id: 2, label: "Contact", short: "3" },
  { id: 3, label: "Confirm", short: "4" },
];

function shortMonth(date: string): string {
  const d = new Date(date + "T00:00:00");
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-PH", { month: "short" }).toUpperCase();
}

function shortDay(date: string): string {
  const d = new Date(date + "T00:00:00");
  return Number.isNaN(d.getTime()) ? date : String(d.getDate()).padStart(2, "0");
}

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
      .then((data) => setSessions(Array.isArray(data) ? data : []))
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
      // Defer state updates so the effect body stays free of synchronous setState.
      const timer = setTimeout(() => {
        setForm((prev) => ({
          ...prev,
          tripId: preselectedTrip,
          sessionId: preselectedSession,
        }));
        setStep(1);
      }, 0);
      return () => clearTimeout(timer);
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
          const maxPax = selectedTrip?.maxSlots ?? 1;
          return (
            !!form.preferredDate &&
            typeof form.paxCount === "number" &&
            form.paxCount >= 1 &&
            form.paxCount <= maxPax
          );
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
                  {step > s.id ? <Icon name="check" className="h-4 w-4" /> : s.short}
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
            <p className="mt-1 text-sm text-muted">Join a group date or plan a private climb.</p>
            <div className="mt-4 space-y-3">
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
                            <span className="rounded-full border border-done/40 bg-done-muted px-2.5 py-0.5 text-xs font-semibold text-done">
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
                            {sessionCount} date{sessionCount !== 1 ? "s" : ""} open
                          </p>
                        )}
                        <p className="mt-3 text-base font-bold text-foreground">
                          {trip.type === "scheduled"
                            ? sessionsLoading
                              ? "Loading available dates..."
                              : sessionCount > 0
                              ? `${formatPrice(trip.type === "scheduled" && sessionCount === 1 && sessions[0].price ? sessions[0].price : trip.price)}/person`
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
                  <p className="booking-section-label">
                    Choose your hiking day
                    <span className="ml-0.5 text-danger" aria-hidden>
                      *
                    </span>
                    <span className="sr-only"> (required)</span>
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">Only these dates are open. Tap one.</p>
                <div className="mt-3 space-y-3">
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
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div
                              className="w-12 shrink-0 overflow-hidden rounded-md border border-border bg-background text-center"
                              aria-hidden
                            >
                              <p className="bg-accent-muted py-0.5 text-[10px] font-bold tracking-wide text-accent">
                                {shortMonth(session.date)}
                              </p>
                              <p className="tabular py-1 text-lg font-bold leading-none text-foreground">
                                {shortDay(session.date)}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                {formatDate(session.date)}
                              </p>
                              <p className="tabular mt-0.5 text-[13px] text-muted">
                                {session.time} meet-up
                                {session.price ? ` · ${formatPrice(session.price)}/person` : ""}
                              </p>
                              <p
                                className={cn(
                                  "mt-1.5 !py-0.5",
                                  lowSlots ? "booking-slots-low" : "booking-slots-badge"
                                )}
                              >
                                {remaining} slot{remaining !== 1 ? "s" : ""} left
                              </p>
                              {session.notes && (
                                <p className="mt-1.5 text-[13px] text-muted">{session.notes}</p>
                              )}
                            </div>
                          </div>
                          <SelectionIndicator selected={selected} large />
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!form.sessionId && (
                  <p className="mt-3 text-sm font-semibold text-foreground/80">
                    Pick a date first to set your group size.
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
                    min={todayInManila()}
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
              <p className="text-xs font-semibold text-muted">
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
            <p className="mt-1 text-sm text-muted">We confirm by email and SMS. Double-check both.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                <p className="mt-2 text-sm font-semibold text-foreground">Emergency contact</p>
                <p className="text-xs text-muted">Someone we can call on trek day.</p>
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
              <Field label="Notes (optional)" className="sm:col-span-2">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="field-input"
                  placeholder="Experience, gear rental, diet…"
                />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && selectedTrip && (
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">Review & confirm</h2>
            <p className="mt-1 text-sm text-muted">Check your details. We email you once approved.</p>

            <div className="mt-4 space-y-3 rounded-md border border-border bg-surface-elevated p-4 text-sm">
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
                    <p className="text-xs font-semibold text-muted">Meet-up info</p>
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

            <p className="mt-6 text-sm font-bold text-foreground">Tick all four to submit</p>
            <div className="mt-3 space-y-3">
              <ImportantCheckbox
                checked={form.fitnessConfirmed}
                onChange={(v) => setForm({ ...form, fitnessConfirmed: v })}
                label="Everyone is fit for a Hard-rated, multi-day trek."
              />
              <ImportantCheckbox
                checked={form.ageConfirmed}
                onChange={(v) => setForm({ ...form, ageConfirmed: v })}
                label="Everyone is 16+, or 16–17 with a guardian."
              />
              <ImportantCheckbox
                checked={form.waiverAccepted}
                onChange={(v) => setForm({ ...form, waiverAccepted: v })}
                label="We'll follow the guide and leave no trace."
              />
              <ImportantCheckbox
                checked={form.paymentAcknowledged}
                onChange={(v) => setForm({ ...form, paymentAcknowledged: v })}
                label="We pay cash or GCash on trek day. Nothing is charged online."
                emphasized
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              By submitting, you agree to our{" "}
              <a href="/terms" target="_blank" rel="noopener" className="link-accent">
                Terms
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" rel="noopener" className="link-accent">
                Privacy Policy
              </a>{" "}
              (open in a new tab).
            </p>
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
            onClick={() => {
              setError("");
              setStep((s) => s - 1);
            }}
            disabled={step === 0}
            className="btn-secondary w-full disabled:opacity-40 sm:w-auto"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep((s) => s + 1);
              }}
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
    <p className="mt-1 text-sm text-muted">
      <span className="font-semibold text-foreground">{trip.title}</span>
      {" · "}
      {trip.difficulty} · {trip.duration}
      {trip.type === "scheduled" && session && ` · ${trip.meetupPoint}`}
    </p>
  );
}

function SelectionIndicator({ selected, large }: { selected: boolean; large?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 font-bold transition",
        large ? "h-7 w-7 text-sm" : "mt-1 h-6 w-6 text-xs",
        selected
          ? "border-accent/60 bg-accent-muted text-accent"
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
      <label className="text-sm font-semibold text-foreground">
        {label}
        {required && (
          <>
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
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
