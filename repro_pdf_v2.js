
import { createRequire } from "module";
const require = createRequire(import.meta.url);

try {
    const { PDFParse } = require("pdf-parse");
    console.log("PDFParse keys:", Object.keys(PDFParse));
    
    const buffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (Hello World) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000114 00000 n\n0000000188 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n281\n%%EOF");

    try {
        const instance = new PDFParse(buffer);
        console.log("Instance keys:", Object.keys(instance));
        console.log("Instance prototype keys:", Object.keys(Object.getPrototypeOf(instance)));
        
        // Let's see if it's a promise
        if (typeof instance.then === 'function') {
            console.log("Instance is a promise!");
            const result = await instance;
            console.log("Awaited result keys:", Object.keys(result));
            console.log("Awaited result text:", result.text);
        } else {
            console.log("Instance is NOT a promise");
            console.log("Instance text:", instance.text);
        }
    } catch (err) {
        console.log("ERROR during instantiation/await:", err);
    }
} catch (err) {
    console.error("Error requiring pdf-parse:", err);
}
