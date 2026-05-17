/**
 * Standalone OAuth Callback Handler for Vercel
 * Handles Google OAuth redirect and stores tokens
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export default async function handler(req, res) {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).send("Missing code or userId");
  }

  // Get OAuth credentials
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return res.status(500).send("Google OAuth not configured");
  }

  // Get Supabase credentials (use service role for token storage)
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).send("Supabase not configured");
  }

  try {
    // Create OAuth client with dynamic redirect URI
    const host = req.headers.host || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/oauth2callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info to display in success message
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing token record
    const { data: existingToken } = await supabaseAdmin
      .from("google_auth_tokens")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const tokenData = {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
      created_at: new Date().toISOString(),
    };

    // If exists, update the same ID to avoid conflicts
    if (existingToken) {
      tokenData.id = existingToken.id;
    }

    const { error } = await supabaseAdmin
      .from("google_auth_tokens")
      .upsert(tokenData);

    if (error) {
      console.error("Supabase error saving Google tokens:", error);
      return res.status(500).send(
        `Error saving tokens to database: ${error.message}`
      );
    }

    console.log(`✅ OAuth tokens saved for user ${userId} (${userInfo.email})`);

    // Success - show HTML response
    res.send(`
      <html>
        <head>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #1e293b; }
            .card { background: white; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px; }
            h2 { color: #008A45; margin-top: 0; }
            button { background: #008A45; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; font-weight: 600; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Authentication Successful!</h2>
            <p>You have successfully connected your Google account <strong>${userInfo.email}</strong>.</p>
            <p>You can now close this window and return to ISAMS.</p>
            <button onclick="window.close()">Close Window</button>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 5000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).send("Authentication failed: " + error.message);
  }
}
