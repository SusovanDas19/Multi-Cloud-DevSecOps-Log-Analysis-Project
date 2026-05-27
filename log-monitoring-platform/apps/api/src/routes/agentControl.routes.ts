import { Router } from "express";
import type { WebSocket as WsWebSocket } from "ws";

export default function createAgentControlRouter(
  machineToSocket: Map<string, WsWebSocket>   
) {
  const router = Router();

  router.post("/control", (req, res) => {
    const { machineCode, action } = req.body as {
      machineCode?: string;
      action?: string;
    };

    if (!machineCode || !action) {
      return res
        .status(400)
        .json({ message: "machineCode and action required" });
    }

    const ws = machineToSocket.get(machineCode);
    if (!ws || ws.readyState !== ws.OPEN) {
      return res.status(404).json({ message: "Agent is not connected" });
    }

    ws.send(
      JSON.stringify({
        type: "control",
        action,
      })
    );

    return res.json({ message: "Command sent to agent" });
  });

  return router;
}
