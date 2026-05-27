import { pool } from "../config/db";
export async function runMigrations() {
    const client = await pool.connect();
    try {
        console.log("🔧 Running database migrations...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        username    VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        machine_code  VARCHAR(20) NOT NULL UNIQUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        machine_code     VARCHAR(20) NOT NULL,
        timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_threat        BOOLEAN NOT NULL DEFAULT FALSE,
        severity         NUMERIC(4,2) NOT NULL DEFAULT 0,
        threat_type      TEXT NOT NULL DEFAULT '',
        recommendation   TEXT NOT NULL DEFAULT '',
        original_message TEXT NOT NULL,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_user_id      ON logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_logs_machine_code ON logs(machine_code);
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp    ON logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_logs_is_threat    ON logs(is_threat);
    `);
        console.log("✅ Migrations complete");
    }
    catch (err) {
        console.error("❌ Migration failed:", err);
        throw err;
    }
    finally {
        client.release();
    }
}
