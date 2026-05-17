/**
 * Thesis Create Handler
 * Route: /api/thesis/create
 */
import { createClient } from "@supabase/supabase-js";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await getRawBody(req, { limit: "10mb" });
    const { entry, authors, gdriveFile } = JSON.parse(rawBody.toString());

    if (!entry || !authors || !gdriveFile) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { supabaseAdmin } = await getSupabaseClients();

    const { data: newEntry, error: entryError } = await supabaseAdmin
      .from("thesis_entries")
      .insert(entry)
      .select()
      .single();

    if (entryError) throw entryError;

    const authorsToInsert = authors.map((author, index) => ({
      thesis_id: newEntry.id,
      first_name: author.firstName,
      last_name: author.lastName,
      display_order: index + 1,
    }));

    await supabaseAdmin.from("thesis_authors").insert(authorsToInsert);

    await supabaseAdmin.from("thesis_files").insert({
      thesis_id: newEntry.id,
      original_filename: entry.title + ".pdf",
      storage_path: gdriveFile.id,
    });

    res.json({ success: true, thesis: newEntry });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function getSupabaseClients() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabase = createClient(
    supabaseUrl,
    process.env.VITE_SUPABASE_ANON_KEY,
  );
  const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  return { supabase, supabaseAdmin };
}
