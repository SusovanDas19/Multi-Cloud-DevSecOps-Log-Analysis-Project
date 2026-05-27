import { Request, Response, NextFunction } from "express";

export function validateCredentials(req: Request, res: Response, next: NextFunction) {
  const { username, password, machineCode } = req.body;

  if (!username || typeof username !== "string" || username.trim().length === 0) {
    return res.status(400).json({ message: "username is required" });
  }

  if (!password || typeof password !== "string" || password.trim().length === 0) {
    return res.status(400).json({ message: "password is required" });
  }

 
  if (machineCode !== undefined) {
    if (typeof machineCode !== "string" || machineCode.trim().length === 0) {
      return res.status(400).json({ message: "machineCode must be a non-empty string" });
    }
  }

  next();
}
