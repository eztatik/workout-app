import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDb();
    await initDb();

    const workoutResult = await sql`
      SELECT data FROM workout_data 
      WHERE user_id = 'default' 
      ORDER BY updated_at DESC LIMIT 1
    `;
    const dayFinishedResult = await sql`
      SELECT data FROM day_finished 
      WHERE user_id = 'default' 
      ORDER BY updated_at DESC LIMIT 1
    `;
    const programsResult = await sql`
      SELECT data FROM programs_data
      WHERE user_id = 'default'
      ORDER BY updated_at DESC LIMIT 1
    `;
    const activeProgramResult = await sql`
      SELECT data FROM active_program_data
      WHERE user_id = 'default'
      ORDER BY updated_at DESC LIMIT 1
    `;
    const archivedProgramsResult = await sql`
      SELECT data FROM archived_programs_data
      WHERE user_id = 'default'
      ORDER BY updated_at DESC LIMIT 1
    `;

    return NextResponse.json({
      weeks: workoutResult[0]?.data || null,
      dayFinished: dayFinishedResult[0]?.data || {},
      programs: programsResult[0]?.data || [],
      activeProgram: activeProgramResult[0]?.data ?? null,
      archivedPrograms: archivedProgramsResult[0]?.data || [],
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
    const { weeks, dayFinished, programs, activeProgram, archivedPrograms } = await request.json();
    const sql = getDb();
    await initDb();

    await sql`DELETE FROM workout_data WHERE user_id = 'default'`;
    await sql`DELETE FROM day_finished WHERE user_id = 'default'`;
    await sql`
      INSERT INTO workout_data (user_id, data, updated_at)
      VALUES ('default', ${JSON.stringify(weeks)}, CURRENT_TIMESTAMP)
    `;
    await sql`
      INSERT INTO day_finished (user_id, data, updated_at)
      VALUES ('default', ${JSON.stringify(dayFinished)}, CURRENT_TIMESTAMP)
    `;

    if (programs !== undefined) {
      await sql`DELETE FROM programs_data WHERE user_id = 'default'`;
      await sql`
        INSERT INTO programs_data (user_id, data, updated_at)
        VALUES ('default', ${JSON.stringify(programs)}, CURRENT_TIMESTAMP)
      `;
    }

    if (activeProgram !== undefined) {
      await sql`DELETE FROM active_program_data WHERE user_id = 'default'`;
      await sql`
        INSERT INTO active_program_data (user_id, data, updated_at)
        VALUES ('default', ${JSON.stringify(activeProgram)}, CURRENT_TIMESTAMP)
      `;
    }

    if (archivedPrograms !== undefined) {
      await sql`DELETE FROM archived_programs_data WHERE user_id = 'default'`;
      await sql`
        INSERT INTO archived_programs_data (user_id, data, updated_at)
        VALUES ('default', ${JSON.stringify(archivedPrograms)}, CURRENT_TIMESTAMP)
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to save data", message: error.message },
      { status: 500 },
    );
  }
}
