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

    // Express routes in thesis_backend.js already include /api/thesis prefix
    // No path modification needed

    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel Thesis Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
