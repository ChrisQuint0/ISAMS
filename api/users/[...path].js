/**
 * Vercel Serverless Handler for /api/users/* routes
 */

import { initializeApp } from "../../server.js";

let cachedApp = null;

export default async function handler(req, res) {
  try {
    if (!cachedApp) {
      console.log("[Vercel Users Handler] Initializing Express app...");
      cachedApp = await initializeApp();
    }

    // Prepend /api/users to the path since Vercel strips it
    req.url = `/api/users${req.url}`;
    console.log(`[Vercel Users Handler] Forwarding request to: ${req.url}`);

    // Forward request to Express app
    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel Users Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
