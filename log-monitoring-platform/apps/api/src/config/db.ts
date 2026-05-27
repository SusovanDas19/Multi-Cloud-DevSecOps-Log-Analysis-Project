import { Pool } from "pg";
import dotenv from "dotenv";

// Load .env if present (local dev). In Docker/production,
// env vars are injected directly — dotenv will simply find no file
// and that is fine.
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "❌ DATABASE_URL environment variable is not set. " +
    "Pass it via --env-file or -e flag when running the container."
  );
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function connectDB() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("✅ Connected to PostgreSQL");
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error);
    process.exit(1);
  }
}