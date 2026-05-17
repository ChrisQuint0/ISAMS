/**
 * Vercel Serverless Handler for Main Backend
 * This imports the Express app from server.js and wraps it for Vercel
 */

import { initializeApp } from "../server.js";

// Module-level cache for the Express app
let cachedApp = null;

export default async function handler(req, res) {
  try {
    // Initialize app once and cache it
    if (!cachedApp) {
      console.log("[Vercel Handler] Initializing Express app...");
      cachedApp = await initializeApp();
    }

    // Forward request to Express app
    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel Handler] Error:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error.message 
    });
  }
}
