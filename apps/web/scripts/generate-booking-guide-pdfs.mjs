/**
 * Generate Trimma Customer Booking Guide PDFs in English, Sinhala, and Tamil.
 *
 * Usage (from repo root):
 *   node apps/web/scripts/generate-booking-guide-pdfs.mjs
 *
 * Output:
 *   apps/web/public/help/booking-guide/trimma-booking-guide-{en,si,ta}.pdf
 *
 * Optional — upload to Supabase after setting env vars:
 *   node apps/web/scripts/generate-booking-guide-pdfs.mjs --upload
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import { buildGuideHtml, GUIDE_META } from "./booking-guide-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public/help/booking-guide");
const shouldUpload = process.argv.includes("--upload");

async function generatePdf(browser, lang) {
  const meta = GUIDE_META[lang];
  const html = buildGuideHtml(lang);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });
  await page.emulateMediaType("print");

  const outPath = path.join(OUT_DIR, meta.fileName);
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    preferCSSPageSize: true,
  });
  await page.close();

  const stats = fs.statSync(outPath);
  console.log(`✓ ${meta.fileName} (${Math.round(stats.size / 1024)} KB)`);
  return { lang, meta, outPath, size: stats.size };
}

async function uploadToSupabase(results) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("Skipping upload — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const { meta, outPath, size } of results) {
    const storagePath = `booking-guide/${meta.fileName}`;
    const buffer = fs.readFileSync(outPath);

    const { error: uploadError } = await supabase.storage
      .from("help-documents")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Upload failed for ${meta.fileName}:`, uploadError.message);
      continue;
    }

    const { data: urlData } = supabase.storage.from("help-documents").getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    const { error: dbError } = await supabase
      .from("help_documents")
      .update({
        file_path: storagePath,
        file_url: publicUrl,
        file_size_bytes: size,
        version: 1,
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", meta.slug);

    if (dbError) {
      console.error(`DB update failed for ${meta.slug}:`, dbError.message);
    } else {
      console.log(`↑ Uploaded ${meta.fileName} → ${publicUrl}`);
    }
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log("Generating booking guide PDFs…");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const results = [];
    for (const lang of ["en", "si", "ta"]) {
      results.push(await generatePdf(browser, lang));
    }

    if (shouldUpload) {
      await uploadToSupabase(results);
    } else {
      console.log("\nPDFs saved to apps/web/public/help/booking-guide/");
      console.log("Run with --upload to push to Supabase help-documents bucket.");
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
