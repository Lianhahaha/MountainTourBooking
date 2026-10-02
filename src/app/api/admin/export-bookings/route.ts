import { NextResponse } from "next/server";
import { getAllBookingsResult } from "@/lib/bookings";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { todayInManila } from "@/lib/utils";

/** Quote a cell for CSV and neutralize spreadsheet formulas (=, +, -, @ at cell start). */
function csvCell(value: unknown): string {
  let cell = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(cell)) {
    cell = `'${cell}`;
  }
  if (/[",\r\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { bookings, error } = await getAllBookingsResult();
  // A partial export looks complete in a spreadsheet; refuse instead.
  if (error) {
    return new NextResponse(`${error} Export cancelled so you don't get an incomplete file. Try again.`, {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const headers = [
    "ID",
    "Status",
    "Trek date",
    "Meet-up time",
    "Trip",
    "Type",
    "Pax",
    "Total due on trek day (PHP)",
    "Lead name",
    "Phone",
    "Email",
    "Participants",
    "Emergency contact name",
    "Emergency contact phone",
    "Trail preference",
    "Notes",
    "Submitted at",
  ];

  const rows = bookings.map((b) => [
    b.id,
    b.status,
    b.preferredDate ?? "",
    b.trekTime ?? "",
    b.tripTitle,
    b.tripType,
    b.paxCount,
    Number.isFinite(b.estimatedTotal) ? b.estimatedTotal : "",
    b.leadName,
    b.phone,
    b.email,
    (b.participantNames ?? []).filter(Boolean).join(" ; "),
    b.emergencyContactName,
    b.emergencyContactPhone,
    b.locationPreference ?? "",
    b.notes ?? "",
    b.createdAt,
  ]);

  // BOM so Excel reads UTF-8 (ñ, ₱); CRLF line endings per RFC 4180.
  const csv =
    "﻿" + [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${todayInManila()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
