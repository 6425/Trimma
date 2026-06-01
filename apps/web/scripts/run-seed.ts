import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

import { runSeedMarketplaceData } from "../src/lib/seed-marketplace-core";

async function main() {
  console.log("Running seed script...");
  try {
    await runSeedMarketplaceData(supabase);
    console.log("Seed successful!");
  } catch (err) {
    console.error("Seed failed:", err);
  }
}
main();
