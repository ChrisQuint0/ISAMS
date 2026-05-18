// /api/users/[userId]/reset-password.js
// POST /api/users/{userId}/reset-password
// Resets a user's password using the Supabase Admin API.
// Requires SUPABASE_SERVICE_ROLE_KEY — only callable from the server side.

import { createClient } from "@supabase/supabase-js";

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const {
    VITE_SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  } = process.env;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Supabase config missing" });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in route" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { password } = body;

  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters." });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) throw error;

    return res.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("[reset-password] Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
