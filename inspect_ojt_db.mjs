
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspect() {
  console.log("--- hte_ojt_students ---");
  const { data: students, error: sError } = await supabaseAdmin.from("hte_ojt_students").select("*").limit(1);
  if (sError) console.error("Error students:", sError);
  else console.log("Columns:", Object.keys(students[0] || {}));

  console.log("\n--- vw_report_ojt_trainee_status ---");
  const { data: view, error: vError } = await supabaseAdmin.from("vw_report_ojt_trainee_status").select("*").limit(1);
  if (vError) console.error("Error view:", vError);
  else console.log("Columns:", Object.keys(view[0] || {}));
}

inspect();
