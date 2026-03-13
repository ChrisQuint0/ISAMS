import express from "express";
import cors from "cors";
import multer from "multer";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { Readable } from "stream";

// Load environment variables
dotenv.config({ path: "./.env.local" });

const app = express();
const port = 3001; // Separate port to avoid conflict with server.js

// Config
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/oauth2callback";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Helper to get settings from DB
async function getThesisSetting(key) {
    if (!supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin
        .from("thesis_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
    
    if (error) {
        console.error(`[Settings] Error fetching ${key}:`, error);
        return null;
    }
    return data?.value || null;
}

const DEFAULT_THESIS_ROOT_FOLDER_ID = "1oTrBXMT3KxBORnVBtaGJ0JlSeiJ1GgmD";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check
app.get("/", (req, res) => res.json({ status: "Thesis Backend Running", port: 3001 }));

// Client for regular operations (obeying RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ADMIN/SERVICE Client to bypass RLS for critical transactions
const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
);

const upload = multer({ storage: multer.memoryStorage() });

async function loadToken() {
    const { data, error } = await supabase
        .from("google_auth_tokens")
        .select("*")
        .eq("id", 1)
        .single();

    if (error || !data) return null;

    oauth2Client.setCredentials({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        scope: data.scope,
        token_type: data.token_type,
        expiry_date: data.expiry_date,
    });

    return oauth2Client;
}

// Download endpoint specific to Thesis Archiving
app.get("/api/thesis/download/:fileId", async (req, res) => {
    try {
        const { fileId } = req.params;
        const auth = await loadToken();
        if (!auth) return res.status(401).json({ error: "Not authenticated with GDrive" });

        const drive = google.drive({ version: "v3", auth });

        // 1. Get file metadata to set headers
        console.log(`[Download] Fetching metadata for ID: ${fileId}`);
        const { data: fileMetadata } = await drive.files.get({
            fileId: fileId,
            fields: "name, mimeType"
        });

        // 2. Set response headers for download
        res.setHeader("Content-Type", fileMetadata.mimeType || "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fileMetadata.name}"`);

        // 3. Stream from Google Drive
        console.log(`[Download] Starting stream for: ${fileMetadata.name}`);
        const response = await drive.files.get(
            { fileId: fileId, alt: "media" },
            { responseType: "stream" }
        );

        response.data
            .on("error", (err) => {
                console.error("Stream error:", err);
                if (!res.headersSent) {
                    res.status(500).json({ error: "Failed to stream file" });
                }
            })
            .pipe(res);

    } catch (error) {
        console.error("Error downloading thesis file:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

// Upload endpoint specific to Thesis Archiving
app.post("/api/thesis/upload", upload.single("file"), async (req, res) => {
    try {
        const auth = await loadToken();
        if (!auth) return res.status(401).json({ error: "Not authenticated with GDrive" });

        const drive = google.drive({ version: "v3", auth });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${timestamp}-${req.file.originalname}`;

        const folderId = (await getThesisSetting("thesis_root_folder_id")) || DEFAULT_THESIS_ROOT_FOLDER_ID;

        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };

        const media = {
            mimeType: req.file.mimetype,
            body: Readable.from(req.file.buffer),
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id, name, webViewLink, webContentLink",
        });

        res.json(file.data);

        // Activity Log
        await logAuditTrail(req, {
            action: "Upload",
            description: `Uploaded thesis file: "${fileName}"`,
            moduleAffected: "Thesis Archiving",
            recordId: file.data.id,
            recordType: "thesis_files",
            newValues: { fileName, folderId: folderId },
            actorUserId: req.body.actorUserId || null,
            actorName: req.body.actorName || "Admin"
        });
    } catch (error) {
        console.error("Error uploading thesis file:", error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy/Helper to get advisers
app.get("/api/thesis/advisers", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("vw_adviser_display")
            .select("*")
            .order("display_name", { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Proxy/Helper to get categories
app.get("/api/thesis/categories", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("thesis_categories")
            .select("*")
            .order("name", { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Multi-table creation endpoint (Bypasses RLS)
app.post("/api/thesis/create", async (req, res) => {
    const { entry, authors, gdriveFile } = req.body;

    try {
        const { data: thesis, error: thesisError } = await supabaseAdmin
            .from("thesis_entries")
            .insert([entry])
            .select()
            .single();

        if (thesisError) throw thesisError;

        const authorsToInsert = authors.map((author, index) => ({
            thesis_id: thesis.id,
            first_name: author.firstName,
            last_name: author.lastName,
            display_order: index + 1
        }));

        const { error: authorsError } = await supabaseAdmin
            .from("thesis_authors")
            .insert(authorsToInsert);

        if (authorsError) throw authorsError;

        const fileMetadata = {
            thesis_id: thesis.id,
            original_filename: entry.title + ".pdf",
            storage_path: gdriveFile.id,
            storage_bucket: "google-drive",
            mime_type: "application/pdf"
        };

        const { error: fileError } = await supabaseAdmin
            .from("thesis_files")
            .insert([fileMetadata]);

        if (fileError) throw fileError;

        // Log the event
        await logAuditTrail(req, {
            action: "Add",
            description: `Archived new thesis: "${entry.title}"`,
            moduleAffected: "Thesis Archiving",
            recordId: thesis.id,
            recordType: "thesis_entries",
            newValues: entry,
            actorUserId: entry.added_by,
            actorName: req.body.actorName || "System User"
        });

        res.json({ success: true, thesis });
    } catch (error) {
        console.error("Error creating thesis entry:", error);
        res.status(500).json({ error: error.message });
    }
});

// Update thesis entry endpoint (Bypasses RLS)
app.post("/api/thesis/update", async (req, res) => {
    const { id, entry, authors, gdriveFile } = req.body;

    try {
        // 1. Fetch old values for audit log and file deletion
        const { data: oldEntry, error: fetchError } = await supabaseAdmin
            .from("thesis_entries")
            .select("*, files:thesis_files(*)")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Update thesis entry
        const { error: entryUpdateError } = await supabaseAdmin
            .from("thesis_entries")
            .update(entry)
            .eq("id", id);

        if (entryUpdateError) throw entryUpdateError;

        // 3. Update authors (Delete existing and re-insert)
        const { error: authorsDeleteError } = await supabaseAdmin
            .from("thesis_authors")
            .delete()
            .eq("thesis_id", id);

        if (authorsDeleteError) throw authorsDeleteError;

        const authorsToInsert = authors.map((author, index) => ({
            thesis_id: id,
            first_name: author.firstName,
            last_name: author.lastName,
            display_order: index + 1
        }));

        const { error: authorsInsertError } = await supabaseAdmin
            .from("thesis_authors")
            .insert(authorsToInsert);

        if (authorsInsertError) throw authorsInsertError;

        // 4. Update file if provided
        if (gdriveFile) {
            // Delete old file from Google Drive if it exists
            const oldFileId = oldEntry.files?.[0]?.storage_path;
            if (oldFileId) {
                try {
                    const auth = await loadToken();
                    if (auth) {
                        const drive = google.drive({ version: "v3", auth });
                        console.log(`[Update] Deleting old file: ${oldFileId}`);
                        await drive.files.delete({ fileId: oldFileId });
                    }
                } catch (deleteError) {
                    console.error("Error deleting old file from GDrive:", deleteError);
                    // We don't throw here to avoid failing the whole update if deletion fails
                }
            }

            const fileMetadata = {
                original_filename: entry.title + ".pdf",
                storage_path: gdriveFile.id,
                storage_bucket: "google-drive",
                mime_type: "application/pdf"
            };

            const { error: fileUpdateError } = await supabaseAdmin
                .from("thesis_files")
                .update(fileMetadata)
                .eq("thesis_id", id);

            if (fileUpdateError) throw fileUpdateError;
        }

        // 5. Log the event
        await logAuditTrail(req, {
            action: "Update",
            description: `Updated thesis details: "${entry.title}"`,
            moduleAffected: "Thesis Archiving",
            recordId: id,
            recordType: "thesis_entries",
            oldValues: oldEntry,
            newValues: entry,
            actorUserId: entry.updated_by || req.body.actorUserId,
            actorName: req.body.actorName || "System User"
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating thesis entry:", error);
        res.status(500).json({ error: error.message });
    }
});

// Deletion endpoint (Bypasses RLS)
app.post("/api/thesis/delete", async (req, res) => {
    const { id, actorName, actorUserId } = req.body;

    try {
        // 1. Fetch info for audit log and GDrive cleanup
        const { data: thesis, error: fetchError } = await supabaseAdmin
            .from("thesis_entries")
            .select("title, files:thesis_files(storage_path)")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Delete files from Google Drive
        const auth = await loadToken();
        if (auth && thesis.files) {
            const drive = google.drive({ version: "v3", auth });
            for (const file of thesis.files) {
                if (file.storage_path) {
                    try {
                        console.log(`[Delete] Removing file from GDrive: ${file.storage_path}`);
                        await drive.files.delete({ fileId: file.storage_path });
                    } catch (driveError) {
                        console.error(`[Delete] Error deleting file ${file.storage_path}:`, driveError.message);
                        // Continue deletion process even if GDrive delete fails (e.g. file already gone)
                    }
                }
            }
        }

        // 3. Perform soft delete in DB
        const { error: deleteError } = await supabaseAdmin
            .from("thesis_entries")
            .update({ 
                is_deleted: true, 
                deleted_at: new Date().toISOString() 
            })
            .eq("id", id);

        if (deleteError) throw deleteError;

        // 4. Log the action
        await logAuditTrail(req, {
            action: "Delete",
            description: `Permanently removed thesis and files: "${thesis.title}"`,
            moduleAffected: "Thesis Archiving",
            recordId: id,
            recordType: "thesis_entries",
            oldValues: { title: thesis.title },
            actorUserId: actorUserId || null,
            actorName: actorName || "System"
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting thesis:", error);
        res.status(500).json({ error: error.message });
    }
});

// Generic Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
        path: req.path
    });
});

/**
 * Global Audit Log Helper
 */
async function logAuditTrail(req, {
    action,
    description,
    moduleAffected = "Thesis Archiving",
    recordId = null,
    recordType = null,
    oldValues = null,
    newValues = null,
    actorUserId = null,
    actorName = null
}) {
    if (!supabaseAdmin) return;

    // Prioritize info passed in the options, then from req.body (from frontend), then defaults
    const finalActorId = actorUserId || req.body?.actorUserId || null;
    const finalActorName = actorName || req.body?.actorName || "System";

    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const { error } = await supabaseAdmin
            .from("ta_audit_logs")
            .insert([{
                actor_user_id: finalActorId,
                actor_name: finalActorName,
                action,
                description,
                module_affected: moduleAffected,
                record_id: recordId ? String(recordId) : null,
                record_type: recordType,
                old_values: oldValues,
                new_values: newValues,
                ip_address: ipAddress || null,
                user_agent: userAgent
            }]);

        if (error) console.error("[AuditLog] Error inserting log:", error);
    } catch (err) {
        console.error("[AuditLog] Unexpected error:", err);
    }
}

app.listen(port, () => {
    console.log(`Thesis Backend running at http://localhost:${port}`);
});
