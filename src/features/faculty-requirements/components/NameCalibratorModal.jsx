import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutTemplate, Loader2, Save, Move, Eye } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default function NameCalibratorModal({ isOpen, onClose, template, onSave }) {
    const [x, setX] = useState(100);
    const [y, setY] = useState(100);
    const [fontSize, setFontSize] = useState(24);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const debounceTimer = useRef(null);

    // Initialize state when template opens
    useEffect(() => {
        if (template && isOpen) {
            setX(template.x_coord ?? 100);
            setY(template.y_coord ?? 300); // Standard Y is usually from bottom in PDF, so 300 is a good default
            setPreviewUrl(template.file_url); // Initial un-stamped PDF
        }
    }, [template, isOpen]);

    const generatePreview = async (currentX, currentY) => {
        if (!template?.file_url) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch the PDF from Supabase URL
            const existingPdfBytes = await fetch(template.file_url).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // Get a standard font
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const sampleName = "JUAN DELA CRUZ";
            const textWidth = helveticaFont.widthOfTextAtSize(sampleName, fontSize);

            // Draw the sample name
            firstPage.drawText(sampleName, {
                x: Number(currentX),
                y: Number(currentY),
                size: fontSize,
                font: helveticaFont,
                color: rgb(0, 0.53, 0.71), // ISAMS Blue-ish
            });

            // Draw a red bounding box for visual calibration
            firstPage.drawRectangle({
                x: Number(currentX) - 2,
                y: Number(currentY) - 5,
                width: textWidth + 4,
                height: fontSize + 10,
                borderColor: rgb(1, 0, 0),
                borderWidth: 1,
            });

            // Serialize the PDFDocument to bytes (a Uint8Array)
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });

            // Create a blob URL and update the iframe
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (err) {
            console.error(err);
            setError("Failed to generate PDF preview.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate preview upon coordinate changes, debounced
    useEffect(() => {
        if (!isOpen || !template) return;

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            generatePreview(x, y);
        }, 600);

        return () => clearTimeout(debounceTimer.current);
    }, [x, y, fontSize, template, isOpen]);

    const handleSave = async () => {
        setLoading(true);
        const success = await onSave(template.id, Number(x), Number(y));
        setLoading(false);
        if (success) {
            onClose();
        } else {
            setError("Failed to save coordinates.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 !max-w-[95vw] !w-[95vw] !h-[90vh] flex flex-col">
                <DialogHeader className="shrink-0 mb-2">
                    <DialogTitle className="text-slate-100 flex items-center gap-2">
                        <Move className="h-5 w-5 text-blue-400" />
                        Clearance Name Calibrator
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Adjust X and Y coordinates (in points) to align the faculty name precisely on the selected template layout. The Y axis originates from the bottom-left corner.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md text-sm shrink-0 mb-4">
                        {error}
                    </div>
                )}

                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Left Params */}
                    <div className="w-1/3 space-y-6 flex flex-col justify-center">
                        <div className="bg-slate-950/50 p-6 border border-slate-800 rounded-xl space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <LayoutTemplate className="h-4 w-4" /> Position Coordinates
                                </h3>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-400 uppercase">X Coordinate (Left)</Label>
                                    <Input
                                        type="number"
                                        value={x}
                                        onChange={e => setX(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-emerald-400 font-mono text-lg"
                                    />
                                    <p className="text-[10px] text-slate-500">Distance from the left edge</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-400 uppercase">Y Coordinate (Bottom)</Label>
                                    <Input
                                        type="number"
                                        value={y}
                                        onChange={e => setY(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-emerald-400 font-mono text-lg"
                                    />
                                    <p className="text-[10px] text-slate-500">Distance from the BOTTOM edge (0 is bottom)</p>
                                </div>
                            </div>

                            <hr className="border-slate-800" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <Eye className="h-4 w-4" /> Visual Preview
                                </h3>
                                <p className="text-xs text-slate-400">
                                    The sample name JUAN DELA CRUZ is automatically stamped on the preview PDF.
                                    Adjust X and Y to move the red bounding box.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right PDF Preview */}
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative">
                        {loading && (
                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                            </div>
                        )}
                        {previewUrl ? (
                            <iframe
                                src={`${previewUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-full border-0"
                                title="Template Preview"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                Loading preview...
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="shrink-0 mt-4 pt-4 border-t border-slate-800">
                    <Button variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Coordinates
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
