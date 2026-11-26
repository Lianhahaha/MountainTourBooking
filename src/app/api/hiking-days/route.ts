import { NextRequest, NextResponse } from "next/server";
import { getAllHikingDaysStrict, saveHikingDay, slugify } from "@/lib/hiking-days-file";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { describeSupabaseError } from "@/lib/supabase";
import { isSafeImageSrc, isValidISODate } from "@/lib/utils";
import type { HikingDay, HikingDayPhoto } from "@/data/hiking-days";

export async function GET() {
  // Report an outage instead of an empty list that looks like "no albums".
  try {
    return NextResponse.json(await getAllHikingDaysStrict(), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Could not load hike albums:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? describeSupabaseError(err.message)
            : "Couldn't reach the albums database.",
      },
      { status: 503 }
    );
  }
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

    if (!isValidISODate(date)) {
      return NextResponse.json({ error: "Please choose a real calendar date" }, { status: 400 });
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

    let days;
    try {
      days = await getAllHikingDaysStrict();
    } catch {
      return NextResponse.json({ error: "Couldn't reach the albums database. Try again." }, { status: 503 });
    }
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
