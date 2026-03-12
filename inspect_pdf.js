
import { createRequire } from "module";
const require = createRequire(import.meta.url);

async function inspect() {
    try {
        const pdfParseModule = require("pdf-parse");
        console.log("pdfParseModule keys:", Object.keys(pdfParseModule));
        
        const { PDFParse } = pdfParseModule;
        console.log("PDFParse keys:", Object.keys(PDFParse));
        console.log("PDFParse prototype keys:", Object.keys(Object.getPrototypeOf(PDFParse)));

        // Try to see if there is a static method
        const buffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (Hello World) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000114 00000 n\n0000000188 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n281\n%%EOF");

        const uint8 = new Uint8Array(buffer);
        const instance = new PDFParse(uint8);
        console.log("Instance created.");
        
        // Let's try to call getText()
        try {
            const text = await instance.getText();
            console.log("getText() result type:", typeof text);
            console.log("getText() result sample:", String(text).slice(0, 50));
            
            // It might return an object similar to the old result
            if (typeof text === 'object' && text !== null) {
                console.log("getText() keys:", Object.keys(text));
            }
        } catch (getTextErr) {
            console.log("getText() failed:", getTextErr.message);
        }

        // Try load then getText
        try {
            await instance.load();
            const text = await instance.getText();
            console.log("load() then getText() result sample:", String(text).slice(0, 50));
        } catch (loadErr) {
            console.log("load() then getText() failed:", loadErr.message);
        }

    } catch (err) {
        console.error("Error during inspection:", err);
    }
}

inspect();
