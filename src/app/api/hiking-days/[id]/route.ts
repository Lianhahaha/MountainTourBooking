import { NextRequest, NextResponse } from "next/server";
import { getHikingDayById, saveHikingDay, deleteHikingDay } from "@/lib/hiking-days-file";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isSafeImageSrc, isValidISODate } from "@/lib/utils";
import type { HikingDay, HikingDayPhoto } from "@/data/hiking-days";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const day = await getHikingDayById(id);
    if (!day) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(day);
  } catch (err) {
    console.error("Could not load hike album:", err);
    return NextResponse.json({ error: "Couldn't reach the albums database." }, { status: 503 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let existing: HikingDay | undefined;
  try {
    existing = await getHikingDayById(id);
  } catch (err) {
    console.error("Could not read hike album:", err);
    return NextResponse.json({ error: "Couldn't reach the albums database." }, { status: 503 });
  }
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
            p.id.length > 100 ||
            !isSafeImageSrc(p.src) ||
            typeof p.alt !== "string" ||
            p.alt.length > 300
        )
      ) {
        return NextResponse.json(
          { error: "Photos need { id, src, alt }, with an HTTPS or /path image URL" },
          { status: 400 }
        );
      }

      if (photos.length > 20) {
        return NextResponse.json({ error: "Maximum of 20 photos allowed per album." }, { status: 400 });
      }
    }

    if (date !== undefined && !isValidISODate(date)) {
      return NextResponse.json({ error: "Please choose a real calendar date" }, { status: 400 });
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
  let existing: HikingDay | undefined;
  try {
    existing = await getHikingDayById(id);
  } catch (err) {
    console.error("Could not read hike album:", err);
    return NextResponse.json({ error: "Couldn't reach the albums database." }, { status: 503 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await deleteHikingDay(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
