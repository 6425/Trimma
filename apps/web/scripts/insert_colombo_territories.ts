import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const territories = Array.from({ length: 15 }, (_, i) => {
    const num = i + 1;
    return {
      name: `Colombo ${num}`,
      type: "zone",
      slug: `colombo-${num}`
    };
  });

  const { data, error } = await supabase
    .from("territories")
    .upsert(territories, { onConflict: "slug" });

  if (error) {
    console.error("Error inserting territories:", error);
  } else {
    console.log("Successfully inserted Colombo 1 - 15 territories");
  }
}

run();
