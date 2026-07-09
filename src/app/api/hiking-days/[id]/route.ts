import { NextRequest, NextResponse } from "next/server";
import { getHikingDayById, saveHikingDay, deleteHikingDay } from "@/lib/hiking-days-file";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { HikingDayPhoto } from "@/data/hiking-days";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const day = await getHikingDayById(id);
  if (!day) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(day);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getHikingDayById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { title, summary, date, photos } = body as {
      title?: string;
      summary?: string;
      date?: string;
      photos?: HikingDayPhoto[];
    };

    const updated = {
      ...existing,
      title: title?.trim() ?? existing.title,
      summary: summary?.trim() ?? existing.summary,
      date: date ?? existing.date,
      photos: photos ?? existing.photos,
      updatedAt: new Date().toISOString(),
    };

    const result = await saveHikingDay(updated);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteHikingDay(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
