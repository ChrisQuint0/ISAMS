import { useState, useEffect } from "react";
import { settingsService } from "../services/settingsService";

export function useSettings() {
  const [settings, setSettings] = useState({
    college_name: "College of Computer Studies"
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const collegeName = await settingsService.getSetting("college_name");
      if (collegeName) {
        setSettings(prev => ({ ...prev, college_name: collegeName }));
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateCollegeName = async (newName) => {
    try {
      await settingsService.updateSetting("college_name", newName);
      setSettings(prev => ({ ...prev, college_name: newName }));
      return true;
    } catch (err) {
      console.error("Failed to update college name:", err);
      throw err;
    }
  };

  return {
    settings,
    isLoading,
    updateCollegeName,
    refreshSettings: fetchSettings
  };
}
