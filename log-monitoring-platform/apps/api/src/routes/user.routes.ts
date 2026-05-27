import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserModel } from "../models/user.model";
import { validateCredentials } from "../middleware/validateCredentials";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

const userRouter = Router();

function generateMachineCode() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * POST /api/users/register
 * Body: { username, password }
 */
userRouter.post("/register", validateCredentials, async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await UserModel.findByUsername(username);
    if (existing) {
      return res.status(409).json({ message: "username is already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let machineCode = generateMachineCode();
    while (await UserModel.findByMachineCode(machineCode)) {
      machineCode = generateMachineCode();
    }

    const user = await UserModel.create({ username, passwordHash, machineCode });

    return res.status(201).json({
      id: user.id,
      username: user.username,
      machineCode: user.machine_code,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
});

/**
 * POST /api/users/login
 * Body: { username, password, machineCode? }
 */
userRouter.post("/login", validateCredentials, async (req, res) => {
  try {
    const { username, password, machineCode } = req.body as {
      username: string;
      password: string;
      machineCode?: string;
    };

    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    if (typeof machineCode === "string") {
      if (user.machine_code !== machineCode) {
        return res.status(401).json({ message: "machine code mismatch" });
      }
    }

    const token = jwt.sign(
      {
        userId: String(user.id),
        username: user.username,
        machineCode: user.machine_code,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        machineCode: user.machine_code,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
});

export default userRouter;