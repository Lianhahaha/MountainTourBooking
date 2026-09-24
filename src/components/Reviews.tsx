import { getApprovedReviews } from "@/lib/reviews";
import { ReviewCard } from "@/components/ReviewCard";

export async function Reviews() {
  const reviews = await getApprovedReviews();
  if (reviews.length === 0) return null;

  const top = reviews.slice(0, 6);

  return (
    <section id="reviews" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Guest reviews
          </p>
          <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            What trekkers say
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((review) => (
            <ReviewCard
              key={review.id}
              rating={review.rating}
              comment={review.comment}
              leadName={review.leadName}
              tripTitle={review.tripTitle}
              createdAt={review.createdAt}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
