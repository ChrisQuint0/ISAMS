/**
 * Cross-platform URL opener.
 * In a Tauri desktop context, window.open() is blocked for external URLs.
 * This utility detects Tauri and uses the shell plugin to open in the system browser.
 * Falls back to window.open() in the web version.
 */
export async function openUrl(url) {
  if (!url) return;

  try {
    // Detect if running inside Tauri
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

    if (isTauri) {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    console.error('[openUrl] Failed to open URL:', err);
    // Final fallback
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
