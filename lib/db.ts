import { neon } from "@neondatabase/serverless";

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(process.env.DATABASE_URL);
}

export async function initDb() {
  const sql = getDb();

  // Create workouts table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS workout_data (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default' UNIQUE,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create day_finished table
  await sql`
    CREATE TABLE IF NOT EXISTS day_finished (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default' UNIQUE,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// Made with Bob
