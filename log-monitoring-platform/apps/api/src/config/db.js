import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("❌ DATABASE_URL is missing in .env");
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
    }
    catch (error) {
        console.error("❌ PostgreSQL connection failed:", error);
        process.exit(1);
    }
}
