"use client";

import { useEffect, useMemo, useState } from "react";
import type { TrekSession } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import {
  formatWeekdayLabel,
  getMondayOfWeek,
  getWeekDatesFrom,
  shiftWeek,
} from "@/lib/week-dates";

type FormMode = "single" | "bulk";

const sharedDefaults = {
  time: "6:00 AM",
  maxSlots: 12,
  price: "",
  notes: "",
};

function slotsRemaining(session: TrekSession): number {
  return Math.max(0, session.maxSlots - session.bookedCount);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminHikingDaysPage() {
  const [sessions, setSessions] = useState<TrekSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [singleForm, setSingleForm] = useState({ date: "", ...sharedDefaults });
  const [bulkForm, setBulkForm] = useState({
    weekAnchor: todayISO(),
    selectedDates: [] as string[],
    ...sharedDefaults,
  });

  function loadSessions() {
    fetch("/api/trek-sessions")
      .then((res) => res.json())
      .then(setSessions)
      .catch(() => setError("Failed to load hiking days"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSessions();
  }, []);

  const weekDates = useMemo(
    () => getWeekDatesFrom(bulkForm.weekAnchor),
    [bulkForm.weekAnchor]
  );

  const weekMonday = getMondayOfWeek(bulkForm.weekAnchor);
  const weekSunday = weekDates[6];

  function openForm(mode: FormMode) {
    setFormMode(mode);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setFormMode(null);
    setError("");
    setSuccess("");
  }

  function sessionExistsForDateTime(date: string, time: string): boolean {
    const normalizedTime = time.trim().toLowerCase();
    return sessions.some(
      (s) =>
        s.date === date &&
        s.time.trim().toLowerCase() === normalizedTime &&
        s.status !== "cancelled"
    );
  }

  function toggleBulkDate(date: string) {
    setBulkForm((prev) => {
      const selected = prev.selectedDates.includes(date)
        ? prev.selectedDates.filter((d) => d !== date)
        : [...prev.selectedDates, date];
      return { ...prev, selectedDates: selected };
    });
  }

  function selectAllAvailableInWeek() {
    const available = weekDates.filter(
      (date) =>
        date >= todayISO() && !sessionExistsForDateTime(date, bulkForm.time)
    );
    setBulkForm((prev) => ({ ...prev, selectedDates: available }));
  }

  function clearBulkSelection() {
    setBulkForm((prev) => ({ ...prev, selectedDates: [] }));
  }

  async function handleSingleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/trek-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...singleForm,
          maxSlots: typeof singleForm.maxSlots === "number" ? singleForm.maxSlots : parseInt(singleForm.maxSlots as any, 10) || 12,
          price: singleForm.price ? parseFloat(singleForm.price) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");

      setSingleForm({ date: "", ...sharedDefaults });
      closeForm();
      loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/trek-sessions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: bulkForm.selectedDates,
          time: bulkForm.time,
          maxSlots: typeof bulkForm.maxSlots === "number" ? bulkForm.maxSlots : parseInt(bulkForm.maxSlots as any, 10) || 12,
          notes: bulkForm.notes,
          price: bulkForm.price ? parseFloat(bulkForm.price) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");

      const createdCount = data.created?.length ?? 0;
      const skippedCount = data.skipped?.length ?? 0;
      let message = `Added ${createdCount} hiking ${createdCount === 1 ? "day" : "days"}.`;
      if (skippedCount > 0) {
        message += ` ${skippedCount} skipped (already scheduled or in the past).`;
      }

      setBulkForm({
        weekAnchor: todayISO(),
        selectedDates: [],
        ...sharedDefaults,
      });
      setSuccess(message);
      loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this hiking day? Existing bookings will keep their date.")) return;
    const res = await fetch(`/api/trek-sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) loadSessions();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this hiking day permanently?")) return;
    const res = await fetch(`/api/trek-sessions/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not delete");
      return;
    }
    loadSessions();
  }

  if (loading) return <p className="text-muted">Loading hiking days...</p>;

  const upcoming = sessions.filter((s) => s.date >= todayISO());
  const past = sessions.filter((s) => s.date < todayISO());

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground md:text-2xl">Hiking days</h1>
          <p className="mt-0.5 text-xs text-muted md:mt-1 md:text-base">
            Set the dates and meet-up times hikers can book. Only days listed here appear in the
            booking form.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => (formMode === "bulk" ? closeForm() : openForm("bulk"))}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors md:px-4 md:py-2 md:text-sm",
              formMode === "bulk"
                ? "border-border bg-surface-elevated text-foreground"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            {formMode === "bulk" ? "Cancel" : "Add multiple days"}
          </button>
          <button
            type="button"
            onClick={() => (formMode === "single" ? closeForm() : openForm("single"))}
            className="btn-cta-sm !px-2.5 !py-1 !text-xs md:!px-4 md:!py-2 md:!text-sm"
          >
            {formMode === "single" ? "Cancel" : "Add hiking day"}
          </button>
        </div>
      </div>

      {formMode === "single" && (
        <form
          onSubmit={handleSingleCreate}
          className="mt-6 space-y-4 rounded-md border border-border bg-surface p-5"
        >
          <p className="text-sm text-muted">Add one hiking day at a time.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Date *</label>
              <input
                required
                type="date"
                min={todayISO()}
                value={singleForm.date}
                onChange={(e) => setSingleForm({ ...singleForm, date: e.target.value })}
                className="field-input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Meet-up time *</label>
              <input
                required
                type="text"
                placeholder="e.g. 6:00 AM"
                value={singleForm.time}
                onChange={(e) => setSingleForm({ ...singleForm, time: e.target.value })}
                className="field-input mt-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Max slots *</label>
            <input
              required
              type="number"
              min={1}
              max={50}
              value={singleForm.maxSlots}
              onChange={(e) => {
                const val = e.target.value;
                setSingleForm({ ...singleForm, maxSlots: val === "" ? "" as any : parseInt(val, 10) });
              }}
              className="field-input mt-1 w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Custom price / pax (optional)</label>
            <input
              type="number"
              min={1}
              placeholder="e.g. 2500"
              value={singleForm.price}
              onChange={(e) => setSingleForm({ ...singleForm, price: e.target.value })}
              className="field-input mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground">
              Notes for hikers (optional)
            </label>
            <textarea
              rows={2}
              value={singleForm.notes || ""}
              onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
              className="field-input mt-1"
              placeholder="e.g. Sta. Cruz trail jump-off. Meet at DENR checkpoint."
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={saving} className="btn-cta-sm !px-5 disabled:opacity-60">
            {saving ? "Saving..." : "Add hiking day"}
          </button>
        </form>
      )}

      {formMode === "bulk" && (
        <form
          onSubmit={handleBulkCreate}
          className="mt-6 space-y-4 rounded-md border border-border bg-surface p-5"
        >
          <p className="text-sm text-muted">
            Pick the days you are free this week, fill in the details once, and add them all at
            once.
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground">Week</label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setBulkForm((prev) => ({
                    ...prev,
                    weekAnchor: shiftWeek(prev.weekAnchor, -1),
                    selectedDates: [],
                  }))
                }
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
              >
                ← Prev
              </button>
              <span className="text-sm text-foreground">
                {formatDate(weekMonday)} – {formatDate(weekSunday)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setBulkForm((prev) => ({
                    ...prev,
                    weekAnchor: shiftWeek(prev.weekAnchor, 1),
                    selectedDates: [],
                  }))
                }
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
              >
                Next →
              </button>
              <input
                type="date"
                value={bulkForm.weekAnchor}
                onChange={(e) =>
                  setBulkForm((prev) => ({
                    ...prev,
                    weekAnchor: e.target.value,
                    selectedDates: [],
                  }))
                }
                className="field-input ml-auto"
              />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-medium text-foreground">
                Select days * ({bulkForm.selectedDates.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllAvailableInWeek}
                  className="text-xs text-muted hover:text-foreground hover:underline"
                >
                  Select all available
                </button>
                <button
                  type="button"
                  onClick={clearBulkSelection}
                  className="text-xs text-muted hover:text-foreground hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {weekDates.map((date) => {
                const isPast = date < todayISO();
                const alreadyScheduled = sessionExistsForDateTime(date, bulkForm.time);
                const disabled = isPast || alreadyScheduled;
                const checked = bulkForm.selectedDates.includes(date);

                return (
                  <label
                    key={date}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                      disabled
                        ? "cursor-not-allowed border-border/50 opacity-50"
                        : checked
                          ? "border-primary bg-primary-muted/30"
                          : "border-border hover:border-primary/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleBulkDate(date)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {formatWeekdayLabel(date)}
                      </span>
                      {isPast && (
                        <span className="text-xs text-muted">Past date</span>
                      )}
                      {!isPast && alreadyScheduled && (
                        <span className="text-xs text-muted">Already scheduled at this time</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Meet-up time *</label>
              <input
                required
                type="text"
                placeholder="e.g. 6:00 AM"
                value={bulkForm.time}
                onChange={(e) => setBulkForm({ ...bulkForm, time: e.target.value })}
                className="field-input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Max slots *</label>
              <input
                required
                type="number"
                min={1}
                max={50}
                value={bulkForm.maxSlots}
                onChange={(e) => {
                  const val = e.target.value;
                  setBulkForm({ ...bulkForm, maxSlots: val === "" ? "" as any : parseInt(val, 10) });
                }}
                className="field-input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Custom price / pax (optional)</label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 2500"
                value={bulkForm.price}
                onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                className="field-input mt-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Notes for hikers (optional)
            </label>
            <textarea
              rows={2}
              value={bulkForm.notes || ""}
              onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })}
              className="field-input mt-1"
              placeholder="e.g. Sta. Cruz trail jump-off. Meet at DENR checkpoint."
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-primary">{success}</p>}
          <button
            type="submit"
            disabled={saving || bulkForm.selectedDates.length === 0}
            className="btn-cta-sm !px-5 disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : `Add ${bulkForm.selectedDates.length} hiking ${bulkForm.selectedDates.length === 1 ? "day" : "days"}`}
          </button>
        </form>
      )}

      <SessionList
        title="Upcoming"
        sessions={upcoming}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onUpdated={loadSessions}
      />
      {past.length > 0 && (
        <SessionList
          title="Past"
          sessions={past}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onUpdated={loadSessions}
          muted
        />
      )}
    </div>
  );
}

function SessionList({
  title,
  sessions,
  onCancel,
  onDelete,
  onUpdated,
  muted,
}: {
  title: string;
  sessions: TrekSession[];
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdated: () => void;
  muted?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    time: "",
    maxSlots: 12,
    price: "",
    notes: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  function startEdit(session: TrekSession) {
    setEditingId(session.id);
    setEditForm({
      date: session.date || "",
      time: session.time || "",
      maxSlots: session.maxSlots || 1,
      price: session.price ? session.price.toString() : "",
      notes: session.notes || "",
    });
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  async function handleSaveEdit(e: React.FormEvent, session: TrekSession) {
    e.preventDefault();
    setEditSaving(true);
    setEditError("");

    try {
      const res = await fetch(`/api/trek-sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          maxSlots: typeof editForm.maxSlots === "number" ? editForm.maxSlots : parseInt(editForm.maxSlots as any, 10) || 12,
          price: editForm.price ? parseFloat(editForm.price) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");

      setEditingId(null);
      onUpdated();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setEditSaving(false);
    }
  }

  if (sessions.length === 0) return null;

  return (
    <div className={cn("mt-6 md:mt-8", muted && "opacity-70")}>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 md:mt-3 md:space-y-3">
        {sessions.map((session) => {
          const remaining = slotsRemaining(session);
          const isCancelled = session.status === "cancelled";
          const isFull = session.status === "full" || remaining === 0;
          const isEditing = editingId === session.id;

          return (
            <article
              key={session.id}
              className="rounded-md border border-border bg-surface p-2.5 md:p-4"
            >
              {isEditing ? (
                <form onSubmit={(e) => handleSaveEdit(e, session)} className="space-y-4">
                  <p className="font-semibold text-foreground">Edit hiking day</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-foreground">Date *</label>
                      <input
                        required
                        type="date"
                        min={todayISO()}
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="field-input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Meet-up time *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 6:00 AM"
                        value={editForm.time}
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                        className="field-input mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Max slots *</label>
                    <input
                      required
                      type="number"
                      min={Math.max(1, session.bookedCount)}
                      max={50}
                      value={editForm.maxSlots}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditForm({
                          ...editForm,
                          maxSlots: val === "" ? "" as any : parseInt(val, 10),
                        });
                      }}
                      className="field-input mt-1 w-32"
                    />
                    {session.bookedCount > 0 && (
                      <p className="mt-1 text-xs text-muted">
                        Minimum {session.bookedCount} ({session.bookedCount} already booked)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Custom price / pax (optional)</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 2500"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="field-input mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground">
                      Notes for hikers (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.notes || ""}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="field-input mt-1"
                    />
                  </div>
                  {editError && <p className="text-sm text-danger">{editError}</p>}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={editSaving}
                      className="btn-cta-sm !px-5 disabled:opacity-60"
                    >
                      {editSaving ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-sm text-muted hover:text-foreground hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {formatDate(session.date)} · {session.time}
                      </p>
                      {isCancelled && (
                        <span className="rounded-full bg-danger-muted px-2 py-0.5 text-xs font-medium text-danger">
                          Cancelled
                        </span>
                      )}
                      {!isCancelled && isFull && (
                        <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs font-medium text-muted">
                          Full
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {session.bookedCount} / {session.maxSlots} booked
                      {!isCancelled && !isFull && ` · ${remaining} slots left`}
                      {session.price && ` · ₱${session.price.toLocaleString()}/pax`}
                    </p>
                    {session.notes && (
                      <p className="mt-2 text-sm text-muted">{session.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => startEdit(session)}
                        className="text-sm text-muted hover:text-foreground hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {!isCancelled && session.bookedCount === 0 && (
                      <button
                        type="button"
                        onClick={() => onDelete(session.id)}
                        className="text-sm text-danger hover:underline"
                      >
                        Delete
                      </button>
                    )}
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => onCancel(session.id)}
                        className="text-sm text-muted hover:text-foreground hover:underline"
                      >
                        Cancel day
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
