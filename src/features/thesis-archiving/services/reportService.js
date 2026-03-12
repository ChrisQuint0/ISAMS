import { supabase } from "@/lib/supabaseClient";

const API_BASE_URL = "http://localhost:3000/api/reports";

/**
 * Get user's auth token from Supabase session
 */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

/**
 * Fetch Thesis Archive Reports
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default 1)
 * @param {number} options.limit - Items per page (default 10)
 * @param {boolean} options.fullDataset - Return all data for export (default false)
 * @param {string} options.dateFrom - Filter by date from
 * @param {string} options.dateTo - Filter by date to
 * @param {string} options.department - Filter by department
 * @param {string} options.category - Filter by category
 * @returns {Promise<Object>} Thesis report data
 */
export async function fetchThesisReport({
  page = 1,
  limit = 10,
  fullDataset = false,
  dateFrom = "",
  dateTo = "",
  department = "All",
  category = "All",
} = {}) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const params = new URLSearchParams({
      page,
      limit,
      fullDataset,
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(department && department !== "All" && { department }),
      ...(category && category !== "All" && { category }),
    });

    const response = await fetch(`${API_BASE_URL}/thesis?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch thesis reports");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching thesis reports:", error);
    throw error;
  }
}

/**
 * Fetch Similarity Check Reports
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default 1)
 * @param {number} options.limit - Items per page (default 10)
 * @param {boolean} options.fullDataset - Return all data for export (default false)
 * @param {string} options.dateFrom - Filter by date from
 * @param {string} options.dateTo - Filter by date to
 * @param {string} options.category - Filter by category
 * @returns {Promise<Object>} Similarity report data
 */
export async function fetchSimilarityReport({
  page = 1,
  limit = 10,
  fullDataset = false,
  dateFrom = "",
  dateTo = "",
  category = "All",
} = {}) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const params = new URLSearchParams({
      page,
      limit,
      fullDataset,
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(category && category !== "All" && { category }),
    });

    const response = await fetch(`${API_BASE_URL}/similarity?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch similarity reports");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching similarity reports:", error);
    throw error;
  }
}

/**
 * Fetch OJT/HTE Completion Reports
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default 1)
 * @param {number} options.limit - Items per page (default 10)
 * @param {boolean} options.fullDataset - Return all data for export (default false)
 * @param {string} options.dateFrom - Filter by date from
 * @param {string} options.dateTo - Filter by date to
 * @param {string} options.coordinator - Filter by assigned coordinator
 * @param {string} options.completionStatus - Filter by completion status
 * @returns {Promise<Object>} OJT report data
 */
export async function fetchOJTReport({
  page = 1,
  limit = 10,
  fullDataset = false,
  dateFrom = "",
  dateTo = "",
  coordinator = "All",
  completionStatus = "All",
} = {}) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const params = new URLSearchParams({
      page,
      limit,
      fullDataset,
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(coordinator && coordinator !== "All" && { coordinator }),
      ...(completionStatus && completionStatus !== "All" && { completionStatus }),
    });

    const response = await fetch(`${API_BASE_URL}/ojt?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch OJT reports");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching OJT reports:", error);
    throw error;
  }
}

/**
 * Fetch Unique OJT Coordinators
 * @returns {Promise<string[]>} List of coordinator names
 */
export async function fetchCoordinators() {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/coordinators`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch coordinators");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching coordinators:", error);
    throw error;
  }
}
