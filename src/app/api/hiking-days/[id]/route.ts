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

    if (photos !== undefined) {
      if (
        !Array.isArray(photos) ||
        photos.some(
          (p) =>
            !p ||
            typeof p !== "object" ||
            typeof p.id !== "string" ||
            typeof p.src !== "string" ||
            p.src.length === 0 ||
            typeof p.alt !== "string"
        )
      ) {
        return NextResponse.json(
          { error: "Photos must be an array of { id, src, alt } objects" },
          { status: 400 }
        );
      }

      if (photos.length > 20) {
        return NextResponse.json({ error: "Maximum of 20 photos allowed per album." }, { status: 400 });
      }
    }

    if (date !== undefined && (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
      return NextResponse.json({ error: "Date must be in YYYY-MM-DD format" }, { status: 400 });
    }

    // Guard against empty strings: `??` only skips null/undefined, so a blank
    // title/summary would otherwise wipe the existing value.
    if (
      (title !== undefined && typeof title !== "string") ||
      (summary !== undefined && typeof summary !== "string")
    ) {
      return NextResponse.json({ error: "Invalid field types" }, { status: 400 });
    }
    const trimmedTitle = title?.trim();
    const trimmedSummary = summary?.trim();
    if (trimmedTitle === "" || trimmedSummary === "") {
      return NextResponse.json({ error: "Title and summary are required" }, { status: 400 });
    }

    const updated = {
      ...existing,
      title: trimmedTitle ?? existing.title,
      summary: trimmedSummary ?? existing.summary,
      date: date ?? existing.date,
      photos: photos ?? existing.photos,
      updatedAt: new Date().toISOString(),
    };

    const result = await saveHikingDay(updated);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Hiking day PATCH error:", err);
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
