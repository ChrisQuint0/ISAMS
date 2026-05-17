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

    // Remove /api/hte prefix from path for Express routing
    req.url = req.url.replace(/^\/api\/hte/, "") || "/";

    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel HTE Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
