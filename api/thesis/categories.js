/**
 * Thesis Categories Handler
 * Route: /api/thesis/categories
 */
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from("thesis_categories")
      .select("*")
      .order("name", { ascending: true });

    res.json(data || []);
  } catch (error) {
    console.error("Categories error:", error);
    res.status(500).json({ error: error.message });
  }
}
