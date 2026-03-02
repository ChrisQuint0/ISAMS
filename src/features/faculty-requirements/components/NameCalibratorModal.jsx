import { RefreshCw } from 'lucide-react';
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

            // Draw the sample name using PLP Green (rgb mapping of #006b35)
            firstPage.drawText(sampleName, {
                x: Number(currentX),
                y: Number(currentY),
                size: fontSize,
                font: helveticaFont,
                color: rgb(0, 107 / 255, 53 / 255),
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
            <DialogContent className="bg-neutral-50 border-neutral-200 text-neutral-900 !max-w-[95vw] !w-[95vw] !h-[90vh] flex flex-col shadow-2xl">
                <DialogHeader className="shrink-0 mb-2">
                    <DialogTitle className="text-neutral-900 flex items-center gap-2 font-bold">
                        <Move className="h-5 w-5 text-primary-600" />
                        Clearance Name Calibrator
                    </DialogTitle>
                    <DialogDescription className="text-neutral-500 font-medium">
                        Adjust X and Y coordinates (in points) to align the faculty name precisely on the selected template layout. The Y axis originates from the bottom-left corner.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm shrink-0 mb-4 font-medium">
                        {error}
                    </div>
                )}

                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Left Params */}
                    <div className="w-1/3 space-y-6 flex flex-col justify-center">
                        <div className="bg-white p-6 border border-neutral-200 rounded-xl shadow-sm space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                                    <LayoutTemplate className="h-4 w-4 text-primary-600" /> Position Coordinates
                                </h3>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">X Coordinate (Left)</Label>
                                    <Input
                                        type="number"
                                        value={x}
                                        onChange={e => setX(e.target.value)}
                                        className="bg-neutral-50 border-neutral-200 text-primary-600 focus-visible:ring-primary-500 font-mono text-lg font-bold shadow-sm"
                                    />
                                    <p className="text-[10px] text-neutral-500 font-medium">Distance from the left edge</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Y Coordinate (Bottom)</Label>
                                    <Input
                                        type="number"
                                        value={y}
                                        onChange={e => setY(e.target.value)}
                                        className="bg-neutral-50 border-neutral-200 text-primary-600 focus-visible:ring-primary-500 font-mono text-lg font-bold shadow-sm"
                                    />
                                    <p className="text-[10px] text-neutral-500 font-medium">Distance from the BOTTOM edge (0 is bottom)</p>
                                </div>
                            </div>

                            <hr className="border-neutral-100" />

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-info" /> Visual Preview
                                </h3>
                                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                                    The sample name <strong className="text-neutral-700">JUAN DELA CRUZ</strong> is automatically stamped on the preview PDF.
                                    Adjust X and Y to move the red bounding box.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right PDF Preview */}
                    <div className="flex-1 bg-neutral-200/50 border border-neutral-200 rounded-xl overflow-hidden relative shadow-inner">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                                <RefreshCw className="h-10 w-10 text-primary-600 animate-spin" />
                            </div>
                        )}
                        {previewUrl ? (
                            <iframe
                                src={`${previewUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-full border-0"
                                title="Template Preview"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 font-medium">
                                Loading preview...
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="shrink-0 mt-4 pt-4 border-t border-neutral-200 gap-2 sm:gap-3">
                    <Button variant="outline" onClick={onClose} className="border-neutral-200 text-neutral-700 hover:bg-neutral-100 shadow-sm">Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all active:scale-95"
                    >
                        {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Coordinates
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}