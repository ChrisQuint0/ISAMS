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
    try {
      const updates = typeof body === "string" ? JSON.parse(body) : body;
      // 1. Update auth.users metadata if needed
      const authUpdatePayload = {};
      if (updates.first_name || updates.last_name) {
        authUpdatePayload.user_metadata = {};
        if (updates.first_name)
          authUpdatePayload.user_metadata.first_name = updates.first_name;
        if (updates.last_name)
          authUpdatePayload.user_metadata.last_name = updates.last_name;
      }
      if (updates.email) {
        authUpdatePayload.email = updates.email;
      }
      if (Object.keys(authUpdatePayload).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          authUpdatePayload,
        );
        if (authError) throw authError;
      }

      // 2. Update the user_rbac table if needed
      const rbacUpdatePayload = {};
      const rbacFields = [
        "status",
        "thesis",
        "thesis_role",
        "facsub",
        "facsub_role",
        "labman",
        "labman_role",
        "studvio",
        "studvio_role",
        "superadmin",
      ];
      rbacFields.forEach((field) => {
        if (updates[field] !== undefined) {
          rbacUpdatePayload[field] = updates[field];
        }
      });
      if (Object.keys(rbacUpdatePayload).length > 0) {
        const { error: rbacError } = await supabaseAdmin
          .from("user_rbac")
          .update(rbacUpdatePayload)
          .eq("user_id", userId);
        if (rbacError) throw rbacError;
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === "GET") {
    // Fetch user info from users_with_roles view
    try {
      const { data, error } = await supabaseAdmin
        .from("users_with_roles")
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
