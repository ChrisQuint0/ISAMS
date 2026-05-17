/**
 * Vercel Serverless Handler for HTE Backend
 * Routes: /api/hte/*
 */

import { initializeHteApp } from "../../hte_backend.js";

let cachedApp = null;

export default async function handler(req, res) {
  try {
    if (!cachedApp) {
      console.log("[Vercel HTE Handler] Initializing...");
      cachedApp = await initializeHteApp();
    }

    // Express routes in hte_backend.js already include /api/hte prefix
    // No path modification needed

    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel HTE Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
