"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { isSampleAlbum, type HikingDay, type HikingDayPhoto } from "@/data/hiking-days";
import { Box, BoxHeader } from "@/components/Box";
import { Icon } from "@/components/Icon";
import { EmptyState, Notice, PageHeader, SkeletonRows } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/** Server limits (see /api/hiking-days). */
const MAX_ALBUMS = 13;
const MAX_PHOTOS = 20;
const MAX_TITLE = 200;
const MAX_SUMMARY = 5000;

/** Small secondary button, sized to sit beside btn-cta-sm. */
const btnSecondarySm =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3.5 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-muted disabled:opacity-60";
const btnDangerSm = cn(btnSecondarySm, "text-danger hover:border-danger/60");

type AlbumPayload = { title: string; date: string; summary: string; photos: HikingDayPhoto[] };

type PageNotice = { tone: "success" | "error"; message: string } | { tone: "auth" };

type LoadState = { state: "loading" } | { state: "ready" } | { state: "error"; message: string };

type LoadResult = { state: "ready"; days: HikingDay[] } | { state: "error"; message: string };

async function requestDays(): Promise<LoadResult> {
  try {
    const res = await fetch("/api/hiking-days", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as unknown;
    if (!res.ok || !Array.isArray(data)) {
      const apiError =
        data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "";
      return { state: "error", message: apiError || `Couldn't load albums (error ${res.status}).` };
    }
    return { state: "ready", days: data as HikingDay[] };
  } catch {
    return { state: "error", message: "Couldn't reach the server. Check your connection." };
  }
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; unauthorized: boolean; error: string };

async function api<T>(url: string, init: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, init);
    if (res.status === 401) return { ok: false, unauthorized: true, error: "Your session has ended." };
    const data = (await res.json().catch(() => null)) as (T & { error?: unknown }) | null;
    if (!res.ok) {
      const error = data && typeof data.error === "string" && data.error ? data.error : `Server error (${res.status}).`;
      return { ok: false, unauthorized: false, error };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, unauthorized: false, error: "Couldn't reach the server. Check your connection." };
  }
}

function newPhotoId(): string {
  // randomUUID only exists on secure origins (not http://192.168.x.x on a phone).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const emptyPhoto = (): HikingDayPhoto => ({ id: newPhotoId(), src: "", alt: "" });

function sortDays(days: HikingDay[]): HikingDay[] {
  return [...days].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

/** "Aug 12, 2025". Albums span years, so the year stays. */
function formatAlbumDate(date: string): string {
  if (!date) return "No date";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function isPhotoUrl(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const u = new URL(src);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Move focus to an element after the next render (it may not exist yet). */
function useFocusAfterRender() {
  const target = useRef<string | null>(null);
  useEffect(() => {
    if (!target.current) return;
    document.getElementById(target.current)?.focus();
    target.current = null;
  });
  return (id: string) => {
    target.current = id;
  };
}

export default function AdminHikeAlbumsPage() {
  const [days, setDays] = useState<HikingDay[]>([]);
  const [load, setLoad] = useState<LoadState>({ state: "loading" });
  const [notice, setNotice] = useState<PageNotice | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [brokenThumbs, setBrokenThumbs] = useState<ReadonlySet<string>>(() => new Set());
  const focusSoon = useFocusAfterRender();

  const applyLoad = useCallback((result: LoadResult) => {
    if (result.state === "ready") setDays(sortDays(result.days));
    setLoad(result.state === "ready" ? { state: "ready" } : result);
  }, []);

  useEffect(() => {
    let active = true;
    requestDays().then((result) => {
      if (active) applyLoad(result);
    });
    return () => {
      active = false;
    };
  }, [applyLoad]);

  function retry() {
    setLoad({ state: "loading" });
    requestDays().then(applyLoad);
  }

  function reportFailure(r: { unauthorized: boolean; error: string }, prefix: string): string {
    if (r.unauthorized) {
      setNotice({ tone: "auth" });
      return "Your session has ended. Log in again, then save.";
    }
    setNotice({ tone: "error", message: `${prefix} ${r.error}` });
    return r.error;
  }

  async function createAlbum(payload: AlbumPayload): Promise<string | null> {
    const r = await api<HikingDay>("/api/hiking-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return reportFailure(r, `Couldn't add ‘${payload.title}’.`);
    setDays((d) => sortDays([...d, r.data]));
    setAdding(false);
    setNotice({ tone: "success", message: `Added ‘${r.data.title}’.` });
    focusSoon(`album-edit-${r.data.id}`);
    return null;
  }

  async function updateAlbum(id: string, payload: AlbumPayload): Promise<string | null> {
    const r = await api<HikingDay>(`/api/hiking-days/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return reportFailure(r, `Couldn't save ‘${payload.title}’.`);
    setDays((d) => sortDays(d.map((x) => (x.id === id ? r.data : x))));
    setEditingId(null);
    setNotice({ tone: "success", message: `Saved ‘${r.data.title}’.` });
    focusSoon(`album-edit-${id}`);
    return null;
  }

  async function deleteAlbum(day: HikingDay) {
    setDeletingId(day.id);
    const r = await api<{ ok: boolean }>(`/api/hiking-days/${encodeURIComponent(day.id)}`, { method: "DELETE" });
    setDeletingId(null);
    if (!r.ok) {
      reportFailure(r, `Couldn't delete ‘${day.title}’.`);
      return;
    }
    setDays((d) => d.filter((x) => x.id !== day.id));
    setConfirmId(null);
    if (editingId === day.id) setEditingId(null);
    setNotice({ tone: "success", message: `Deleted ‘${day.title}’.` });
    focusSoon("albums-list");
  }

  function openAdd() {
    setAdding(true);
    focusSoon("album-new-title");
  }

  const ready = load.state === "ready";
  const atLimit = days.length >= MAX_ALBUMS;

  return (
    <div>
      <PageHeader
        title="Albums"
        subtitle={
          <span id="albums-usage">
            {ready ? (
              <>
                <span className="tabular">
                  {days.length} of {MAX_ALBUMS}
                </span>{" "}
                used
                {atLimit ? ". Delete an album to add another." : " · Shown on the public Hikes page"}
              </>
            ) : (
              "Shown on the public Hikes page"
            )}
          </span>
        }
        actions={
          <button
            id="album-add-button"
            type="button"
            className="btn-cta-sm"
            onClick={openAdd}
            disabled={!ready || atLimit}
            aria-describedby={atLimit ? "albums-usage" : undefined}
          >
            Add album
          </button>
        }
      />

      {notice && (
        <div className="mb-4">
          {notice.tone === "auth" ? (
            <Notice tone="warning">
              Your session has ended.{" "}
              <Link href="/admin/login" className="font-semibold text-accent hover:underline">
                Log in again
              </Link>{" "}
              and retry.
            </Notice>
          ) : (
            <Notice
              tone={notice.tone}
              action={
                <button type="button" className={btnSecondarySm} onClick={() => setNotice(null)}>
                  Dismiss
                </button>
              }
            >
              {notice.message}
            </Notice>
          )}
        </div>
      )}

      {adding && ready && !atLimit && (
        <Box className="mb-4">
          <BoxHeader>
            <h2 className="text-[13px] font-semibold text-foreground">New album</h2>
          </BoxHeader>
          <div className="px-4 py-4 sm:px-5">
            <AlbumForm
              idPrefix="album-new"
              initial={null}
              onSubmit={createAlbum}
              onCancel={() => {
                setAdding(false);
                focusSoon("album-add-button");
              }}
            />
          </div>
        </Box>
      )}

      {load.state === "loading" ? (
        <Box>
          <SkeletonRows rows={3} />
        </Box>
      ) : load.state === "error" ? (
        <Notice
          tone="error"
          action={
            <button type="button" className={btnSecondarySm} onClick={retry}>
              Retry
            </button>
          }
        >
          {load.message}
        </Notice>
      ) : days.length === 0 ? (
        <EmptyState
          icon="camera"
          title="No albums yet"
          body="Add photos from a past climb to show them on the Hikes page."
          action={
            !adding ? (
              <button type="button" className="btn-cta-sm" onClick={openAdd}>
                Add album
              </button>
            ) : undefined
          }
        />
      ) : (
        <Box>
          <BoxHeader>
            <h2 id="albums-list" tabIndex={-1} className="text-[13px] font-semibold text-foreground focus:outline-none">
              <span className="tabular">{days.length}</span> {days.length === 1 ? "album" : "albums"}
            </h2>
            <span className="text-xs text-muted">Newest first</span>
          </BoxHeader>
          <ul className="divide-y divide-border">
            {days.map((day) => {
              const photos = day.photos ?? [];
              const cover = photos[0];
              const deleting = deletingId === day.id;

              if (editingId === day.id) {
                return (
                  <li key={day.id} className="px-4 py-4 sm:px-5">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Edit album</h3>
                    <AlbumForm
                      idPrefix={`album-${day.id}`}
                      initial={day}
                      onSubmit={(payload) => updateAlbum(day.id, payload)}
                      onCancel={() => {
                        setEditingId(null);
                        focusSoon(`album-edit-${day.id}`);
                      }}
                    />
                  </li>
                );
              }

              return (
                <li key={day.id} className="px-4 py-3 sm:px-5">
                  <div className="flex gap-3">
                    <Thumb
                      photo={cover && !brokenThumbs.has(cover.src) ? cover : undefined}
                      onError={() => cover && setBrokenThumbs((s) => new Set(s).add(cover.src))}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="min-w-0 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                          {day.title}
                        </h3>
                        {isSampleAlbum(day.id) && (
                          <span className="inline-flex shrink-0 items-center rounded-full border border-warning/40 bg-warning-muted px-2 py-0.5 text-[11px] font-semibold text-warning">
                            Sample · stock photos
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted">
                        <time dateTime={day.date} className="tabular">
                          {formatAlbumDate(day.date)}
                        </time>
                        <span aria-hidden> · </span>
                        <span className="tabular">
                          {photos.length} {photos.length === 1 ? "photo" : "photos"}
                        </span>
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/hikes/${encodeURIComponent(day.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-9 items-center gap-1 rounded-md px-1.5 text-sm font-medium text-accent hover:underline pointer-coarse:min-h-11"
                        >
                          View
                          <Icon name="external" className="h-3.5 w-3.5" />
                          <span className="sr-only">{`${day.title} (opens in a new tab)`}</span>
                        </Link>
                        <button
                          id={`album-edit-${day.id}`}
                          type="button"
                          className={btnSecondarySm}
                          onClick={() => {
                            setConfirmId(null);
                            setEditingId(day.id);
                          }}
                          aria-label={`Edit ${day.title}`}
                        >
                          Edit
                        </button>
                        <button
                          id={`album-delete-${day.id}`}
                          type="button"
                          className={btnDangerSm}
                          onClick={() => setConfirmId(day.id)}
                          aria-label={`Delete ${day.title}`}
                          aria-expanded={confirmId === day.id}
                          aria-controls={confirmId === day.id ? `album-confirm-${day.id}` : undefined}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {confirmId === day.id && (
                    <ConfirmDelete
                      id={`album-confirm-${day.id}`}
                      title={day.title}
                      deleting={deleting}
                      onConfirm={() => deleteAlbum(day)}
                      onCancel={() => {
                        setConfirmId(null);
                        focusSoon(`album-delete-${day.id}`);
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </Box>
      )}
    </div>
  );
}

function Thumb({ photo, onError }: { photo?: HikingDayPhoto; onError: () => void }) {
  if (!photo) {
    return (
      <div
        aria-hidden
        className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated"
      >
        <Icon name="camera" className="h-5 w-5 text-muted" />
      </div>
    );
  }
  return (
    // Album photos are arbitrary external URLs, so next/image would need every host allow-listed.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.src}
      alt={photo.alt}
      width={64}
      height={48}
      loading="lazy"
      decoding="async"
      onError={onError}
      className="h-12 w-16 shrink-0 rounded-md border border-border bg-surface-elevated object-cover"
    />
  );
}

function ConfirmDelete({
  id,
  title,
  deleting,
  onConfirm,
  onCancel,
}: {
  id: string;
  title: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div
      id={id}
      role="group"
      aria-label="Confirm delete"
      className="mt-3 rounded-md bg-danger-muted px-3 py-3"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !deleting) onCancel();
      }}
    >
      <p className="text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
        {`Delete ‘${title}’? This can’t be undone.`}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button type="button" className={btnDangerSm} onClick={onConfirm} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete album"}
        </button>
        <button ref={cancelRef} type="button" className={btnSecondarySm} onClick={onCancel} disabled={deleting}>
          Cancel
        </button>
      </div>
    </div>
  );
}

type FieldErrors = {
  title?: string;
  date?: string;
  summary?: string;
  photos?: Record<string, { src?: string; alt?: string }>;
};

function validate(draft: AlbumPayload): { errors: FieldErrors | null; payload: AlbumPayload } {
  const errors: FieldErrors = {};
  const title = draft.title.trim();
  const summary = draft.summary.trim();

  if (!title) errors.title = "Add a title.";
  else if (title.length > MAX_TITLE) errors.title = `Keep it under ${MAX_TITLE} characters.`;

  if (!draft.date) errors.date = "Pick the hike date.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errors.date = "Use a full date.";

  if (!summary) errors.summary = "Add a short recap.";
  else if (summary.length > MAX_SUMMARY) errors.summary = `Keep it under ${MAX_SUMMARY} characters.`;

  const photos: HikingDayPhoto[] = [];
  const photoErrors: NonNullable<FieldErrors["photos"]> = {};
  for (const p of draft.photos) {
    const src = p.src.trim();
    const alt = p.alt.trim();
    if (!src && !alt) continue; // blank rows are ignored
    const e: { src?: string; alt?: string } = {};
    if (!src) e.src = "Paste the photo link, or remove this row.";
    else if (!isPhotoUrl(src)) e.src = "Use a full link starting with https://";
    if (!alt) e.alt = "Describe the photo.";
    if (e.src || e.alt) photoErrors[p.id] = e;
    else photos.push({ id: p.id, src, alt });
  }
  if (Object.keys(photoErrors).length) errors.photos = photoErrors;

  const hasErrors = Boolean(errors.title || errors.date || errors.summary || errors.photos);
  return { errors: hasErrors ? errors : null, payload: { title, date: draft.date, summary, photos } };
}

function AlbumForm({
  idPrefix,
  initial,
  onSubmit,
  onCancel,
}: {
  idPrefix: string;
  initial: HikingDay | null;
  onSubmit: (payload: AlbumPayload) => Promise<string | null>;
  onCancel: () => void;
}) {
  const uid = useId();
  const [draft, setDraft] = useState<AlbumPayload>(() => ({
    title: initial?.title ?? "",
    date: initial?.date ?? "",
    summary: initial?.summary ?? "",
    photos: initial?.photos?.length ? initial.photos.map((p) => ({ ...p })) : [emptyPhoto()],
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const ids = {
    title: `${idPrefix}-title`,
    date: `${idPrefix}-date`,
    summary: `${idPrefix}-summary`,
    photosHelp: `${uid}-photos-help`,
    submitError: `${uid}-submit-error`,
    src: (photoId: string) => `${uid}-src-${photoId}`,
    alt: (photoId: string) => `${uid}-alt-${photoId}`,
  };

  useEffect(() => {
    document.getElementById(`${idPrefix}-title`)?.focus();
  }, [idPrefix]);

  function setPhoto(index: number, field: "src" | "alt", value: string) {
    setDraft((d) => ({ ...d, photos: d.photos.map((p, i) => (i === index ? { ...p, [field]: value } : p)) }));
  }

  function removePhoto(index: number) {
    const next = draft.photos[index + 1] ?? draft.photos[index - 1];
    setDraft((d) => ({ ...d, photos: d.photos.filter((_, i) => i !== index) }));
    // Keep keyboard users in the list instead of dropping focus to the page.
    requestAnimationFrame(() => {
      document.getElementById(next ? ids.src(next.id) : `${uid}-add-photo`)?.focus();
    });
  }

  function addPhoto() {
    const photo = emptyPhoto();
    setDraft((d) => ({ ...d, photos: [...d.photos, photo] }));
    requestAnimationFrame(() => document.getElementById(ids.src(photo.id))?.focus());
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const { errors: found, payload } = validate(draft);
    if (found) {
      setErrors(found);
      setSubmitError(null);
      const firstPhoto = draft.photos.find((p) => found.photos?.[p.id]);
      const first = found.title
        ? ids.title
        : found.date
          ? ids.date
          : found.summary
            ? ids.summary
            : firstPhoto
              ? found.photos![firstPhoto.id].src
                ? ids.src(firstPhoto.id)
                : ids.alt(firstPhoto.id)
              : null;
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSaving(true);
    const error = await onSubmit(payload);
    // On success the parent closes this form.
    if (error) {
      setSaving(false);
      setSubmitError(error);
    }
  }

  const fieldError = (id: string, msg?: string) =>
    msg ? (
      <p id={`${id}-error`} className="mt-1 text-[13px] text-danger">
        {msg}
      </p>
    ) : null;

  const labelCls = "block text-[13px] font-medium text-foreground";
  const required = (
    <span className="text-danger" aria-hidden>
      {" *"}
    </span>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <div>
          <label htmlFor={ids.title} className={labelCls}>
            Title{required}
          </label>
          <input
            id={ids.title}
            value={draft.title}
            maxLength={MAX_TITLE}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            aria-required
            aria-invalid={Boolean(errors.title) || undefined}
            aria-describedby={errors.title ? `${ids.title}-error` : undefined}
            className="field-input mt-1"
            placeholder="August summit push, Sta. Cruz trail"
          />
          {fieldError(ids.title, errors.title)}
        </div>
        <div>
          <label htmlFor={ids.date} className={labelCls}>
            Hike date{required}
          </label>
          <input
            id={ids.date}
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            aria-required
            aria-invalid={Boolean(errors.date) || undefined}
            aria-describedby={errors.date ? `${ids.date}-error` : undefined}
            className="field-input mt-1"
          />
          {fieldError(ids.date, errors.date)}
        </div>
      </div>

      <div>
        <label htmlFor={ids.summary} className={labelCls}>
          Summary{required}
        </label>
        <textarea
          id={ids.summary}
          rows={4}
          value={draft.summary}
          maxLength={MAX_SUMMARY}
          onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
          aria-required
          aria-invalid={Boolean(errors.summary) || undefined}
          aria-describedby={errors.summary ? `${ids.summary}-error` : undefined}
          className="field-input mt-1"
          placeholder="A short recap of the day"
        />
        {fieldError(ids.summary, errors.summary)}
      </div>

      <fieldset aria-describedby={ids.photosHelp}>
        <legend className="text-[13px] font-medium text-foreground">
          Photos{" "}
          <span className="tabular font-normal text-muted">
            {draft.photos.length} of {MAX_PHOTOS}
          </span>
        </legend>
        <p id={ids.photosHelp} className="mt-0.5 text-[13px] text-muted">
          Paste image links. The first photo is the cover.
        </p>

        {draft.photos.length > 0 && (
          <ol className="mt-3 space-y-3">
            {draft.photos.map((photo, i) => {
              const err = errors.photos?.[photo.id];
              return (
                <li key={photo.id}>
                  <p className="mb-1 text-xs font-semibold text-muted">
                    Photo {i + 1}
                    {i === 0 ? " · cover" : ""}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
                    <div className="min-w-0">
                      <label htmlFor={ids.src(photo.id)} className="sr-only">
                        Photo {i + 1} link
                      </label>
                      <input
                        id={ids.src(photo.id)}
                        type="url"
                        inputMode="url"
                        autoComplete="off"
                        value={photo.src}
                        onChange={(e) => setPhoto(i, "src", e.target.value)}
                        aria-invalid={Boolean(err?.src) || undefined}
                        aria-describedby={err?.src ? `${ids.src(photo.id)}-error` : undefined}
                        className="field-input"
                        placeholder="https://"
                      />
                      {fieldError(ids.src(photo.id), err?.src)}
                    </div>
                    <div className="min-w-0">
                      <label htmlFor={ids.alt(photo.id)} className="sr-only">
                        Photo {i + 1} description
                      </label>
                      <input
                        id={ids.alt(photo.id)}
                        value={photo.alt}
                        onChange={(e) => setPhoto(i, "alt", e.target.value)}
                        aria-invalid={Boolean(err?.alt) || undefined}
                        aria-describedby={err?.alt ? `${ids.alt(photo.id)}-error` : undefined}
                        className="field-input"
                        placeholder="What's in the photo"
                      />
                      {fieldError(ids.alt(photo.id), err?.alt)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className={cn(btnSecondarySm, "sm:w-9 sm:px-0")}
                      aria-label={`Remove photo ${i + 1}`}
                    >
                      <Icon name="close" className="h-4 w-4 text-muted" />
                      <span className="sm:hidden">Remove</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <button
          id={`${uid}-add-photo`}
          type="button"
          onClick={addPhoto}
          disabled={draft.photos.length >= MAX_PHOTOS}
          className={cn(btnSecondarySm, "mt-3")}
        >
          Add photo
        </button>
      </fieldset>

      {submitError && (
        <p id={ids.submitError} className="flex items-start gap-1.5 text-sm text-danger">
          <Icon name="close" className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{submitError}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="btn-cta-sm"
          disabled={saving}
          aria-describedby={submitError ? ids.submitError : undefined}
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Publish album"}
        </button>
        <button type="button" className={btnSecondarySm} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
