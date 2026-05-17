/**
 * Vercel Serverless Handler for Thesis Backend
 * Routes: /api/thesis/*
 */

import { initializeThesisApp } from "../../thesis_backend.js";

let cachedApp = null;

export default async function handler(req, res) {
  try {
    if (!cachedApp) {
      console.log("[Vercel Thesis Handler] Initializing...");
      cachedApp = await initializeThesisApp();
    }

    // Prepend /api/thesis to the path since Vercel strips it
    req.url = `/api/thesis${req.url}`;
    console.log(`[Vercel Thesis Handler] Forwarding request to: ${req.url}`);

    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel Thesis Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
