/**
 * OCR Image Validation Handler
 * Validates uploaded images for text content using Tesseract.js
 */
import getRawBody from "raw-body";
import Tesseract from "tesseract.js";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await getRawBody(req, { length: req.headers["content-length"], limit: "50mb" });
    const contentType = req.headers["content-type"] || "";
    
    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Content-Type must be multipart/form-data" });
    }

    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return res.status(400).json({ error: "No boundary found" });
    }

    // Parse multipart data
    const parts = rawBody.toString("binary").split(`--${boundary}`);
    const files = [];

    for (const part of parts) {
      const fileNameMatch = part.match(/filename="([^"]+)"/);
      if (fileNameMatch) {
        const fileName = fileNameMatch[1];
        const contentStart = part.indexOf('\r\n\r\n') + 4;
        const contentEnd = part.lastIndexOf('\r\n');
        
        if (contentStart > 3 && contentEnd > contentStart) {
          const binaryContent = part.substring(contentStart, contentEnd);
          const fileBuffer = Buffer.from(binaryContent, 'binary');
          files.push({ fileName, buffer: fileBuffer });
        }
      }
    }

    if (files.length === 0) {
      return res.status(400).json({ error: "No files found in upload" });
    }

    const results = [];

    for (const file of files) {
      try {
        // Perform OCR on the image
        const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng', {
          logger: () => {}, // Suppress logs
        });

        const isValid = text && text.trim().length > 10; // At least 10 characters of text

        results.push({
          fileName: file.fileName,
          valid: isValid,
          textLength: text.trim().length,
          reason: isValid ? null : "Insufficient text detected. Image may be blank or unreadable.",
        });
      } catch (ocrError) {
        console.error(`OCR failed for ${file.fileName}:`, ocrError);
        results.push({
          fileName: file.fileName,
          valid: false,
          reason: "OCR processing failed",
        });
      }
    }

    const allValid = results.every(r => r.valid);

    res.json({
      valid: allValid,
      results,
      message: allValid
        ? "All images contain readable text"
        : "Some images failed validation",
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({ error: error.message });
  }
}
