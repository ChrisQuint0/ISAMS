import { supabase } from '@/lib/supabaseClient';

/**
 * Google Drive Settings Utility for Faculty Submissions
 *
 * Manages the GDrive folder link via localStorage and provides
 * helper functions for folder ID extraction and auth status checks.
 */

const STORAGE_KEY = 'fsFolderLink';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

/**
 * Get the saved Google Drive folder link from localStorage
 */
export const getFolderLink = async () => {
    try {
        const { data, error } = await supabase
            .from('systemsettings_fs')
            .select('setting_value')
            .eq('setting_key', 'gdrive_root_folder_id')
            .single();

        if (error || !data) return '';
        return data.setting_value;
    } catch (e) {
        console.error("Failed to fetch GDrive folder link from DB:", e);
        return '';
    }
};

/**
 * Save the Google Drive folder link to localStorage
 */
export const setFolderLink = (link) => {
    console.warn("setFolderLink is deprecated. Use the Admin Settings UI to update the database directly.");
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
        const res = await fetch(`${API_BASE}/api/status`);
        if (!res.ok) return false;
        const data = await res.json();
        return data.authenticated === true;
    } catch (e) {
        // server.js is not running
        return false;
    }
};

/**
 * Ensure the Google Drive nested folder structure exists for a submission.
 * @param {string} rootFolderId - The admin-configured root folder
 * @param {string} facultyName - Faculty name for the first nested folder
 * @param {string} termName - Semester/Term name for the second nested folder
 * @returns {Promise<string>} The resolved target folder ID
 */
export const ensureFolderStructure = async (rootFolderId, facultyName, termName) => {
    const res = await fetch(`${API_BASE}/api/folders/ensure`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rootFolderId, facultyName, termName }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to ensure folder structure' }));
        throw new Error(err.error || 'Failed to ensure Google Drive folder structure');
    }

    const data = await res.json();
    return data.targetFolderId;
};

/**
 * Upload a file to Google Drive via the server.js backend.
 * @param {File} file - The file to upload
 * @param {string} folderId - The Google Drive folder ID to upload into
 * @returns {Promise<{ id: string, name: string, webViewLink: string, webContentLink: string }>}
 */
export const uploadToGDrive = async (file, folderId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
        formData.append('folderId', folderId);
    }

    const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Google Drive upload failed');
    }

    return res.json(); // { id, name, webViewLink, webContentLink }
};

/**
 * List files from a Google Drive folder via the server.js backend.
 * @param {string} folderId - The Google Drive folder ID
 * @returns {Promise<Array<{ id: string, name: string, webViewLink: string, iconLink: string }>>}
 */
export const listGDriveFiles = async (folderId) => {
    const res = await fetch(`${API_BASE}/api/files?folderId=${folderId}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to list files' }));
        throw new Error(err.error || 'Failed to list Google Drive files');
    }
    return res.json();
};
