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
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// THESIS SPECIFIC CONFIG
const THESIS_ROOT_FOLDER_ID = "1oTrBXMT3KxBORnVBtaGJ0JlSeiJ1GgmD";

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
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

// Upload endpoint specific to Thesis Archiving
app.post("/api/thesis/upload", upload.single("file"), async (req, res) => {
    try {
        const auth = await loadToken();
        if (!auth) return res.status(401).json({ error: "Not authenticated with GDrive" });

        const drive = google.drive({ version: "v3", auth });

        // Use the title or a timestamped name for uniqueness
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${timestamp}-${req.file.originalname}`;

        const fileMetadata = {
            name: fileName,
            parents: [THESIS_ROOT_FOLDER_ID],
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
    } catch (error) {
        console.error("Error uploading thesis file:", error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy/Helper to get advisers (to keep logic in one place if needed)
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

// Multi-table creation endpoint (Bypasses RLS using Service Role Key)
app.post("/api/thesis/create", async (req, res) => {
    const { entry, authors, gdriveFile } = req.body;

    try {
        // 1. Insert Core Thesis Entry
        const { data: thesis, error: thesisError } = await supabaseAdmin
            .from("thesis_entries")
            .insert([entry])
            .select()
            .single();

        if (thesisError) throw thesisError;

        // 2. Insert Authors
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

        // 3. Insert File Metadata
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

        // 4. Create Audit Log
        await supabaseAdmin.from("ta_audit_logs").insert([{
            actor_user_id: entry.added_by,
            actor_name: "System User (Admin)", // Or fetch name if available
            action: "Add",
            description: `Archived new thesis: "${entry.title}"`,
            record_id: thesis.id,
            record_type: "thesis_entries",
            new_values: entry
        }]);

        res.json({ success: true, thesis });
    } catch (error) {
        console.error("Error creating thesis entry:", error);
        res.status(500).json({ error: error.message });
    }
});

// Generic Error Handler to ensure JSON responses
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
        path: req.path
    });
});

app.listen(port, () => {
    console.log(`Thesis Backend running at http://localhost:${port}`);
});
