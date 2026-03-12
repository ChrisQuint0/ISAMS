import React, { useState, useEffect } from "react";
import { FileText, Loader2, EyeOff } from "lucide-react";
import mammoth from "mammoth";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import $ from "jquery";
import JSZip from "jszip";
import * as d3 from "d3";
import dimple from "dimple/dist/dimple.latest.js";

import renderPptx from "@/lib/pptx2html/main";

/**
 * Advanced Multi-Format File Preview Component
 * Supports: PDF, Images, JSON, CSV, XLSX, DOCX, PPTX
 */
const FilePreview = ({ file, url }) => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!file) return;

        const generatePreview = async () => {
            setLoading(true);
            setError(null);
            try {
                const fileType = file.type;
                const extension = file.name.split('.').pop().toLowerCase();

                // 1. IMAGE PREVIEW
                if (fileType.includes("image")) {
                    setContent(
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <img
                                src={url}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-md border border-neutral-200 bg-white"
                            />
                        </div>
                    );
                }

                // 2. PDF PREVIEW
                else if (fileType === "application/pdf") {
                    setContent(
                        <iframe
                            src={`${url}#toolbar=0`}
                            className="w-full h-full rounded-lg shadow-md border border-neutral-200 bg-white"
                            title="PDF Preview"
                        />
                    );
                }

                // 3. JSON PREVIEW
                else if (fileType === "application/json" || extension === "json") {
                    const text = await file.text();
                    try {
                        const json = JSON.parse(text);
                        setContent(
                            <pre className="p-6 bg-neutral-900 text-neutral-100 rounded-xl overflow-auto text-xs font-mono w-full h-full shadow-lg">
                                {JSON.stringify(json, null, 2)}
                            </pre>
                        );
                    } catch (e) {
                        setContent(
                            <pre className="p-6 bg-neutral-900 text-neutral-100 rounded-xl overflow-auto text-xs font-mono w-full h-full shadow-lg">
                                {text}
                            </pre>
                        );
                    }
                }

                // 4. CSV PREVIEW
                else if (fileType === "text/csv" || extension === "csv") {
                    const text = await file.text();
                    Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            renderTable(results.data);
                        }
                    });
                }

                // 5. EXCEL PREVIEW (XLSX/XLS)
                else if (extension === "xlsx" || extension === "xls") {
                    const buffer = await file.arrayBuffer();
                    const wb = XLSX.read(buffer, { type: "array" });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    renderTable(data, false); // Header is not an object yet
                }

                // 6. WORD PREVIEW (DOCX)
                else if (extension === "docx") {
                    const buffer = await file.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
                    setContent(
                        <div className="w-full h-full overflow-auto bg-neutral-50 p-4 sm:p-8">
                            <div
                                className="bg-white p-10 shadow-xl rounded-lg border border-neutral-200 mx-auto max-w-[800px] prose prose-sm prose-slate"
                                style={{ minHeight: '100%' }}
                                dangerouslySetInnerHTML={{ __html: result.value }}
                            />
                        </div>
                    );
                }

                // 7. POWERPOINT PREVIEW (PPTX)
                else if (extension === "pptx") {
                    const buffer = await file.arrayBuffer();
                    setContent(
                        <div id="pptx-container" className="w-full h-full bg-white flex flex-col items-center overflow-auto p-4 sm:p-8">
                            <div id="pptx-preview-target" className="w-full min-h-full"></div>
                        </div>
                    );

                    // Small delay to ensure the container is in the DOM
                    setTimeout(async () => {
                        const target = document.getElementById("pptx-preview-target");
                        if (target) {
                            try {
                                // pptx2html expects these to be global
                                window.$ = $;
                                window.jQuery = $;
                                window.JSZip = JSZip;
                                window.d3 = d3;
                                window.dimple = dimple;

                                await renderPptx(buffer, target);
                            } catch (err) {
                                console.error("PPTX Render Error Details:", err);
                                // The user asked "Why is it empty?", let's give a bit more info if caught
                                const errorDetail = err?.message || "Check the browser console for details.";
                                setError(`PowerPoint Preview Error: ${errorDetail}`);
                            }
                        }
                    }, 200);
                }

                // FALLBACK
                else {
                    setError(`No preview available for this file type: ${extension.toUpperCase()}`);
                }
            } catch (err) {
                console.error("Preview generation failed:", err);
                setError("An error occurred while generating the document preview.");
            } finally {
                setLoading(false);
            }
        };

        /**
         * Renders array of data as a professional HTML Table
         */
        const renderTable = (data, isHeaderObject = true) => {
            if (!data || data.length === 0) {
                setContent(<div className="text-neutral-500 italic p-8">The document appears to be empty.</div>);
                return;
            }

            setLoading(false);
            const headers = isHeaderObject ? Object.keys(data[0]) : (Array.isArray(data[0]) ? data[0] : []);
            const rows = isHeaderObject ? data : data.slice(1);

            setContent(
                <div className="w-full h-full overflow-auto bg-white border border-neutral-200 rounded-xl shadow-lg">
                    <table className="min-w-full divide-y divide-neutral-200 border-collapse">
                        <thead className="bg-neutral-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                {headers.map((h, i) => (
                                    <th
                                        key={i}
                                        className="px-4 py-3 text-left text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-200 bg-neutral-50"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-100">
                            {rows.map((row, i) => (
                                <tr key={i} className="hover:bg-primary-50/30 transition-colors">
                                    {headers.map((h, j) => (
                                        <td key={j} className="px-4 py-3 text-xs text-neutral-700 whitespace-nowrap font-medium">
                                            {String(isHeaderObject ? row[h] : (Array.isArray(row) ? row[j] : "")) || ""}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rows.length === 0 && <div className="p-8 text-center text-neutral-400 text-sm italic">No data rows found.</div>}
                </div>
            );
        };

        generatePreview();
    }, [file, url]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-12 bg-white/50 backdrop-blur-sm rounded-2xl w-full">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary-500 opacity-20" />
                    <Loader2 className="h-12 w-12 animate-spin text-primary-600 absolute top-0 left-0" style={{ animationDuration: '1.5s' }} />
                </div>
                <p className="font-bold text-neutral-900 text-lg mt-6">Generating Preview</p>
                <p className="text-xs font-semibold text-neutral-400 mt-1 uppercase tracking-widest">Processing {file?.name}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 text-center max-w-sm mx-auto p-12 bg-white rounded-2xl shadow-sm border border-neutral-100">
                <EyeOff className="h-16 w-16 text-neutral-100 mb-6 shrink-0" />
                <p className="font-bold text-neutral-900 text-xl mb-3">Preview Not Available</p>
                <p className="text-sm font-medium leading-relaxed text-neutral-500">
                    {error}.<br />
                    <span className="text-xs text-neutral-400 mt-4 block italic font-semibold border-t border-neutral-100 pt-4">You can still proceed with your submission.</span>
                </p>
            </div>
        );
    }

    return <div className="w-full h-full animate-in fade-in zoom-in-95 duration-300">{content}</div>;
};

export default FilePreview;