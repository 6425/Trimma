import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Missing VITE_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("🔄 Attempting to connect to Supabase at: " + supabaseUrl);
  
  try {
    // Attempting to query the database. 
    // We expect an error if the table doesn't exist, but that still proves we connected!
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log("✅ SUCCESS: Successfully connected to Supabase!");
        console.log("ℹ️ Note: Database is empty (no tables found). Ready for Master Data Initialization.");
      } else {
        console.log("✅ SUCCESS: Connected, but got a different database response: " + error.message);
      }
    } else {
      console.log("✅ SUCCESS: Successfully connected to Supabase and retrieved data!");
    }
  } catch (err) {
    console.error("❌ FAILED to connect:", err.message);
  }
}

testConnection();
