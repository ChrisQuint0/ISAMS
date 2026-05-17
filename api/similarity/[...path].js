/**
 * Vercel Serverless Handler for /api/similarity/* routes
 */

import { initializeApp } from "../../server.js";

let cachedApp = null;

export default async function handler(req, res) {
  try {
    if (!cachedApp) {
      console.log("[Vercel Similarity Handler] Initializing Express app...");
      cachedApp = await initializeApp();
    }

    // Prepend /api/similarity to the path since Vercel strips it
    req.url = `/api/similarity${req.url}`;
    console.log(
      `[Vercel Similarity Handler] Forwarding request to: ${req.url}`,
    );

    // Forward request to Express app
    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel Similarity Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
