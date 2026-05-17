// /api/users/[userId].js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const {
    VITE_SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  } = process.env;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Supabase config missing" });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const {
    query: { userId },
    method,
    body,
  } = req;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId in route" });
  }

  if (method === "PATCH" || method === "PUT" || method === "POST") {
    // Update user info in users table (not auth)
    try {
      const updates = typeof body === "string" ? JSON.parse(body) : body;
      // Remove protected fields if present
      delete updates.id;
      delete updates.created_at;
      // Update users table
      const { error } = await supabaseAdmin
        .from("users")
        .update(updates)
        .eq("id", userId);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === "GET") {
    // Fetch user info
    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET", "PATCH", "PUT", "POST"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

export const config = {
  api: { bodyParser: true },
};
