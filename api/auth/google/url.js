/**
 * Standalone OAuth URL Generator for Vercel
 * Generates Google OAuth consent URL
 */
import { google } from "googleapis";

export default function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // Get OAuth credentials from environment
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ Missing Google OAuth credentials in environment");
    return res.status(500).json({
      error: "Google OAuth not configured",
      details: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET",
    });
  }

  try {
    // Create OAuth client with dynamic redirect URI
    const host = req.headers.host || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/oauth2callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    const scopes = [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: userId, // Pass userId to recover during callback
    });

    console.log(`✅ Generated auth URL for user ${userId}`);
    res.json({ url: authUrl });
  } catch (error) {
    console.error("❌ Error generating auth URL:", error);
    res.status(500).json({
      error: "Failed to generate auth URL",
      details: error.message,
    });
  }
}
