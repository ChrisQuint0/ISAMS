
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSettings() {
    const { data, error } = await supabase.from("thesis_settings").select("key, label");
    if (error) {
        console.error("Error fetching settings:", error);
        return;
    }
    console.log("Settings keys found:");
    data.forEach(s => console.log(`- ${s.key}: ${s.label}`));
}

checkSettings();
