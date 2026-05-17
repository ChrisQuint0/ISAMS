/**
 * Vercel Serverless Catch-All Handler for Main Backend
 * Handles all /api/* routes that don't match other specific handlers
 * (thesis, submission, hte have their own handlers)
 */

import { initializeApp } from "../server.js";

// Module-level cache for the Express app
let cachedApp = null;

export default async function handler(req, res) {
  try {
    // Initialize app once and cache it
    if (!cachedApp) {
      console.log("[Vercel Catch-All Handler] Initializing Express app...");
      cachedApp = await initializeApp();
    }

    // Forward request to Express app
    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel Catch-All Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
