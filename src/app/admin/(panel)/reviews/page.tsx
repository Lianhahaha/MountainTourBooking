"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Review, ReviewStatus } from "@/lib/reviews";
import { Box, BoxHeader } from "@/components/Box";
import { Icon, type IconName } from "@/components/Icon";
import { CountPill, EmptyState, Notice, PageHeader, SkeletonRows } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const UNDO_MS = 8000;

/** Small secondary button, sized to sit beside btn-cta-sm. */
const btnSecondarySm =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3.5 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-muted disabled:opacity-60";

const TABS: {
  status: ReviewStatus;
  label: string;
  order: string;
  empty: { icon: IconName; title: string; body: string };
}[] = [
  {
    status: "pending",
    label: "Pending",
    order: "Oldest first",
    empty: { icon: "check", title: "No reviews waiting", body: "New reviews from hikers land here for you to check." },
  },
  {
    status: "approved",
    label: "Published",
    order: "Newest first",
    empty: { icon: "star", title: "Nothing published yet", body: "Publish a pending review to show it on the homepage." },
  },
  {
    status: "rejected",
    label: "Hidden",
    order: "Newest first",
    empty: { icon: "chat", title: "No hidden reviews", body: "Reviews you hide stay here. You can publish them later." },
  },
];

const tabLabel = (s: ReviewStatus) => TABS.find((t) => t.status === s)!.label;

type LoadState =
  | { state: "loading" }
  | { state: "ready" }
  | { state: "unauthorized" }
  | { state: "error"; message: string };

type FlashInput =
  | { tone: "success"; message: string; undo?: { id: string; to: ReviewStatus } }
  | { tone: "error"; message: string }
  | { tone: "auth" };
type Flash = FlashInput & { key: number };

type LoadResult =
  | { state: "ready"; reviews: Review[] }
  | { state: "unauthorized" }
  | { state: "error"; message: string };

async function requestReviews(): Promise<LoadResult> {
  try {
    const res = await fetch("/api/reviews", { cache: "no-store" });
    if (res.status === 401) return { state: "unauthorized" };
    const data = (await res.json().catch(() => null)) as { reviews?: Review[]; error?: string | null } | null;
    if (!res.ok || !data || !Array.isArray(data.reviews) || data.error) {
      return { state: "error", message: data?.error || `Couldn't load reviews (error ${res.status}).` };
    }
    return { state: "ready", reviews: data.reviews };
  } catch {
    return { state: "error", message: "Couldn't reach the server. Check your connection." };
  }
}

type SendResult = { ok: true } | { ok: false; unauthorized: boolean; error: string };

/** Approve/hide go through /api/reviews/approve; only Undo back to pending needs PATCH /api/reviews. */
async function sendStatus(id: string, status: ReviewStatus): Promise<SendResult> {
  const toPending = status === "pending";
  try {
    const res = await fetch(toPending ? "/api/reviews" : "/api/reviews/approve", {
      method: toPending ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.status === 401) return { ok: false, unauthorized: true, error: "Your session has ended." };
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!res.ok || !data?.ok) {
      return { ok: false, unauthorized: false, error: data?.error || `Server error (${res.status}).` };
    }
    return { ok: true };
  } catch {
    return { ok: false, unauthorized: false, error: "Couldn't reach the server. Check your connection." };
  }
}

function successMessage(to: ReviewStatus): string {
  if (to === "approved") return "Published — it now shows on the homepage";
  if (to === "rejected") return "Hidden from the homepage";
  return "Moved back to pending";
}

function failMessage(to: ReviewStatus, name: string, isUndo: boolean): string {
  const who = name ? `${name}'s review` : "the review";
  if (isUndo) return `Couldn't undo the change to ${who}.`;
  return to === "approved" ? `Couldn't publish ${who}.` : `Couldn't hide ${who}.`;
}

function formatReviewDate(iso: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Stars({ rating }: { rating: number }) {
  const n = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          filled={i <= n}
          className={cn("h-4 w-4", i <= n ? "text-warning" : "text-muted")}
        />
      ))}
      <span className="sr-only">{n} out of 5</span>
    </span>
  );
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [load, setLoad] = useState<LoadState>({ state: "loading" });
  const [tab, setTab] = useState<ReviewStatus>("pending");
  const [saving, setSaving] = useState<ReadonlySet<string>>(() => new Set());
  const [flash, setFlash] = useState<Flash | null>(null);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashKey = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<ReviewStatus, HTMLButtonElement | null>>>({});

  const applyLoad = useCallback((result: LoadResult) => {
    if (result.state === "ready") setReviews(result.reviews);
    setLoad(result.state === "ready" ? { state: "ready" } : result);
  }, []);

  useEffect(() => {
    let active = true;
    requestReviews().then((result) => {
      if (active) applyLoad(result);
    });
    return () => {
      active = false;
    };
  }, [applyLoad]);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  function clearFlashTimer() {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = null;
  }

  function startFlashTimer(key: number) {
    clearFlashTimer();
    flashTimer.current = setTimeout(() => {
      setFlash((cur) => (cur?.key === key ? null : cur));
    }, UNDO_MS);
  }

  function showFlash(input: FlashInput) {
    clearFlashTimer();
    const key = ++flashKey.current;
    setFlash({ ...input, key });
    // Success (and its Undo) fades after 8 seconds; errors stay until dismissed.
    if (input.tone === "success") startFlashTimer(key);
  }

  function retry() {
    setLoad({ state: "loading" });
    requestReviews().then(applyLoad);
  }

  async function changeStatus(id: string, to: ReviewStatus, isUndo = false) {
    const review = reviews.find((r) => r.id === id);
    if (!review || saving.has(id) || review.status === to) return;
    const from = review.status;

    // Optimistic: the row moves to its new tab right away.
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, status: to } : r)));
    setSaving((s) => new Set(s).add(id));
    if (!isUndo) panelRef.current?.focus();

    const result = await sendStatus(id, to);

    setSaving((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });

    if (result.ok) {
      showFlash(
        isUndo
          ? { tone: "success", message: `Undone. It's back in ${tabLabel(to)}.` }
          : { tone: "success", message: successMessage(to), undo: { id, to: from } }
      );
      router.refresh(); // update the pending counter in the nav
      return;
    }

    setReviews((rs) => rs.map((r) => (r.id === id && r.status === to ? { ...r, status: from } : r)));
    showFlash(
      result.unauthorized
        ? { tone: "auth" }
        : { tone: "error", message: `${failMessage(to, review.leadName, isUndo)} ${result.error}` }
    );
  }

  function onTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const i = TABS.findIndex((t) => t.status === tab);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const status = TABS[next].status;
    setTab(status);
    tabRefs.current[status]?.focus();
  }

  const counts: Record<ReviewStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const r of reviews) counts[r.status] = (counts[r.status] ?? 0) + 1;

  const activeTab = TABS.find((t) => t.status === tab)!;
  const visible = reviews
    .filter((r) => r.status === tab)
    .sort((a, b) =>
      tab === "pending"
        ? (a.createdAt ?? "").localeCompare(b.createdAt ?? "")
        : (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Only published reviews appear on the homepage." />

      {flash && (
        <div
          className="mb-4"
          onMouseEnter={clearFlashTimer}
          onMouseLeave={() => flash.tone === "success" && startFlashTimer(flash.key)}
          onFocus={clearFlashTimer}
          onBlur={(e) => {
            if (flash.tone === "success" && !e.currentTarget.contains(e.relatedTarget as Node | null)) {
              startFlashTimer(flash.key);
            }
          }}
        >
          {flash.tone === "auth" ? (
            <Notice tone="warning">
              Your session has ended.{" "}
              <Link href="/admin/login" className="font-semibold text-accent hover:underline">
                Log in again
              </Link>{" "}
              and retry.
            </Notice>
          ) : (
            <Notice
              tone={flash.tone}
              action={
                flash.tone === "success" && flash.undo ? (
                  <button
                    type="button"
                    className={btnSecondarySm}
                    disabled={saving.has(flash.undo.id)}
                    onClick={() => flash.undo && changeStatus(flash.undo.id, flash.undo.to, true)}
                  >
                    Undo
                  </button>
                ) : flash.tone === "error" ? (
                  <button type="button" className={btnSecondarySm} onClick={() => setFlash(null)}>
                    Dismiss
                  </button>
                ) : undefined
              }
            >
              {flash.message}
            </Notice>
          )}
        </div>
      )}

      {load.state === "unauthorized" ? (
        <Notice tone="warning">
          Your session has ended.{" "}
          <Link href="/admin/login" className="font-semibold text-accent hover:underline">
            Log in again
          </Link>{" "}
          to see reviews.
        </Notice>
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
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Review status"
            className="mb-4 flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map((t) => {
              const selected = t.status === tab;
              return (
                <div key={t.status} role="presentation" className="relative shrink-0">
                  <button
                    ref={(el) => {
                      tabRefs.current[t.status] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`reviews-tab-${t.status}`}
                    aria-selected={selected}
                    aria-controls="reviews-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setTab(t.status)}
                    onKeyDown={onTabKeyDown}
                    className={cn(
                      "my-1.5 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-surface",
                      selected ? "font-semibold text-foreground" : "text-muted hover:text-foreground"
                    )}
                  >
                    {t.label}
                    {load.state === "ready" && <CountPill n={counts[t.status]} />}
                  </button>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-1 bottom-0 h-0.5 rounded-full",
                      selected ? "bg-tab-active" : "bg-transparent"
                    )}
                  />
                </div>
              );
            })}
          </div>

          <div
            ref={panelRef}
            id="reviews-panel"
            role="tabpanel"
            aria-labelledby={`reviews-tab-${tab}`}
            tabIndex={-1}
            className="focus:outline-none"
          >
            {load.state === "loading" ? (
              <Box>
                <SkeletonRows rows={3} />
              </Box>
            ) : visible.length === 0 ? (
              <EmptyState icon={activeTab.empty.icon} title={activeTab.empty.title} body={activeTab.empty.body} />
            ) : (
              <Box>
                <BoxHeader>
                  <h2 className="text-[13px] font-semibold text-foreground">
                    <span className="tabular">{visible.length}</span> {activeTab.label.toLowerCase()}
                  </h2>
                  <span className="text-xs text-muted">{activeTab.order}</span>
                </BoxHeader>
                <ul className="divide-y divide-border">
                  {visible.map((r) => (
                    <ReviewRow
                      key={r.id}
                      review={r}
                      saving={saving.has(r.id)}
                      onChange={(to) => changeStatus(r.id, to)}
                    />
                  ))}
                </ul>
              </Box>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewRow({
  review: r,
  saving,
  onChange,
}: {
  review: Review;
  saving: boolean;
  onChange: (to: ReviewStatus) => void;
}) {
  const date = formatReviewDate(r.createdAt);
  const name = r.leadName || "Unnamed hiker";
  const meta: React.ReactNode[] = [];
  if (r.tripTitle) meta.push(<span key="trip">{r.tripTitle}</span>);
  if (r.bookingId) {
    meta.push(
      <span key="booking" className="tabular">
        Booking {r.bookingId}
      </span>
    );
  }
  if (date) {
    meta.push(
      <time key="date" dateTime={r.createdAt} className="tabular">
        {date}
      </time>
    );
  }

  return (
    <li className="px-4 py-3.5 sm:px-5" aria-busy={saving || undefined}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars rating={r.rating} />
        <h3 className="min-w-0 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{name}</h3>
      </div>

      {meta.length > 0 && (
        <p className="mt-1 text-[13px] text-muted [overflow-wrap:anywhere]">
          {meta.map((m, i) => (
            <span key={i}>
              {i > 0 && <span aria-hidden> · </span>}
              {m}
            </span>
          ))}
        </p>
      )}

      <p className="mt-2 whitespace-pre-line text-sm text-foreground [overflow-wrap:anywhere]">
        {r.comment || <span className="text-muted">No comment.</span>}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {r.status !== "approved" && (
          <button
            type="button"
            className="btn-cta-sm"
            disabled={saving}
            onClick={() => onChange("approved")}
            aria-label={`Publish review by ${name}`}
          >
            Publish
          </button>
        )}
        {r.status !== "rejected" && (
          <button
            type="button"
            className={btnSecondarySm}
            disabled={saving}
            onClick={() => onChange("rejected")}
            aria-label={`Hide review by ${name}`}
          >
            Hide
          </button>
        )}
      </div>
    </li>
  );
}
