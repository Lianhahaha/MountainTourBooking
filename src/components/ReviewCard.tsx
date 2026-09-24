"use client";

interface ReviewCardProps {
  rating: number;
  comment: string;
  leadName: string;
  tripTitle: string;
  createdAt: string;
}

export function ReviewCard({ rating, comment, leadName, tripTitle, createdAt }: ReviewCardProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? "text-warning" : "text-muted"}>
            {star <= rating ? "★" : "☆"}
          </span>
        ))}
      </div>
      <p className="mt-2 font-medium text-foreground">{leadName}</p>
      <p className="text-sm text-muted">{tripTitle}</p>
      <p className="mt-2 text-sm text-foreground">{comment}</p>
      <p className="mt-1 text-xs text-muted">
        {Number.isNaN(new Date(createdAt).getTime())
          ? ""
          : new Date(createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
