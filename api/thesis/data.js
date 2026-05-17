/**
 * Thesis Data Handler (Combined advisers + categories)
 * Route: /api/thesis/data
 */
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [advisersResult, categoriesResult] = await Promise.all([
      supabase
        .from("vw_adviser_display")
        .select("*")
        .order("display_name", { ascending: true }),
      supabase
        .from("thesis_categories")
        .select("*")
        .order("name", { ascending: true }),
    ]);

    res.json({
      advisers: advisersResult.data || [],
      categories: categoriesResult.data || [],
    });
  } catch (error) {
    console.error("Data error:", error);
    res.status(500).json({ error: error.message });
  }
}
