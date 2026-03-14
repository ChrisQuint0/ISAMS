import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const LabSettingsContext = createContext();

export const useGlobalSettings = () => {
    return useContext(LabSettingsContext);
};

export const LabSettingsProvider = ({ children, labName }) => {
    const [settings, setSettings] = useState({
        anti_cutting: true,
        hard_capacity: true,
        auto_assignment: true,
        maintenance_threshold: 500,
    });
    const [loading, setLoading] = useState(true);

    const refreshSettings = useCallback(async () => {
        if (!labName) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('lab_settings_lm')
                .select('*')
                .eq('lab_name', labName)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching lab settings:", error.message);
            } else if (data) {
                setSettings({
                    anti_cutting: data.anti_cutting ?? true,
                    hard_capacity: data.hard_capacity ?? true,
                    auto_assignment: data.auto_assignment ?? true,
                    maintenance_threshold: data.maintenance_threshold ?? 500,
                });
            } else {
                // PGRST116 means no rows found, use defaults
                setSettings({
                    anti_cutting: true,
                    hard_capacity: true,
                    auto_assignment: true,
                    maintenance_threshold: 500,
                });
            }
        } catch (error) {
            console.error("Unexpected error fetching lab settings:", error.message);
        } finally {
            setLoading(false);
        }
    }, [labName]);

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    return (
        <LabSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
            {children}
        </LabSettingsContext.Provider>
    );
};
