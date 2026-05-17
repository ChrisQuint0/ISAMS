/**
 * Thesis Create Handler
 * Creates new thesis entry with authors and file metadata
 */
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { entry, authors, gdriveFile } = req.body;

  if (!entry || !authors || !gdriveFile) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Insert thesis entry
    const { data: thesis, error: thesisError } = await supabaseAdmin
      .from("thesis_entries")
      .insert([entry])
      .select()
      .single();

    if (thesisError) throw thesisError;

    // 2. Insert authors
    const authorsToInsert = authors.map((author, index) => ({
      thesis_id: thesis.id,
      first_name: author.firstName,
      last_name: author.lastName,
      display_order: index + 1,
    }));

    const { error: authorsError } = await supabaseAdmin
      .from("thesis_authors")
      .insert(authorsToInsert);

    if (authorsError) throw authorsError;

    // 3. Insert file metadata
    const fileMetadata = {
      thesis_id: thesis.id,
      original_filename: entry.title + ".pdf",
      storage_path: gdriveFile.id,
      storage_bucket: "google-drive",
      mime_type: "application/pdf",
    };

    const { error: fileError } = await supabaseAdmin
      .from("thesis_files")
      .insert([fileMetadata]);

    if (fileError) throw fileError;

    console.log(`✅ Created thesis: ${entry.title} (${thesis.id})`);
    res.json({ success: true, thesis });
  } catch (error) {
    console.error("Error creating thesis:", error);
    res.status(500).json({ error: error.message });
  }
}
