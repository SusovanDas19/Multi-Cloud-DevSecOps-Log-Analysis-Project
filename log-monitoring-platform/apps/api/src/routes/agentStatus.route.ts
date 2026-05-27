import { Router } from "express";
import { machineToSocket } from "../ws/agentSocket";

const router = Router();

router.get("/status/:machineCode", (req, res) => {
  const { machineCode } = req.params;

  const socket = machineToSocket.get(machineCode);
  const connected = socket && socket.readyState === 1;

  res.json({ connected: Boolean(connected) });
});

export default router;
