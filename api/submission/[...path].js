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

    // submission_backend.js routes are defined as /api/* (without /submission)
    // Vercel strips /api/submission, so we prepend /api
    const originalUrl = req.url;
    req.url = `/api${req.url}`;
    console.log(`[Vercel Submission Handler] ${originalUrl} -> ${req.url}`);

    return cachedApp(req, res);
  } catch (error) {
    console.error("[Vercel Submission Handler] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
