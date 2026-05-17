/**
 * Standalone OAuth Status Checker for Vercel
 * Checks if user has authenticated Google Drive access
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export default async function handler(req, res) {
  // Extract userId from path: /api/auth/google/status/[userId]
  const pathParts = req.url.split("/");
  const userId = pathParts[pathParts.length - 1]?.split("?")[0];

  if (!userId || userId === "null" || userId === "undefined") {
    return res.json({ authenticated: false });
  }

  // Initialize Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: "Supabase not configured",
      details: "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check user's token
    const { data: tokenRow } = await supabase
      .from("google_auth_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!tokenRow) {
      return res.json({ authenticated: false });
    }

    // Check if token has full Drive scope
    const hasDriveScope = !!(
      tokenRow.scope &&
      tokenRow.scope.match(/googleapis\.com\/auth\/drive(\s|$)/)
    );

    // Get OAuth credentials
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.json({
        authenticated: true,
        hasDriveScope,
        email: null,
        name: null,
        picture: null,
      });
    }

    // Create OAuth client and set credentials
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({
      access_token: tokenRow.access_token,
      refresh_token: tokenRow.refresh_token,
      scope: tokenRow.scope,
      token_type: tokenRow.token_type,
      expiry_date: tokenRow.expiry_date,
    });

    // Get user info
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    res.json({
      authenticated: true,
      hasDriveScope,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    });
  } catch (error) {
    console.error("❌ Error checking auth status:", error);
    res.json({ authenticated: false });
  }
}
