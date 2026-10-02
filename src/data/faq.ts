export interface FaqItem {
  question: string;
  answer: string;
}

export const faq: FaqItem[] = [
  {
    question: "How do I book?",
    answer:
      "Pick a date, fill in the booking form, and accept the safety checks. We confirm within 24–48 hours by SMS or email.",
  },
  {
    question: "How do I pay?",
    answer: "In person on trek day — cash or GCash. Nothing is charged on this website.",
  },
  {
    question: "What's the cancellation policy?",
    answer:
      "7+ days before: full refund of any deposit. 3–6 days: 50%. Under 3 days: no refund, but you can transfer your slot.",
  },
  {
    question: "What if the weather is bad?",
    answer:
      "Safety first. If PAGASA or DENR advisories make the trail unsafe, we reschedule for free or refund you in full.",
  },
  {
    question: "What if I'm late or don't show up?",
    answer: "We leave at the meet-up time and can't wait on trail. No-shows aren't refunded.",
  },
  {
    question: "Any age or fitness requirements?",
    answer:
      "Minimum age 16 (16–17 with a guardian). Mt. Apo is Hard-rated, so you must be fit for a multi-day, high-altitude hike.",
  },
  {
    question: "What's included?",
    answer:
      "Licensed guide, DENR permits, group first-aid, and trail meals. Transport, personal camping gear, and porters are extra.",
  },
  {
    question: "Can I book for a big group?",
    answer:
      "Yes — request a private group climb with your group size and dates. Groups of 10+ get special rates, and we handle permits.",
  },
];
