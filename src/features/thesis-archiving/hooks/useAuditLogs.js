import { useState, useEffect, useCallback } from "react";
import { auditService } from "../services/auditService";

export function useAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [availableActions, setAvailableActions] = useState([]);
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
            const [logsData, actionsData] = await Promise.all([
                auditService.getLogs(filters),
                auditService.getUniqueActions()
            ]);
            setLogs(logsData);
            setAvailableActions(actionsData);
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
        availableActions,
        loading,
        error,
        filters,
        updateFilters,
        refresh
    };
}
