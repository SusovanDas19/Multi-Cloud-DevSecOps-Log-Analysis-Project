import { Router } from "express";
import { getAgentDownloadUrl, getGalleryUrls } from "../services/s3.service";

const downloadsRouter = Router();

downloadsRouter.get("/agent", async (_req, res) => {
  try {
    const url = await getAgentDownloadUrl();
    return res.json({ url });
  } catch (err) {
    console.error("agent download error:", err);
    return res.status(500).json({ message: "Failed to generate download URL" });
  }
});

downloadsRouter.get("/gallery", async (_req, res) => {
  try {
    const urls = await getGalleryUrls();
    return res.json(urls);
  } catch (err) {
    console.error("gallery error:", err);
    return res.status(500).json({ message: "Failed to load gallery" });
  }
});

export default downloadsRouter;