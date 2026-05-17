import { supabase } from "@/lib/supabaseClient";
import { getApiUrl } from "@/lib/apiConfig";

/**
 * Google Drive Settings Utility for Faculty Submissions
 *
 * Manages the GDrive folder link via localStorage and provides
 * helper functions for folder ID extraction and auth status checks.
 */

const STORAGE_KEY = "fsFolderLink";

/**
 * Get the saved Google Drive folder link from localStorage
 */
export const getFolderLink = async () => {
  try {
    const { data, error } = await supabase
      .from("systemsettings_fs")
      .select("setting_value")
      .eq("setting_key", "gdrive_root_folder_id")
      .single();

    if (error || !data) return "";
    return data.setting_value;
  } catch (e) {
    console.error("Failed to fetch GDrive folder link from DB:", e);
    return "";
  }
};

/**
 * Save the Google Drive folder link to localStorage
 */
export const setFolderLink = (link) => {
  console.warn(
    "setFolderLink is deprecated. Use the Admin Settings UI to update the database directly.",
  );
};

/**
 * Extract the folder ID from a Google Drive folder link.
 * Supports formats like:
 *   - https://drive.google.com/drive/folders/1A2B3C...
 *   - https://drive.google.com/drive/u/0/folders/1A2B3C...
 */
export const getFolderId = (link) => {
  if (!link) return null;
  try {
    // If it's already just an ID (no slashes), return it directly
    if (!link.includes("/")) return link;

    const match = link.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
};

/**
 * Check if the Google Drive backend (server.js) is authenticated.
 * Returns true if a valid OAuth token exists in Supabase.
 */
export const checkGDriveAuth = async () => {
  try {
    const res = await fetch(getApiUrl("/api/submission?operation=status"));
    if (!res.ok) return false;
    const data = await res.json();
    return data.authenticated === true;
  } catch (e) {
    // server.js is not running
    return false;
  }
};

/**
 * Ensure the Google Drive deep-nest folder structure exists for a submission.
 *
 * Hierarchy: Root > Academic Year > Semester > Faculty Name > [CourseCode] - [Section] > Document Type
 *
 * @param {string} rootFolderId - The admin-configured root folder
 * @param {Object} meta - Metadata for the folder chain
 * @param {string} [meta.academicYear] - e.g. "A.Y. 2025-2026"
 * @param {string} [meta.semester]     - e.g. "2nd Semester"
 * @param {string} [meta.facultyName]  - e.g. "Jane Doe"
 * @param {string} [meta.courseCode]    - e.g. "IT101"
 * @param {string} [meta.section]      - e.g. "A"
 * @param {string} [meta.docTypeName]  - e.g. "Syllabus"
 * @returns {Promise<string>} The resolved deepest target folder ID
 */
export const ensureFolderStructure = async (rootFolderId, meta = {}) => {
  // Support legacy 2-arg (rootFolderId, facultyName, termName) calls
  if (typeof meta === "string") {
    const facultyName = meta;
    const termName = arguments[2];
    meta = { facultyName, termName };
  }

  const res = await fetch(getApiUrl("/api/folders?operation=ensure"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rootFolderId,
      academicYear: meta.academicYear,
      semester: meta.semester,
      facultyName: meta.facultyName,
      courseCode: meta.courseCode,
      section: meta.section,
      docTypeName: meta.docTypeName,
      // Legacy field
      termName: meta.termName,
    }),
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: "Failed to ensure folder structure" }));
    throw new Error(
      err.error || "Failed to ensure Google Drive folder structure",
    );
  }

  const data = await res.json();
  return data.folderId;
};

/**
 * Rename all Google Drive folders matching oldFolderName to newFolderName.
 * Calls the submission backend's /api/folders/rename endpoint which searches the
 * entire Drive (scoped to the authenticated account) and bulk-renames matching folders.
 *
 * @param {string} rootFolderId - The admin-configured root GDrive folder ID (for scoping)
 * @param {string} oldFolderName - The current folder name to find
 * @param {string} newFolderName - The new name to apply
 * @returns {Promise<{ renamed: number, total: number, message: string }>}
 */
export const renameGDriveFolders = async (
  rootFolderId,
  oldFolderName,
  newFolderName,
) => {
  const res = await fetch(
    getApiUrl("/api/submission?operation=folder-rename"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rootFolderId, oldFolderName, newFolderName }),
    },
  );

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: "Failed to rename GDrive folders" }));
    throw new Error(err.error || "Failed to rename Google Drive folders");
  }

  return res.json(); // { renamed, total, message }
};

/**
 * Upload a file to Google Drive via the server.js backend.
 * @param {File} file - The file to upload
 * @param {string} folderId - The Google Drive folder ID to upload into
 * @returns {Promise<{ id: string, name: string, webViewLink: string, webContentLink: string }>}
 */
/**
 * Upload a file to Google Drive using chunked resumable upload.
 *
 * Flow:
 *   1. POST /api/submission?operation=initiate-upload  → get sessionUri (tiny JSON, no file data)
 *   2. For each 3 MB chunk:
 *        POST /api/submission?operation=upload-chunk
 *        Body: raw binary  |  Headers: X-Session-Uri, X-Chunk-Start, X-Total-Size
 *   3. Final chunk response includes Drive file metadata
 *
 * Each chunk is ≤3 MB, safely under Vercel's 4.5 MB payload limit.
 * Supports files of any size.
 *
 * @param {File} file      - The File object to upload
 * @param {string} folderId - Google Drive folder ID to upload into
 * @returns {Promise<{ id, name, webViewLink, webContentLink }>}
 */
export const uploadToGDrive = async (file, folderId) => {
  const CHUNK_SIZE = 3 * 1024 * 1024; // 3 MB — safely under Vercel's 4.5 MB limit

  // ── Step 1: Open a resumable upload session ────────────────────────────
  const initRes = await fetch(
    getApiUrl("/api/submission?operation=initiate-upload"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folderId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
      }),
    },
  );

  if (!initRes.ok) {
    const text = await initRes.text().catch(() => "");
    let message = `Failed to initiate upload (HTTP ${initRes.status})`;
    try {
      const json = JSON.parse(text);
      if (json.error) message = json.error;
    } catch (_) {
      if (text) console.error("[uploadToGDrive] Initiate error:", text.slice(0, 300));
    }
    throw new Error(message);
  }

  const { sessionUri } = await initRes.json();

  // ── Step 2: Upload in 3 MB chunks through our Vercel function ──────────
  // Vercel proxies each chunk to Google Drive using Content-Range headers.
  // The file never touches Vercel as a whole — only one chunk at a time.
  let uploadedBytes = 0;

  while (uploadedBytes < file.size) {
    const chunkBlob = file.slice(uploadedBytes, uploadedBytes + CHUNK_SIZE);
    const chunkBuffer = await chunkBlob.arrayBuffer();

    const chunkRes = await fetch(
      getApiUrl("/api/submission?operation=upload-chunk"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Session-Uri": sessionUri,
          "X-Chunk-Start": String(uploadedBytes),
          "X-Total-Size": String(file.size),
        },
        body: chunkBuffer,
      },
    );

    if (!chunkRes.ok) {
      const err = await chunkRes.json().catch(() => ({ error: "Chunk upload failed" }));
      throw new Error(err.error || `Chunk upload failed (HTTP ${chunkRes.status})`);
    }

    const result = await chunkRes.json();

    if (result.complete) {
      // Final chunk — Drive returned file metadata
      return {
        id: result.file.id,
        name: result.file.name,
        webViewLink: result.file.webViewLink,
        webContentLink: result.file.webContentLink,
      };
    }

    // More chunks needed — advance the pointer to where Drive confirms it received up to
    uploadedBytes = result.uploaded;
  }

  throw new Error("Upload loop ended without receiving file metadata from Drive");
};

/**
 * List files from a Google Drive folder via the server.js backend.
 * @param {string} folderId - The Google Drive folder ID
 * @returns {Promise<Array<{ id: string, name: string, webViewLink: string, iconLink: string }>>}
 */
export const listGDriveFiles = async (folderId) => {
  const res = await fetch(
    getApiUrl(`/api/file-ops?operation=list&folderId=${folderId}`),
  );
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: "Failed to list files" }));
    throw new Error(err.error || "Failed to list Google Drive files");
  }
  // API returns { files: [...] } — unwrap so callers get a plain array
  const body = await res.json();
  return Array.isArray(body) ? body : (body.files || []);
};

/**
 * Get metadata for a specific Google Drive file ID.
 * @param {string} fileId - The Google Drive file ID
 * @returns {Promise<Object>}
 */
export const getGDriveFileMetadata = async (fileId) => {
  const res = await fetch(
    getApiUrl(`/api/file-ops?operation=metadata&fileId=${fileId}`),
  );
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: "Failed to get file metadata" }));
    throw new Error(err.error || "Failed to fetch Google Drive file metadata");
  }
  return res.json();
};

/**
 * Search for files in Google Drive by name pattern.
 * @param {string} parentId - Optional parent folder ID to search within.
 * @param {string} query - The name pattern to search for.
 * @returns {Promise<Array>}
 */
export const searchGDriveFiles = async (parentId, query) => {
  const url = new URL(getApiUrl("/api/file-ops?operation=search"));
  if (parentId) url.searchParams.append("parentId", parentId);
  if (query) url.searchParams.append("query", query);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: "Failed to search files" }));
    throw new Error(err.error || "Failed to search Google Drive files");
  }
  return res.json();
};

/**
 * Clone an existing file in Google Drive to a new folder.
 * @param {string} fileId - The Google Drive ID of the file to copy
 * @param {string} targetFolderId - The folder ID where the copy should be placed
 * @param {string} [newFileName] - Optional new name for the copied file
 * @returns {Promise<{ id: string, name: string, webViewLink: string, webContentLink: string }>}
 */
export const cloneGDriveFile = async (fileId, targetFolderId, newFileName) => {
  const res = await fetch(getApiUrl("/api/file-ops?operation=clone"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileId, targetFolderId, newFileName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Clone failed" }));
    throw new Error(err.error || "Google Drive clone failed");
  }

  return res.json();
};
/**
 * Delete a file from Google Drive via the server.js backend.
 * @param {string} fileId - The Google Drive ID of the file to delete
 * @returns {Promise<{ message: string }>}
 */
export const deleteGDriveFile = async (fileId) => {
  const res = await fetch(getApiUrl("/api/file-ops?operation=delete"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Delete failed" }));
    throw new Error(err.error || "Google Drive delete failed");
  }

  return res.json();
};
