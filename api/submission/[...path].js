/**
 * Vercel Serverless Handler for Submission Backend
 * Routes: /api/submission/*
 */

import { initializeSubmissionApp } from "../../submission_backend.js";

let cachedApp = null;

export default async function handler(req, res) {
  try {
    if (!cachedApp) {
      console.log("[Vercel Submission Handler] Initializing...");
      cachedApp = await initializeSubmissionApp();
    }

    // Remove /api/submission prefix from path for Express routing
    req.url = req.url.replace(/^\/api\/submission/, "") || "/";

    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel Submission Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
