const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function testUpload() {
  const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const buffer = Buffer.from(base64Data, "base64");
  const fileName = `test_salon/logo_${Date.now()}.png`;

  console.log("Attempting upload to salon-images...");
  const { data, error } = await supabase.storage
      .from("salon-images")
      .upload(fileName, buffer, { cacheControl: "3600", upsert: true, contentType: "image/png" });
  
  console.log("Upload result:", data, error);
}

testUpload();
