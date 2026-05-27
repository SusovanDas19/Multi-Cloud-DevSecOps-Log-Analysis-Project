import { pool } from "../config/db";

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  machine_code: string;
  created_at: Date;
  updated_at: Date;
}

export const UserModel = {
  async findByUsername(username: string): Promise<UserRow | null> {
    const result = await pool.query<UserRow>(
      `SELECT * FROM users WHERE username = $1 LIMIT 1`,
      [username]
    );
    return result.rows[0] ?? null;
  },

  async findByMachineCode(machineCode: string): Promise<UserRow | null> {
    const result = await pool.query<UserRow>(
      `SELECT * FROM users WHERE machine_code = $1 LIMIT 1`,
      [machineCode]
    );
    return result.rows[0] ?? null;
  },

  async findById(id: number): Promise<UserRow | null> {
    const result = await pool.query<UserRow>(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(input: {
    username: string;
    passwordHash: string;
    machineCode: string;
  }): Promise<UserRow> {
    const result = await pool.query<UserRow>(
      `INSERT INTO users (username, password_hash, machine_code)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.username, input.passwordHash, input.machineCode]
    );
    return result.rows[0];
  },
};

