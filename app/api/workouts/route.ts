import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDb();
    await initDb();

    // Get workout data
    const workoutResult = await sql`
      SELECT data FROM workout_data 
      WHERE user_id = 'default' 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;

    // Get day finished data
    const dayFinishedResult = await sql`
      SELECT data FROM day_finished 
      WHERE user_id = 'default' 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;

    return NextResponse.json({
      weeks: workoutResult[0]?.data || null,
      dayFinished: dayFinishedResult[0]?.data || {},
    });
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data", message: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { weeks, dayFinished } = await request.json();
    const sql = getDb();
    await initDb();

    // Delete existing data first
    await sql`DELETE FROM workout_data WHERE user_id = 'default'`;
    await sql`DELETE FROM day_finished WHERE user_id = 'default'`;

    // Insert new data
    await sql`
      INSERT INTO workout_data (user_id, data, updated_at)
      VALUES ('default', ${JSON.stringify(weeks)}, CURRENT_TIMESTAMP)
    `;

    await sql`
      INSERT INTO day_finished (user_id, data, updated_at)
      VALUES ('default', ${JSON.stringify(dayFinished)}, CURRENT_TIMESTAMP)
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to save data", message: error.message },
      { status: 500 },
    );
  }
}

// Made with Bob
