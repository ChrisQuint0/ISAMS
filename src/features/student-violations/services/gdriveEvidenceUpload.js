const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3002';

/**
 * Upload a file to Google Drive via the server.js backend.
 * @param {File} file - The file to upload
 * @param {string} folderId - The Google Drive folder ID to upload into
 * @returns {Promise<{ id: string, name: string, webViewLink: string, webContentLink: string }>}
 */
export const uploadEvidenceToGDrive = async (file, folderId) => {
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
 * Delete a file from Google Drive via the backend.
 * @param {string} fileId - The Google Drive file ID to delete (move to trash)
 * @returns {Promise<{ message: string }>}
 */
export const deleteEvidenceFromGDrive = async (fileId) => {
    const res = await fetch(`${API_BASE}/api/files/delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(err.error || 'Google Drive delete failed');
    }

    return res.json();
};
