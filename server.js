import express from "express";
import cors from "cors";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables from .env.local
dotenv.config({ path: "./.env.local" });

const app = express();
const port = 3000;

// Config
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client
const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;

// Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// --- Routes ---

// 0. Add User (Admin)
app.post("/api/users", async (req, res) => {
  const { module, firstName, lastName, email, password, role } = req.body;

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
  }

  try {
    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Prepare user_rbac data
    const rbacData = {
      user_id: userId,
      thesis: module === "thesis",
      thesis_role: module === "thesis" ? role : null,
      facsub: module === "facsub",
      facsub_role: module === "facsub" ? role : null,
      labman: module === "labman",
      labman_role: module === "labman" ? role : null,
      studvio: module === "studvio",
      studvio_role: module === "studvio" ? role : null,
      status: "active",
      superadmin: false,
    };

    // Because there may be a Supabase Database Trigger automatically creating a default row 
    // in `user_rbac` on `auth.users` insertion, we first try to Update the existing row.
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("user_rbac")
      .update({
        thesis: rbacData.thesis,
        thesis_role: rbacData.thesis_role,
        facsub: rbacData.facsub,
        facsub_role: rbacData.facsub_role,
        labman: rbacData.labman,
        labman_role: rbacData.labman_role,
        studvio: rbacData.studvio,
        studvio_role: rbacData.studvio_role,
      })
      .eq("user_id", userId)
      .select();

    if (updateError) throw updateError;

    // If update affected 0 rows (meaning no trigger exists), we perform a regular insert
    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await supabaseAdmin.from("user_rbac").insert(rbacData);
      if (insertError) throw insertError;
    } else if (updatedRows.length > 1) {
      // If there are multiple roles (like the bug you experienced), clean up duplicates
      // Keep the first one and delete the rest
      const [firstRow, ...duplicates] = updatedRows;
      const duplicateIds = duplicates.map(row => row.id);
      if (duplicateIds.length > 0) {
        await supabaseAdmin.from("user_rbac").delete().in("id", duplicateIds);
      }
    }

    res.json({ message: "User created successfully", user: authData.user });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// 0.1. Update User (Admin)
app.patch("/api/users/:id", async (req, res) => {
  const { id: userId } = req.params;
  const updates = req.body;

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
  }

  try {
    // 1. Update auth.users metadata if needed
    const authUpdatePayload = {};
    if (updates.first_name || updates.last_name) {
      authUpdatePayload.user_metadata = {};
      if (updates.first_name) authUpdatePayload.user_metadata.first_name = updates.first_name;
      if (updates.last_name) authUpdatePayload.user_metadata.last_name = updates.last_name;
    }
    if (updates.email) {
      authUpdatePayload.email = updates.email;
    }

    if (Object.keys(authUpdatePayload).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdatePayload
      );
      if (authError) throw authError;
    }

    // 2. Update the user_rbac table if needed
    const rbacUpdatePayload = {};
    const rbacFields = [
      'status', 'thesis', 'thesis_role', 'facsub', 'facsub_role',
      'labman', 'labman_role', 'studvio', 'studvio_role'
    ];
    rbacFields.forEach(field => {
      if (updates[field] !== undefined) {
        rbacUpdatePayload[field] = updates[field];
      }
    });

    if (Object.keys(rbacUpdatePayload).length > 0) {
      const { error: rbacError } = await supabaseAdmin
        .from("user_rbac")
        .update(rbacUpdatePayload)
        .eq("user_id", userId);
      if (rbacError) throw rbacError;
    }

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// 0.2. Reset User Password (Admin)
app.post("/api/users/:id/reset-password", async (req, res) => {
  const { id: userId } = req.params;
  const { password } = req.body;

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
  }

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: password }
    );

    if (error) throw error;

    res.json({ message: "Password updated successfully", user: data.user });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: error.message });
  }
});





// ─────────────────────────────────────────────────────────────
// REPORTS API ENDPOINTS
// ─────────────────────────────────────────────────────────────

// Middleware to verify user has reports access
async function verifyReportsAccess(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch user role from user_rbac
    const { data: userData, error: roleError } = await supabase
      .from("user_rbac")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (roleError || !userData) {
      return res.status(403).json({ error: "User role not found" });
    }

    // Check if user has any of the coordinator/admin roles
    const isAdmin = userData.thesis === true && userData.thesis_role === "admin";
    const isOJTCoordinator = userData.ojt === true && userData.ojt_role === "coordinator";
    const isResearchCoordinator = userData.similarity === true && userData.similarity_role === "coordinator";

    if (!isAdmin && !isOJTCoordinator && !isResearchCoordinator) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions for reports." });
    }

    // Attach user info to request
    req.user = user;
    req.userRole = userData;
    next();
  } catch (error) {
    console.error("Error in verifyReportsAccess:", error);
    res.status(500).json({ error: "Server error during authorization" });
  }
}

// 8. GET Thesis Archive Reports
app.get("/api/reports/thesis", verifyReportsAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, fullDataset = false, dateFrom, dateTo, department, category } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build query based on available columns in digital_repository table
    let query = supabase
      .from("digital_repository")
      .select("*", { count: "exact" });

    // Apply filters
    if (dateFrom) {
      query = query.gte("date_added", dateFrom);
    }
    if (dateTo) {
      query = query.lte("date_added", dateTo);
    }
    if (department && department !== "All") {
      query = query.eq("department", department);
    }
    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    // If fullDataset is true, return all records without pagination for export
    if (fullDataset === "true") {
      const { data: allData, error } = await query;
      if (error) throw error;

      // Get summary by year and category
      const submissionSummary = {};
      allData.forEach(record => {
        const year = new Date(record.date_added).getFullYear();
        const cat = record.category || "Other";
        const key = `${year}_${cat}`;
        if (!submissionSummary[key]) {
          submissionSummary[key] = { year, category: cat, count: 0 };
        }
        submissionSummary[key].count++;
      });

      return res.json({
        archiveInventory: allData,
        submissionSummary: Object.values(submissionSummary),
      });
    }

    // Otherwise, apply pagination
    const { data: paginatedData, error: dataError, count } = await query
      .range(offset, offset + limitNum - 1);

    if (dataError) throw dataError;

    // Get summary for display
    const { data: allForSummary, error: summaryError } = await supabase
      .from("digital_repository")
      .select("date_added, category");

    if (summaryError) throw summaryError;

    const submissionSummary = {};
    allForSummary.forEach(record => {
      const year = new Date(record.date_added).getFullYear();
      const cat = record.category || "Other";
      const key = `${year}_${cat}`;
      if (!submissionSummary[key]) {
        submissionSummary[key] = { year, category: cat, count: 0 };
      }
      submissionSummary[key].count++;
    });

    res.json({
      archiveInventory: paginatedData,
      submissionSummary: Object.values(submissionSummary),
      totalCount: count,
      page: pageNum,
      limit: limitNum,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching thesis reports:", error);
    res.status(500).json({ error: error.message || "Server error fetching thesis reports" });
  }
});

// 9. GET Similarity Reports
app.get("/api/reports/similarity", verifyReportsAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, fullDataset = false, dateFrom, dateTo, department, category } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build query for plagiarism_reports or similarity_checks table
    let query = supabase
      .from("plagiarism_reports")
      .select("*", { count: "exact" })
      .eq("status", "flagged");

    // Apply filters
    if (dateFrom) {
      query = query.gte("submission_date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("submission_date", dateTo);
    }
    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    // If fullDataset is true, return all records for export
    if (fullDataset === "true") {
      const { data: allData, error } = await query;
      if (error) throw error;

      // Get distribution by category
      const similarityDistribution = {};
      allData.forEach(record => {
        const cat = record.category || "Other";
        if (!similarityDistribution[cat]) {
          similarityDistribution[cat] = { category: cat, scores: [], avgSimilarity: 0 };
        }
        similarityDistribution[cat].scores.push(record.similarity_score || 0);
      });

      // Calculate averages
      Object.values(similarityDistribution).forEach(item => {
        if (item.scores.length > 0) {
          item.avgSimilarity = (item.scores.reduce((a, b) => a + b, 0) / item.scores.length).toFixed(1);
        }
        delete item.scores;
      });

      return res.json({
        flaggedSubmissions: allData,
        similarityDistribution: Object.values(similarityDistribution),
      });
    }

    // Apply pagination
    const { data: paginatedData, error: dataError, count } = await query
      .range(offset, offset + limitNum - 1);

    if (dataError) throw dataError;

    // Get distribution summary
    const { data: allForDistribution, error: distError } = await supabase
      .from("plagiarism_reports")
      .select("category, similarity_score")
      .eq("status", "flagged");

    if (distError) throw distError;

    const similarityDistribution = {};
    allForDistribution.forEach(record => {
      const cat = record.category || "Other";
      if (!similarityDistribution[cat]) {
        similarityDistribution[cat] = { category: cat, scores: [], avgSimilarity: 0 };
      }
      similarityDistribution[cat].scores.push(record.similarity_score || 0);
    });

    // Calculate averages
    Object.values(similarityDistribution).forEach(item => {
      if (item.scores.length > 0) {
        item.avgSimilarity = (item.scores.reduce((a, b) => a + b, 0) / item.scores.length).toFixed(1);
      }
      delete item.scores;
    });

    res.json({
      flaggedSubmissions: paginatedData,
      similarityDistribution: Object.values(similarityDistribution),
      totalCount: count,
      page: pageNum,
      limit: limitNum,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching similarity reports:", error);
    res.status(500).json({ error: error.message || "Server error fetching similarity reports" });
  }
});

// 10. GET OJT/HTE Reports
app.get("/api/reports/ojt", verifyReportsAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, fullDataset = false, dateFrom, dateTo, coordinator, completionStatus } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = supabase
      .from("hte_archive")
      .select("*", { count: "exact" });

    // Apply filters
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }
    if (coordinator && coordinator !== "All") {
      query = query.eq("assigned_coordinator", coordinator);
    }
    if (completionStatus && completionStatus !== "All") {
      query = query.eq("overall_status", completionStatus);
    }

    // If fullDataset is true, return all records for export
    if (fullDataset === "true") {
      const { data: allData, error } = await query;
      if (error) throw error;
      return res.json({ traineeStatus: allData });
    }

    // Apply pagination
    const { data: paginatedData, error: dataError, count } = await query
      .range(offset, offset + limitNum - 1);

    if (dataError) throw dataError;

    // Calculate stats from all data
    const { data: allData, error: statsError } = await supabase
      .from("hte_archive")
      .select("overall_status");

    if (statsError) throw statsError;

    const total = allData.length;
    const complete = allData.filter(t => t.overall_status === "Complete").length;
    const incomplete = total - complete;
    const rate = ((complete / total) * 100).toFixed(1);

    res.json({
      traineeStatus: paginatedData,
      stats: { total, complete, incomplete, rate },
      totalCount: count,
      page: pageNum,
      limit: limitNum,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching OJT reports:", error);
    res.status(500).json({ error: error.message || "Server error fetching OJT reports" });
  }
});



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
