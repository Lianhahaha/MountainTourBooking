export interface LicenseDocument {
  id: string;
  title: string;
  issuer: string;
  description: string;
  image: string;
  validUntil?: string;
}

export const licenses: LicenseDocument[] = [
  {
    id: "dot-accreditation",
    title: "DOT Accreditation",
    issuer: "Department of Tourism",
    description:
      "Accredited tour operator for outdoor recreation and adventure tourism activities in Mindanao.",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80",
    validUntil: "December 2026",
  },
  {
    id: "lgu-permit",
    title: "LGU Business Permit",
    issuer: "Local Government Unit — Davao del Sur",
    description:
      "Valid business permit to operate guided hiking and outdoor recreation services in Davao del Sur.",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80",
    validUntil: "December 2026",
  },
  {
    id: "denr-moa",
    title: "DENR Mt. Apo Protected Area MOA",
    issuer: "Department of Environment and Natural Resources",
    description:
      "Memorandum of agreement for guided access to Mt. Apo Natural Park trails and campsites.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    validUntil: "June 2027",
  },
  {
    id: "liability-insurance",
    title: "Liability Insurance Certificate",
    issuer: "Insurance Provider",
    description:
      "Comprehensive liability coverage for participants during organized Mt. Apo trekking activities.",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
    validUntil: "March 2027",
  },
];
