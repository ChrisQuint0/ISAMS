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

    // Prepend /api/hte to the path since Vercel strips it
    req.url = `/api/hte${req.url}`;
    console.log(`[Vercel HTE Handler] Forwarding request to: ${req.url}`);

    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel HTE Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
