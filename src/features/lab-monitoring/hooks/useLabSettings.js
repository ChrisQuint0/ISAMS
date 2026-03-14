import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Papa from "papaparse";
import { readFile } from "@tauri-apps/plugin-fs";
import { useLabImport } from "./useLabImports";
import { supabase } from "@/lib/supabaseClient";
import { logAuditEvent } from "../utils/auditLogger";

export function useLabSetting() {
    const { labName } = useOutletContext();
    const { uploadCsvData, isImporting, importError } = useLabImport();

    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        anti_cutting: false,
        hard_capacity: false,
        auto_assignment: false,
        maintenance_threshold: 1,
    });
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
    const [selectedImportType, setSelectedImportType] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState("");
    const [selectedFileSize, setSelectedFileSize] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);

    // UI States for Success and Error handling
    const [importFileError, setImportFileError] = useState("");
    const [importSuccessMessage, setImportSuccessMessage] = useState("");
    const [notificationTitle, setNotificationTitle] = useState("Import Successful");

    const [previewHeaders, setPreviewHeaders] = useState([]);
    const [previewRows, setPreviewRows] = useState([]);
    const [parsedData, setParsedData] = useState([]);

    const fileInputRef = useRef(null);
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

    const getFileNameFromPath = (filePath) => {
        if (!filePath) return "";
        return filePath.split(/[/\\]/).pop() || filePath;
    };

    const validateFileName = (fileName) => fileName.toLowerCase().endsWith(".csv");

    const openImportDialog = (importType) => {
        setSelectedImportType(importType);
        setSelectedFileName("");
        setSelectedFileSize(null);
        setImportFileError("");
        setImportSuccessMessage("");
        setIsDragActive(false);
        setPreviewHeaders([]);
        setPreviewRows([]);
        setParsedData([]);
        setIsPreviewDialogOpen(false);
        setIsImportDialogOpen(true);
    };

    const handleImportDialogOpenChange = (open) => {
        setIsImportDialogOpen(open);
        if (!open) {
            setSelectedImportType(null);
            setSelectedFileName("");
            setSelectedFileSize(null);
            setIsDragActive(false);
            setImportFileError("");
            setPreviewHeaders([]);
            setPreviewRows([]);
            setParsedData([]);
            setIsPreviewDialogOpen(false);
        }
    };

    const parseCsvPreview = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta?.fields || [];
                const allRows = Array.isArray(results.data) ? results.data : [];
                const preview = allRows.slice(0, 10);

                if (headers.length === 0 || allRows.length === 0) {
                    setPreviewHeaders([]);
                    setPreviewRows([]);
                    setParsedData([]);
                    setImportFileError("Unable to preview CSV. Ensure the file has a header row.");
                    return;
                }

                setPreviewHeaders(headers);
                setPreviewRows(preview);
                setParsedData(allRows);
            },
            error: () => {
                setImportFileError("Unable to parse CSV file.");
            }
        });
    };

    const handleFileSelection = (file) => {
        if (!file) return;

        // Fix: Clear errors immediately when a new selection attempt begins
        setImportFileError("");
        setImportSuccessMessage("");

        if (!validateFileName(file.name)) {
            setImportFileError("Only .csv files are accepted.");
            return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            setImportFileError("Maximum allowed size is 5MB.");
            return;
        }

        setSelectedFileName(file.name);
        setSelectedFileSize(file.size);
        parseCsvPreview(file);
    };

    const handleFilePathSelection = async (filePath) => {
        if (!filePath) return;

        // Fix: Clear errors immediately when a new file path is dropped (Tauri)
        setImportFileError("");
        setImportSuccessMessage("");

        const fileName = getFileNameFromPath(filePath);
        if (!validateFileName(fileName)) {
            setImportFileError("Only .csv files are accepted.");
            return;
        }
        try {
            const fileBytes = await readFile(filePath);
            const decoder = new TextDecoder("utf-8");
            const csvText = decoder.decode(fileBytes);
            setSelectedFileName(fileName);
            setSelectedFileSize(fileBytes.length);

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const allRows = Array.isArray(results.data) ? results.data : [];
                    setPreviewHeaders(results.meta?.fields || []);
                    setPreviewRows(allRows.slice(0, 10));
                    setParsedData(allRows);
                }
            });
        } catch (error) {
            setImportFileError("Failed to read file.");
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return "0 B";
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + " " + ["B", "KB", "MB"][i];
    };

    const handleBrowseFile = () => fileInputRef.current?.click();
    const handleFileInputChange = (e) => handleFileSelection(e.target.files?.[0]);

    const clearSelectedFile = () => {
        setSelectedFileName("");
        setSelectedFileSize(null);
        setPreviewHeaders([]);
        setPreviewRows([]);
        setParsedData([]);
        setImportFileError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragActive(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragActive(false); };
    const handleDrop = (e) => { e.preventDefault(); setIsDragActive(false); handleFileSelection(e.dataTransfer.files?.[0]); };

    useEffect(() => {
        if (!isImportDialogOpen) return;
        let unlisten = null;
        const bindTauriDragDrop = async () => {
            const isTauriRuntime = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
            if (!isTauriRuntime) return;
            const { getCurrentWebview } = await import("@tauri-apps/api/webview");
            unlisten = await getCurrentWebview().onDragDropEvent((event) => {
                if (event.payload.type === "drop") {
                    setIsDragActive(false);
                    handleFilePathSelection(event.payload.paths?.[0]);
                } else if (event.payload.type === "enter") {
                    setIsDragActive(true);
                } else if (event.payload.type === "leave") {
                    setIsDragActive(false);
                }
            });
        };
        void bindTauriDragDrop();
        return () => { if (unlisten) void unlisten(); };
    }, [isImportDialogOpen]);

    const handleUpload = async () => {
        setImportFileError("");
        setImportSuccessMessage("");
        setNotificationTitle("Import Successful");

        const success = await uploadCsvData(parsedData, selectedImportType);
        if (success) {
            handleImportDialogOpenChange(false);
            setImportSuccessMessage(`Successfully imported ${parsedData.length} records.`);
        }
    };

    useEffect(() => {
        if (importError) setImportFileError(importError);
    }, [importError]);

    const importDialogTitle = selectedImportType === "classlist" ? "Import Classlist" : "Import Lab Schedule";
    const templateFileName = selectedImportType === "classlist" ? "students_template.csv" : "schedules_template.csv";

    const templateCsvContent = selectedImportType === "classlist"
        ? "student_no,full_name,course,year_level,section_block,sex\n2026-0001,Juan Dela Cruz,BSIT,3,BSIT-3A,Male\n"
        : "course_code,subject_name,section_block,day,time_start,time_end,room,professor\nIT311,Systems Admin,BSIT-3A,Monday,08:00:00,10:00:00,CL4,Prof. Kurt\n";

    const handleDownloadTemplate = () => {
        const templateBlob = new Blob([templateCsvContent], { type: "text/csv;charset=utf-8;" });
        const templateUrl = URL.createObjectURL(templateBlob);
        const downloadLink = document.createElement("a");
        downloadLink.href = templateUrl;
        downloadLink.setAttribute("download", templateFileName);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(templateUrl);
    };

    useEffect(() => {
        if (!labName) return;

        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from("lab_settings_lm")
                .select("*")
                .eq("lab_name", labName)
                .single();

            if (error) {
                if (error.code !== "PGRST116") {
                    console.error("Error fetching lab settings:", error.message);
                }
            } else if (data) {
                const fetchedSettings = {
                    anti_cutting: data.anti_cutting ?? false,
                    hard_capacity: data.hard_capacity ?? false,
                    auto_assignment: data.auto_assignment ?? false,
                    maintenance_threshold: data.maintenance_threshold ?? 1,
                };
                setSettings(fetchedSettings);
                // Keep a copy of original settings to track changes
                setOriginalSettings(fetchedSettings);
            }
        };

        fetchSettings();
    }, [labName]);

    const toggleSetting = (key) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleThresholdChange = (val) => {
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= 1) {
            setSettings((prev) => ({
                ...prev,
                maintenance_threshold: num,
            }));
        }
    };

    const [originalSettings, setOriginalSettings] = useState(settings);

    const handleSaveChanges = async (adminName) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("lab_settings_lm")
                .upsert({
                    lab_name: labName,
                    anti_cutting: settings.anti_cutting,
                    hard_capacity: settings.hard_capacity,
                    auto_assignment: settings.auto_assignment,
                    maintenance_threshold: settings.maintenance_threshold,
                }, { onConflict: "lab_name" });

            if (error) throw error;

            // Build differences string
            const changes = [];
            if (originalSettings.anti_cutting !== settings.anti_cutting) changes.push(`Anti-Cutting: ${settings.anti_cutting ? 'ON' : 'OFF'}`);
            if (originalSettings.hard_capacity !== settings.hard_capacity) changes.push(`Hard Capacity: ${settings.hard_capacity ? 'ON' : 'OFF'}`);
            if (originalSettings.auto_assignment !== settings.auto_assignment) changes.push(`Auto Assignment: ${settings.auto_assignment ? 'ON' : 'OFF'}`);
            if (originalSettings.maintenance_threshold !== settings.maintenance_threshold) changes.push(`Maintenance Threshold: ${settings.maintenance_threshold}hrs`);

            if (changes.length > 0) {
                await logAuditEvent({
                    labName: labName,
                    actor: adminName || "System",
                    category: "Settings",
                    action: "Update Settings",
                    description: `Modified protocols: ${changes.join(', ')}`,
                    severity: "Warning"
                });
                setOriginalSettings(settings); // Sync originals
            }
        } catch (error) {
            console.error("Error saving settings:", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return {
        labName, isSaving, setIsSaving, isImportDialogOpen, handleImportDialogOpenChange,
        isPreviewDialogOpen, setIsPreviewDialogOpen, selectedFileName,
        selectedFileSize, isDragActive, importFileError, setImportFileError,
        importSuccessMessage, setImportSuccessMessage, notificationTitle, setNotificationTitle,
        previewHeaders, previewRows, fileInputRef, openImportDialog, formatBytes,
        handleBrowseFile, handleFileInputChange, clearSelectedFile, handleDragOver,
        handleDragLeave, handleDrop, importDialogTitle, handleDownloadTemplate,
        handleUpload, isImporting, parsedData, settings, toggleSetting,
        handleThresholdChange, handleSaveChanges
    };
}