export type Difficulty = "Easy" | "Moderate" | "Hard";
export type TripType = "scheduled" | "private";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Trip {
  id: string;
  type: TripType;
  title: string;
  description: string;
  location: string;
  date: string | null;
  time: string;
  meetupPoint: string;
  mapsUrl: string;
  difficulty: Difficulty;
  duration: string;
  distance: string;
  price: number;
  maxSlots: number;
  bookedCount: number;
  included: string[];
  notIncluded: string[];
  whatToBring: string[];
  image: string;
  status: "open" | "full" | "cancelled";
}

/** Owner-configured available trekking dates for scheduled group bookings */
export interface TrekSession {
  id: string;
  date: string;
  time: string;
  maxSlots: number;
  bookedCount: number;
  status: "open" | "full" | "cancelled";
  price?: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequest {
  id: string;
  tripId: string | null;
  sessionId: string | null;
  tripType: TripType;
  tripTitle: string;
  preferredDate: string | null;
  trekTime: string | null;
  locationPreference: string | null;
  paxCount: number;
  participantNames: string[];
  leadName: string;
  phone: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  fitnessConfirmed: boolean;
  waiverAccepted: boolean;
  ageConfirmed: boolean;
  estimatedTotal: number;
  status: BookingStatus;
  createdAt: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  message: string;
}
