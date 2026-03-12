import { useState, useEffect, useCallback } from "react";
import { auditService } from "../services/auditService";

export function useAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        action: "all",
        date: ""
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await auditService.getLogs(filters);
            setLogs(data);
        } catch (err) {
            console.error("[useAuditLogs] Failed to fetch logs:", err);
            setError(err.message || "Failed to load activity logs");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const updateFilters = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const refresh = () => fetchLogs();

    return {
        logs,
        loading,
        error,
        filters,
        updateFilters,
        refresh
    };
}
