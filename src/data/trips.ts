import type { Trip } from "@/types";

export const trips: Trip[] = [
  {
    id: "mt-apo-summit",
    type: "scheduled",
    title: "Mt. Apo Summit Trek",
    description:
      "Reach the roof of the Philippines on a guided 2–3 day trek to Mt. Apo's summit. Trek through mossy forests, volcanic landscapes, and sulfur vents before standing at 2,954 meters — the highest point in the country.",
    location: "Davao del Sur / North Cotabato",
    date: null,
    time: "See available dates",
    meetupPoint: "Sta. Cruz Trail Jump-off, Davao del Sur",
    mapsUrl: "https://maps.google.com/?q=Sta+Cruz+Davao+del+Sur+Mt+Apo",
    difficulty: "Hard",
    duration: "2–3 days",
    distance: "~24 km round trip",
    price: 4500,
    maxSlots: 12,
    bookedCount: 0,
    included: [
      "Licensed guide",
      "DENR registration & camping permit",
      "Group first-aid kit",
      "Meals on trail (Day 1–2)",
    ],
    notIncluded: [
      "Transport to jump-off point",
      "Personal camping gear (tent, sleeping bag)",
      "Porter fees (optional)",
      "Travel insurance",
    ],
    whatToBring: [
      "Cold-weather layers (5–15°C at summit camp)",
      "Headlamp with spare batteries",
      "3L+ water capacity",
      "High-calorie trail food",
      "Trekking shoes with ankle support",
      "Rain jacket and pack cover",
      "Personal tent and sleeping bag",
    ],
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    status: "open",
  },
  {
    id: "private-custom",
    type: "private",
    title: "Private Mt. Apo Group Trek",
    description:
      "Planning a team-building event, school outing, or barkada climb on your own schedule? Book a private Mt. Apo group trek — we'll handle permits, itinerary, and guide coordination for your group.",
    location: "Mt. Apo, Davao del Sur",
    date: null,
    time: "Flexible",
    meetupPoint: "Trail jump-off to be confirmed",
    mapsUrl: "https://maps.google.com/?q=Mt+Apo+Davao+del+Sur",
    difficulty: "Hard",
    duration: "2–3 days",
    distance: "~24 km round trip",
    price: 4000,
    maxSlots: 30,
    bookedCount: 0,
    included: [
      "Dedicated licensed guide",
      "Custom itinerary planning",
      "DENR permit assistance",
      "Safety briefing",
      "Group first-aid kit",
    ],
    notIncluded: [
      "Transport to jump-off",
      "Meals and personal camping gear",
      "Porter fees (optional)",
    ],
    whatToBring: [
      "Cold-weather layers",
      "Headlamp, 3L+ water, trail food",
      "Trekking shoes, rain jacket",
      "Personal tent and sleeping bag",
    ],
    image:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80",
    status: "open",
  },
];

export function getTripById(id: string): Trip | undefined {
  return trips.find((t) => t.id === id);
}

export function getScheduledTrips(): Trip[] {
  return trips.filter((t) => t.type === "scheduled");
}

export function getPrivateTrip(): Trip {
  return trips.find((t) => t.type === "private")!;
}

export function getSlotsRemaining(trip: Trip): number {
  return Math.max(0, trip.maxSlots - trip.bookedCount);
}
