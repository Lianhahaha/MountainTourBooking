export interface HikingDayPhoto {
  id: string;
  src: string;
  alt: string;
}

/** Shape matches future Firebase documents */
export interface HikingDay {
  id: string;
  title: string;
  summary: string;
  date: string;
  photos: HikingDayPhoto[];
  createdAt: string;
  updatedAt: string;
}

export const seedHikingDays: HikingDay[] = [
  {
    id: "apo-summit-aug-2025",
    title: "August Summit Push — Sta. Cruz Trail",
    summary:
      "A strong group of 10 hikers reached Mt. Apo's summit via the Sta. Cruz trail after two days on the mountain. Clear skies at camp rewarded everyone with views across Davao del Sur. Special thanks to the porters and DENR staff at the jump-off.",
    date: "2025-08-12",
    photos: [
      {
        id: "1",
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
        alt: "Summit view above the clouds",
      },
      {
        id: "2",
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        alt: "Alpine landscape near the crater",
      },
      {
        id: "3",
        src: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&q=80",
        alt: "Mossy forest trail section",
      },
      {
        id: "4",
        src: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80",
        alt: "Group photo at a viewpoint",
      },
    ],
    createdAt: "2025-08-15T00:00:00.000Z",
    updatedAt: "2025-08-15T00:00:00.000Z",
  },
  {
    id: "private-group-july-2025",
    title: "Private Barkada Climb — July 2025",
    summary:
      "A private group of 8 friends booked a custom Mt. Apo itinerary. We handled permits, camp setup, and pacing for first-time multi-day trekkers. Everyone made it to the summit by sunrise on day two.",
    date: "2025-07-20",
    photos: [
      {
        id: "1",
        src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
        alt: "Night camp under the stars",
      },
      {
        id: "2",
        src: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
        alt: "Sunrise ridge walk",
      },
      {
        id: "3",
        src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
        alt: "Summit celebration",
      },
    ],
    createdAt: "2025-07-22T00:00:00.000Z",
    updatedAt: "2025-07-22T00:00:00.000Z",
  },
];
