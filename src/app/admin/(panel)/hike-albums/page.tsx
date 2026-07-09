"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HikingDay, HikingDayPhoto } from "@/data/hiking-days";
import { formatDate } from "@/lib/utils";

const emptyPhoto = (): HikingDayPhoto => ({
  id: crypto.randomUUID(),
  src: "",
  alt: "",
});

export default function AdminHikeAlbumsPage() {
  const [days, setDays] = useState<HikingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    date: "",
    photos: [emptyPhoto()],
  });

  function loadDays() {
    fetch("/api/hiking-days")
      .then((res) => res.json())
      .then(setDays)
      .catch(() => setError("Failed to load hike albums"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDays();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const photos = form.photos.filter((p) => p.src.trim() && p.alt.trim());

    try {
      const res = await fetch("/api/hiking-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");

      setForm({ title: "", summary: "", date: "", photos: [emptyPhoto()] });
      setShowForm(false);
      loadDays();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this hike album?")) return;
    const res = await fetch(`/api/hiking-days/${id}`, { method: "DELETE" });
    if (res.ok) loadDays();
  }

  function updatePhoto(index: number, field: keyof HikingDayPhoto, value: string) {
    const photos = [...form.photos];
    photos[index] = { ...photos[index], [field]: value };
    setForm({ ...form, photos });
  }

  if (loading) return <p className="text-muted">Loading hike albums...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground md:text-2xl">Hike albums</h1>
          <p className="mt-0.5 text-xs text-muted md:mt-1 md:text-base">
            Add photo albums from past treks — title, summary, and photos appear on the public
            Hikes page.
          </p>
        </div>
        {days.length >= 13 && !showForm ? (
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Album limit reached (13/13). Delete one to add more.
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="btn-cta-sm !px-2.5 !py-1 !text-xs md:!px-4 md:!py-2 md:!text-sm"
          >
            {showForm ? "Cancel" : "Add album"}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 space-y-4 rounded-md border border-border bg-surface p-5"
        >
          <div>
            <label className="block text-sm font-medium text-foreground">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="field-input mt-1"
              placeholder="e.g. August Summit Push — Sta. Cruz Trail"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Hike date *</label>
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="field-input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Summary *</label>
            <textarea
              required
              rows={4}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="field-input mt-1"
              placeholder="Write a short recap of the hike day..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Photos ({form.photos.length}/20)</label>
              {form.photos.length < 20 && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, photos: [...form.photos, emptyPhoto()] })}
                  className="text-sm text-accent hover:underline"
                >
                  + Add photo
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              Use image URLs for now. Firebase Storage can handle uploads later.
            </p>
            <div className="mt-3 space-y-3">
              {form.photos.map((photo, i) => (
                <div key={photo.id} className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={photo.src}
                    onChange={(e) => updatePhoto(i, "src", e.target.value)}
                    className="field-input"
                  />
                  <input
                    type="text"
                    placeholder="Alt text / caption"
                    value={photo.alt}
                    onChange={(e) => updatePhoto(i, "alt", e.target.value)}
                    className="field-input"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="btn-cta-sm !px-5 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Publish album"}
          </button>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {days.map((day) => (
          <article
            key={day.id}
            className="flex flex-wrap items-start justify-between gap-2.5 rounded-md border border-border bg-surface p-2.5 md:gap-3 md:p-4"
          >
            <div>
              <p className="font-semibold text-foreground">{day.title}</p>
              <p className="text-sm text-muted">{formatDate(day.date)} · {day.photos.length} photos</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{day.summary}</p>
              <Link
                href={`/hikes/${day.id}`}
                className="mt-2 inline-block text-sm text-accent hover:underline"
                target="_blank"
              >
                View public page →
              </Link>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(day.id)}
              className="text-sm text-danger hover:underline"
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
