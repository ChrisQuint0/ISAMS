import { useState, useEffect, useCallback } from "react";
import { logoService } from "../services/logoService";

export function useLogo() {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogo = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = await logoService.getLogoUrl();
      setLogoUrl(url);
    } catch (err) {
      console.error("Failed to fetch logo:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogo();
  }, [fetchLogo]);

  const uploadLogo = async (file) => {
    setIsLoading(true);
    try {
      const newUrl = await logoService.uploadLogo(file);
      setLogoUrl(newUrl);
      return newUrl;
    } catch (err) {
      console.error("Failed to upload logo:", err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLogo = async () => {
    setIsLoading(true);
    try {
      await logoService.deleteLogo();
      setLogoUrl(null);
    } catch (err) {
      console.error("Failed to delete logo:", err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logoUrl,
    isLoading,
    error,
    uploadLogo,
    deleteLogo,
    refreshLogo: fetchLogo
  };
}
