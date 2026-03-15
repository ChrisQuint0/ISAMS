import { useState, useEffect } from 'react';
import { FacultySettingsService } from '../services/FacultySettingsService';

export function useFacultySettings() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPreferences, setSavingPreferences] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await FacultySettingsService.getProfile();
            setProfile(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load profile');
            setTimeout(() => setError(null), 3000); // FIX: Clear sticky error
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (firstName, lastName, email) => {
        if (!profile) return;
        setSavingProfile(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await FacultySettingsService.updateProfile(profile.faculty_id, { firstName, lastName, email });
            setProfile(prev => ({
                ...prev,
                first_name: firstName,
                last_name: lastName,
                email: email
            }));
            setSuccessMessage('Profile updated successfully.');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            setError('Failed to update profile.');
            setTimeout(() => setError(null), 3000);
        } finally {
            setSavingProfile(false);
        }
    };

    const updatePreferences = async (emailEnabled) => {
        if (!profile) return;
        setSavingPreferences(true);
        setError(null);
        setSuccessMessage(null);
        try {
            // Keep existing frequency as it's now admin-controlled and hidden from user
            const frequency = profile.reminder_frequency || "3_days_before";
            await FacultySettingsService.updatePreferences(profile.faculty_id, { emailEnabled, frequency });
            setProfile(prev => ({
                ...prev,
                email_reminders_enabled: emailEnabled
            }));
            setSuccessMessage('Preferences saved.');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            setError('Failed to save preferences.');
            setTimeout(() => setError(null), 3000);
        } finally {
            setSavingPreferences(false);
        }
    };

    return {
        profile,
        loading,
        savingProfile,       // ← was saving
        savingPreferences,   // ← new
        error,
        successMessage,
        refreshProfile: loadProfile,
        updateProfile,
        updatePreferences
    };
}