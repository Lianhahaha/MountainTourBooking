import { Resend } from "resend";
import type { BookingRequest } from "@/types";
import { org } from "@/data/org";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function formatBookingEmail(booking: BookingRequest): string {
  return `
New booking request — ${booking.id}

Trip: ${booking.tripTitle}
Type: ${booking.tripType}
${booking.preferredDate ? `Preferred date: ${booking.preferredDate}` : ""}
${booking.locationPreference ? `Location preference: ${booking.locationPreference}` : ""}
Participants: ${booking.paxCount}
Estimated total: ₱${booking.estimatedTotal.toLocaleString()}

Lead: ${booking.leadName}
Phone: ${booking.phone}
Email: ${booking.email}
Emergency: ${booking.emergencyContactName} (${booking.emergencyContactPhone})

${booking.participantNames.length ? `Participant names: ${booking.participantNames.join(", ")}` : ""}
${booking.notes ? `Notes: ${booking.notes}` : ""}

Status: ${booking.status}
Submitted: ${booking.createdAt}
  `.trim();
}

export async function sendBookingEmails(
  booking: BookingRequest
): Promise<{ ownerSent: boolean; clientSent: boolean }> {
  const resend = getResend();
  if (!resend) return { ownerSent: false, clientSent: false };

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const ownerEmail = process.env.OWNER_EMAIL ?? org.contact.email;
  const body = formatBookingEmail(booking);

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: ownerEmail,
      subject: `[New Booking] ${booking.tripTitle} — ${booking.id}`,
      text: body,
    }),
    resend.emails.send({
      from,
      to: booking.email,
      subject: `Booking request received — ${booking.id}`,
      text: `Hi ${booking.leadName},

Thank you for your booking request with ${org.name}!

Reference: ${booking.id}
Trip: ${booking.tripTitle}
Participants: ${booking.paxCount}
Estimated total: ₱${booking.estimatedTotal.toLocaleString()} (pay in person on trek day)

We will review your request and email you once your slot is approved and scheduled — usually within 24–48 hours.

Payment reminder: No online payment is required. Payment is collected in person on trek day (cash or GCash as arranged).

Questions? Reach us at ${org.contact.phone} or ${org.contact.email}.

— ${org.guideName}, ${org.name}`,
    }),
  ]);

  return {
    ownerSent: results[0].status === "fulfilled",
    clientSent: results[1].status === "fulfilled",
  };
}

export async function sendBookingApprovedEmail(
  booking: BookingRequest,
  details: {
    scheduledDate: string;
    meetupPoint: string;
    meetupTime: string;
    ownerNote?: string;
  }
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const noteBlock = details.ownerNote
    ? `\n\nMessage from your guide:\n${details.ownerNote}\n`
    : "";

  const result = await resend.emails.send({
    from,
    to: booking.email,
    subject: `Booking approved — ${booking.tripTitle} (${booking.id})`,
    text: `Hi ${booking.leadName},

Great news — your booking with ${org.name} has been APPROVED and scheduled!

Reference: ${booking.id}
Trip: ${booking.tripTitle}
Scheduled date: ${details.scheduledDate}
Meet-up time: ${details.meetupTime}
Meet-up point: ${details.meetupPoint}
Participants: ${booking.paxCount}
Amount due on trek day: ₱${booking.estimatedTotal.toLocaleString()} (cash or GCash)
${noteBlock}
Please save this email. If you need to make changes, contact us at ${org.contact.phone} or ${org.contact.email}.

See you on the trail!

— ${org.guideName}, ${org.name}`,
  });

  return !result.error;
}

export async function sendBookingCancelledEmail(
  booking: BookingRequest,
  details: { ownerNote?: string }
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const noteBlock = details.ownerNote
    ? `\n\nReason / note:\n${details.ownerNote}\n`
    : "";

  const result = await resend.emails.send({
    from,
    to: booking.email,
    subject: `Booking update — ${booking.id}`,
    text: `Hi ${booking.leadName},

We are writing about your booking request with ${org.name}.

Reference: ${booking.id}
Trip: ${booking.tripTitle}

Unfortunately, we are unable to confirm this booking at this time.${noteBlock}
If you have questions or would like to rebook another date, please contact us at ${org.contact.phone} or ${org.contact.email}.

— ${org.guideName}, ${org.name}`,
  });

  return !result.error;
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const ownerEmail = process.env.OWNER_EMAIL ?? org.contact.email;

  const result = await resend.emails.send({
    from,
    to: ownerEmail,
    replyTo: data.email,
    subject: `[Contact] Message from ${data.name}`,
    text: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\n\n${data.message}`,
  });

  return !result.error;
}

export function generateBookingId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LTO-${date}-${rand}`;
}
