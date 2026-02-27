// @ts-ignore: Deno global is provided by the Edge Runtime
declare const Deno: any;
// @ts-ignore: Deno HTTP imports cannot be resolved by standard TS Language Server
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
// @ts-ignore: Deno handles CommonJS default exports natively
import * as pdfParseModule from "pdf-parse";
// @ts-ignore: Handle commonjs default export mismatch in Deno
const pdfParse = pdfParseModule.default || pdfParseModule;
import * as mammoth from "mammoth";
// @ts-ignore: SheetJS npm types are missing for this version
import * as xlsx from "xlsx";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];
        const docTypeId = formData.get('doc_type_id') as string;

        if (!files || files.length === 0) {
            return new Response(JSON.stringify({ error: "Missing files." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (!docTypeId) {
            return new Response(JSON.stringify({ error: "Missing doc_type_id." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 1. Fetch Validation Rules from Database (Bypassing RLS with Service Role Key)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Server configuration error: Missing Supabase credentials.");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: docType, error: docError } = await supabase
            .from('documenttypes_fs')
            .select('required_keywords, forbidden_keywords, allowed_extensions, max_file_size_mb')
            .eq('doc_type_id', docTypeId)
            .single();

        // Workaround: The system stores min_word_count inside system_settings_fs, not the document rule table.
        const { data: mcSetting } = await supabase
            .from('systemsettings_fs')
            .select('setting_value')
            .eq('setting_key', `min_word_count_${docTypeId}`)
            .single();

        const minWordCount = mcSetting?.setting_value ? parseInt(mcSetting.setting_value, 10) : 0;

        if (docError || !docType) {
            return new Response(JSON.stringify({ error: "Invalid document type or rules not found." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 2 & 3. Validate Extensions/Size and Extract Text COMBINED
        let combinedExtractedText = "";
        let totalFileSizeMB = 0;
        let lastExtension = "";
        let processedFiles: string[] = [];

        for (const file of files) {
            const fileSizeMB = file.size / (1024 * 1024);
            totalFileSizeMB += fileSizeMB;

            const fileName = file.name.toLowerCase();
            const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
            lastExtension = fileExtension; // keep track of the last extension for analytics UI

            // INDIVIDUAL EXTENSION VALIDATION
            if (docType.allowed_extensions && docType.allowed_extensions.length > 0) {
                const cleanFileExt = fileExtension.replace(/^\./, '');
                const isAllowed = docType.allowed_extensions.some((ext: string) => ext.toLowerCase().trim().replace(/^\./, '') === cleanFileExt);
                if (!isAllowed) {
                    return new Response(JSON.stringify({
                        pass: false,
                        error: `File extension '${fileExtension}' is not permitted for this document type (File: ${fileName}).`,
                        processedFiles
                    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
            }

            processedFiles.push(fileName);

            // INDIVIDUAL PARSER ROUTER
            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            let extractedText = "";

            try {
                if (fileExtension === '.pdf') {
                    const pdfData = await pdfParse(buffer);
                    extractedText = pdfData.text;

                } else if (fileExtension === '.docx') {
                    // We cast to 'any' to satisfy the Node 'Buffer' type expectation in TypeScript
                    const result = await mammoth.extractRawText({ buffer: buffer as any });
                    extractedText = result.value;

                } else if (fileExtension === '.xlsx') {
                    const workbook = xlsx.read(buffer, { type: 'buffer' });
                    let allText = [];
                    for (const sheetName of workbook.SheetNames) {
                        const sheet = workbook.Sheets[sheetName];
                        const csv = xlsx.utils.sheet_to_csv(sheet);
                        allText.push(csv);
                    }
                    extractedText = allText.join("\n");

                } else if (fileExtension === '.txt' || fileExtension === '.csv' || fileExtension === '.json') {
                    const decoder = new TextDecoder();
                    extractedText = decoder.decode(buffer);
                } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(fileExtension)) {
                    return new Response(JSON.stringify({
                        pass: null,
                        needsServerOcr: true,
                        error: `Image detected (${fileName}). Routing to secure internal Express server for OCR processing.`,
                        processedFiles
                    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                } else {
                    extractedText = ""; // Other unsupported files
                }

            } catch (parseError: any) {
                const errorMessage = parseError instanceof Error ? parseError.message : JSON.stringify(parseError);
                console.error(`Text extraction error on ${fileName}:`, errorMessage);
                return new Response(JSON.stringify({
                    pass: false,
                    error: `Extraction failed for ${fileName}: ${errorMessage}`,
                    processedFiles
                }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            combinedExtractedText += extractedText + "\n\n";
        }

        // COLLECTIVE FILE SIZE VALIDATION
        if (docType.max_file_size_mb && totalFileSizeMB > docType.max_file_size_mb) {
            return new Response(JSON.stringify({
                pass: false,
                error: `Total batch file size (${totalFileSizeMB.toFixed(2)}MB) exceeds maximum allowed (${docType.max_file_size_mb}MB).`,
                processedFiles
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }


        const normalizedExtractedText = combinedExtractedText.toLowerCase();

        // 4. Validate Keywords COLLECTIVELY
        const missingKeywords: string[] = [];
        const foundForbidden: string[] = [];

        // Check Required
        if (docType.required_keywords && Array.isArray(docType.required_keywords)) {
            for (const keyword of docType.required_keywords) {
                const lowerKeyword = keyword.toLowerCase();
                if (!normalizedExtractedText.includes(lowerKeyword)) {
                    missingKeywords.push(keyword);
                }
            }
        }

        // Check Forbidden
        if (docType.forbidden_keywords && Array.isArray(docType.forbidden_keywords)) {
            for (const keyword of docType.forbidden_keywords) {
                const lowerKeyword = keyword.toLowerCase();
                if (normalizedExtractedText.includes(lowerKeyword)) {
                    foundForbidden.push(keyword);
                }
            }
        }

        const wordCount = combinedExtractedText.trim().split(/\s+/).length;

        // Check Word Count FIRST BEFORE keywords
        if (minWordCount > 0) {
            if (wordCount < minWordCount) {
                return new Response(JSON.stringify({
                    pass: false,
                    error: `Validation Failed: Document batch contains ${wordCount} words, which is below the minimum required word count of ${minWordCount}.`,
                    extractedLength: combinedExtractedText.length,
                    wordCount: wordCount,
                    analyzedExtension: files.length > 1 ? 'batch_multiple' : lastExtension,
                    processedFiles
                }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        // Check if it passes strictly
        const passesRules = missingKeywords.length === 0 && foundForbidden.length === 0;

        return new Response(
            JSON.stringify({
                pass: passesRules,
                extractedLength: combinedExtractedText.length,
                wordCount: combinedExtractedText.trim().length > 0 ? wordCount : 0,
                missingKeywords,
                foundForbidden,
                analyzedExtension: files.length > 1 ? 'batch_multiple' : lastExtension,
                processedFiles
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
