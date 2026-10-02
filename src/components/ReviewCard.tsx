import { Icon } from "@/components/Icon";

interface ReviewCardProps {
  rating: number;
  comment: string;
  leadName: string;
  tripTitle: string;
  createdAt: string;
}

export function ReviewCard({ rating, comment, leadName, tripTitle, createdAt }: ReviewCardProps) {
  const date = new Date(createdAt);
  const when = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });

  return (
    <figure className="flex h-full flex-col rounded-md border border-border bg-surface-elevated p-4">
      <div className="flex gap-0.5 text-warning" role="img" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star"
            filled={star <= rating}
            className={star <= rating ? "h-3.5 w-3.5" : "h-3.5 w-3.5 text-border"}
          />
        ))}
      </div>
      <blockquote className="mt-2.5 flex-1 text-sm leading-relaxed text-foreground">
        {comment}
      </blockquote>
      <figcaption className="mt-3 border-t border-border pt-2.5 text-[13px]">
        <span className="font-semibold text-foreground">{leadName}</span>
        <span className="text-muted">
          {" "}
          · {tripTitle}
          {when && ` · ${when}`}
        </span>
      </figcaption>
    </figure>
  );
}
