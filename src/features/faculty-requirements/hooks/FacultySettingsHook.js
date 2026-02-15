import { useState, useEffect } from 'react';
import { FacultySettingsService } from '../services/FacultySettingsService';

export function useFacultySettings() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (firstName, lastName) => {
        if (!profile) return;
        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await FacultySettingsService.updateProfile(profile.faculty_id, { firstName, lastName });
            setProfile(prev => ({ ...prev, first_name: firstName, last_name: lastName }));
            setSuccessMessage('Profile updated successfully.');
        } catch (err) {
            setError('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const updatePreferences = async (emailEnabled, frequency) => {
        if (!profile) return;
        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await FacultySettingsService.updatePreferences(profile.faculty_id, { emailEnabled, frequency });
            setProfile(prev => ({
                ...prev,
                email_reminders_enabled: emailEnabled,
                reminder_frequency: frequency
            }));
            setSuccessMessage('Preferences saved.');
        } catch (err) {
            setError('Failed to save preferences.');
        } finally {
            setSaving(false);
        }
    };

    return {
        profile,
        loading,
        saving,
        error,
        successMessage,
        refreshProfile: loadProfile,
        updateProfile,
        updatePreferences
    };
}
