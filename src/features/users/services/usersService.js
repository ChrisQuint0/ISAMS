import { supabase } from "@/lib/supabaseClient";

/**
 * Updates a user record in the database.
 * @param {string} userId - The UUID of the user to update.
 * @param {object} updates - An object containing the fields to update.
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function updateUser(userId, updates) {
    try {
        const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || "Failed to update user on the server.");
        }

        // After the server-side update is successful, re-fetch the updated
        // row from the view to ensure the grid has the most accurate data.
        const { data, error } = await supabase
            .from("users_with_roles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Error re-fetching updated user:", error);
            // Even if re-fetch fails, the update was successful.
            // We can return the local data, but it might be slightly out of sync.
            return { data: updates, error: null };
        }

        return { data, error };

    } catch (error) {
        console.error("Error in updateUser service:", error);
        return { data: null, error };
    }
}
