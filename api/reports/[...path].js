/**
 * Vercel Serverless Handler for /api/reports/* routes
 */

import { initializeApp } from "../../server.js";

let cachedApp = null;

export default async function handler(req, res) {
  try {
    if (!cachedApp) {
      console.log("[Vercel Reports Handler] Initializing Express app...");
      cachedApp = await initializeApp();
    }

    // Prepend /api/reports to the path since Vercel strips it
    req.url = `/api/reports${req.url}`;
    console.log(`[Vercel Reports Handler] Forwarding request to: ${req.url}`);

    // Forward request to Express app
    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel Reports Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
