import { NextRequest, NextResponse } from "next/server";
import { getAllHikingDays, saveHikingDay, slugify } from "@/lib/hiking-days-file";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { HikingDay, HikingDayPhoto } from "@/data/hiking-days";

export async function GET() {
  const days = await getAllHikingDays();
  return NextResponse.json(days);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, summary, date, photos } = body as {
      title?: string;
      summary?: string;
      date?: string;
      photos?: HikingDayPhoto[];
    };

    if (!title?.trim() || !summary?.trim() || !date) {
      return NextResponse.json({ error: "Title, summary, and date are required" }, { status: 400 });
    }

    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Date must be in YYYY-MM-DD format" }, { status: 400 });
    }

    if (title.length > 200 || summary.length > 5000) {
      return NextResponse.json(
        { error: "Title must be at most 200 characters and summary at most 5000" },
        { status: 400 }
      );
    }

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

    const days = await getAllHikingDays();
    if (days.length >= 13) {
      return NextResponse.json({ error: "Maximum of 13 albums allowed. Please delete an old album first." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const baseId = slugify(title);
    const id = `${baseId}-${Date.now().toString(36)}`;

    const day: HikingDay = {
      id,
      title: title.trim(),
      summary: summary.trim(),
      date,
      photos: photos ?? [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await saveHikingDay(day);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(day, { status: 201 });
  } catch (err) {
    console.error("Hiking day POST error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
