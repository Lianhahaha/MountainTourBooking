import { NextResponse } from "next/server";
import { getAllBookings } from "@/lib/bookings";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function escapeCsvCell(value: string): string {
  // Neutralize spreadsheet formula injection (=, +, -, @ at cell start).
  let cell = value;
  if (/^[=+\-@\t\r]/.test(cell)) {
    cell = `'${cell}`;
  }
  if (
    cell.includes('"') ||
    cell.includes(",") ||
    cell.includes("\n") ||
    cell.includes("\r")
  ) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const bookings = await getAllBookings();

  const headers = [
    "ID",
    "Lead Name",
    "Phone",
    "Email",
    "Trip",
    "Type",
    "Date",
    "Time",
    "Pax Count",
    "Participants",
    "Total (PHP)",
    "Status",
    "Emergency Contact Name",
    "Emergency Contact Phone",
    "Notes",
    "Created At",
  ];

  const rows = bookings.map((b) => [
    escapeCsvCell(b.id),
    escapeCsvCell(b.leadName),
    escapeCsvCell(b.phone),
    escapeCsvCell(b.email),
    escapeCsvCell(b.tripTitle),
    b.tripType,
    b.preferredDate ?? "",
    b.trekTime ?? "",
    String(b.paxCount),
    escapeCsvCell((b.participantNames ?? []).join(" ; ")),
    String(b.estimatedTotal),
    b.status,
    escapeCsvCell(b.emergencyContactName),
    escapeCsvCell(b.emergencyContactPhone),
    escapeCsvCell(b.notes ?? ""),
    b.createdAt,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bookings.csv"',
    },
  });
}
