/**
 * Thesis Advisers & Categories Handler
 * Returns list of advisers and categories for dropdowns
 */
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { type } = req.query;

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (type === "advisers" || req.url.includes("/advisers")) {
      // Get advisers
      const { data, error } = await supabase
        .from("vw_adviser_display")
        .select("*")
        .order("display_name", { ascending: true });

      if (error) throw error;
      return res.json(data);
    }

    if (type === "categories" || req.url.includes("/categories")) {
      // Get categories
      const { data, error } = await supabase
        .from("thesis_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return res.json(data);
    }

    // Return both if no specific type
    const [advisersResult, categoriesResult] = await Promise.all([
      supabase.from("vw_adviser_display").select("*").order("display_name", { ascending: true }),
      supabase.from("thesis_categories").select("*").order("name", { ascending: true }),
    ]);

    res.json({
      advisers: advisersResult.data || [],
      categories: categoriesResult.data || [],
    });
  } catch (error) {
    console.error("Error fetching thesis data:", error);
    res.status(500).json({ error: error.message });
  }
}
