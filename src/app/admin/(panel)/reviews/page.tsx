import { redirect } from "next/navigation";
import { getAllReviews } from "@/lib/reviews";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminReviewsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const reviews = await getAllReviews();

  const total = reviews.length;
  const pending = reviews.filter((r) => r.status === "pending").length;
  const approved = reviews.filter((r) => r.status === "approved").length;
  const rejected = reviews.filter((r) => r.status === "rejected").length;

  return (
    <div>
      <h1 className="text-lg font-bold text-foreground md:text-2xl">Review moderation</h1>
      <p className="mt-0.5 text-sm text-muted">
        {total} total, {pending} pending, {approved} approved, {rejected} rejected
      </p>

      {reviews.length === 0 && (
        <p className="mt-6 text-muted">No reviews yet. Submissions appear here for moderation.</p>
      )}

      <ul className="mt-4 space-y-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= r.rating ? "text-warning" : "text-muted"}>
                      {s <= r.rating ? "★" : "☆"}
                    </span>
                  ))}
                </span>
                <span className="font-medium text-foreground">{r.leadName}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">{r.tripTitle}</span>
              </div>
              <p className="mt-1 text-foreground">
                {r.comment.length > 120 ? r.comment.slice(0, 120) + "…" : r.comment}
              </p>
              <p className="mt-1 text-xs text-muted">
                {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  r.status === "pending"
                    ? "text-warning bg-warning-muted"
                    : r.status === "approved"
                    ? "text-primary bg-primary-muted"
                    : "text-danger bg-danger-muted"
                }`}
              >
                {r.status}
              </span>

              <form method="POST" action="/api/reviews/approve" className="flex gap-1">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="approved" />
                <button type="submit" className="btn-cta-sm">
                  Approve
                </button>
              </form>

              <form method="POST" action="/api/reviews/approve" className="flex gap-1">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="rejected" />
                <button type="submit" className="btn-secondary">
                  Reject
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
