export interface FaqItem {
  question: string;
  answer: string;
}

export const faq: FaqItem[] = [
  {
    question: "How do I book a Mt. Apo trek?",
    answer:
      "Choose an upcoming scheduled group trek or request a private group booking on our Book page. Fill in your details, agree to the safety waivers, and submit. You'll receive a booking reference and we'll confirm within 24–48 hours via SMS or email.",
  },
  {
    question: "How does payment work?",
    answer:
      "Payment is collected in person on trek day — cash or GCash as arranged during confirmation. No online payment is processed on this website. Your estimated total is shown at booking for reference only.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "Cancel at least 7 days before the trek for a full refund of any deposit paid. Cancellations 3–6 days before receive a 50% refund. Less than 3 days — no refund, but you may transfer your slot to another person.",
  },
  {
    question: "What happens if the weather is bad?",
    answer:
      "Safety comes first. Mt. Apo trails may close during storms or heavy rain. If conditions are unsafe, we will reschedule at no extra cost or offer a full refund. We monitor PAGASA advisories and DENR trail status.",
  },
  {
    question: "What if I'm late or don't show up?",
    answer:
      "We leave at the scheduled meet-up time. Late arrivals cannot be accommodated — the group cannot wait on trail. No-shows are non-refundable.",
  },
  {
    question: "Is there a minimum age or fitness requirement?",
    answer:
      "Mt. Apo is a Hard-rated trek. Minimum age is 16 (with a guardian for 16–17). You must self-declare that you're physically fit for multi-day high-altitude hiking. Contact us if you have health concerns.",
  },
  {
    question: "What's included in the trek fee?",
    answer:
      "Each trip listing shows what's included and not included. Typically: licensed guide, DENR registration and camping permits, group first-aid, and trail meals. Transport, personal camping gear, and porter fees are usually not included.",
  },
  {
    question: "Can I book for a large group or company outing?",
    answer:
      "Yes! Use the Private Mt. Apo Group Trek option and tell us your group size and preferred dates. We offer special rates for groups of 10+ and handle all permit coordination.",
  },
];
