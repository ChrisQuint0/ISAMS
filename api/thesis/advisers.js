/**
 * Thesis Advisers Handler
 * Route: /api/thesis/advisers
 */
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from("vw_adviser_display")
      .select("*")
      .order("display_name", { ascending: true });

    res.json(data || []);
  } catch (error) {
    console.error("Advisers error:", error);
    res.status(500).json({ error: error.message });
  }
}
