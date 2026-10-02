import { getApprovedReviews } from "@/lib/reviews";
import { ReviewCard } from "@/components/ReviewCard";

export async function Reviews() {
  const reviews = await getApprovedReviews();
  if (reviews.length === 0) return null;

  const top = reviews.slice(0, 6);

  return (
    <section id="reviews" className="border-b border-border py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          What climbers say
        </h2>
        <p className="mt-1 text-sm text-muted">Reviews from guests after their trek.</p>

        <ul className="-mx-4 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {top.map((review) => (
            <li key={review.id} className="w-[82%] shrink-0 snap-start sm:w-auto">
              <ReviewCard
                rating={review.rating}
                comment={review.comment}
                leadName={review.leadName}
                tripTitle={review.tripTitle}
                createdAt={review.createdAt}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
