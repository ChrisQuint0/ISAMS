
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTables() {
    const tables = ["hte_notification_batches", "hte_notification_recipients", "hte_notification_cooldowns"];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*").limit(1);
        if (error) {
            console.log(`Table ${table} error:`, error.message);
        } else {
            console.log(`Table ${table} exists.`);
        }
    }
}

checkTables();
