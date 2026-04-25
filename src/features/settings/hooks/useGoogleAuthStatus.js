import { useState, useEffect, useRef, useCallback } from "react";
import { settingsService } from "../services/settingsService";

/**
 * Polls the Google auth status for the current user.
 * Returns: { isExpiredOrMissing, isLoading, recheck }
 *
 * - isExpiredOrMissing: true when the token is absent or does not have Drive scope
 * - isLoading: true while the initial check is in progress
 * - recheck: call this function to force a re-check (e.g. after navigating back from Settings)
 */
export function useGoogleAuthStatus(userId) {
  const [status, setStatus] = useState({
    isExpiredOrMissing: false,
    isLoading: true,
  });

  const isFetching = useRef(false);
  const checkedFor = useRef(null);

  const check = useCallback(
    async (force = false) => {
      if (!userId) return;
      if (!force && isFetching.current) return;
      if (!force && checkedFor.current === userId) return;

      isFetching.current = true;
      checkedFor.current = userId;

      try {
        const result = await settingsService.getGoogleAuthStatus(userId);
        const missing =
          !result.authenticated || result.hasDriveScope === false;
        setStatus({ isExpiredOrMissing: missing, isLoading: false });
      } catch {
        // Treat errors conservatively: don't block the UI
        setStatus({ isExpiredOrMissing: false, isLoading: false });
      } finally {
        isFetching.current = false;
      }
    },
    [userId]
  );

  useEffect(() => {
    if (userId) {
      check();
    }
  }, [userId, check]);

  return {
    isExpiredOrMissing: status.isExpiredOrMissing,
    isLoading: status.isLoading,
    recheck: () => {
      checkedFor.current = null;
      check(true);
    },
  };
}
