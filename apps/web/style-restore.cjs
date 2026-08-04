const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[m[1]] = v;
    }
  }
  return out;
}

const env = loadEnv(path.join(__dirname, ".env"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SOURCE_ROOT = "C:/Users/thusi/Downloads/Styles";
const EXECUTE = process.argv.includes("--execute");

// User-provided folder -> category slug mapping. "Nails" auto-detected.
const FOLDER_TO_SLUG = {
  "Bridal": "bridal-beauty",
  "Men - Grooming": "mens-grooming",
  "Hair - Baber": "barber-salon",
  "Beauty Parlor": "beauty-parlours",
  "Nails": null,
};

function normTitleKey(name) {
  const base = name
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  const m = base.match(/^(.*?)\s*(\d+)\s*$/);
  return m ? `${m[1].trim()}#${parseInt(m[2], 10)}` : `${base}#`;
}

function contentType(name) {
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  return "image/jpeg";
}

function walkImages(dir, topFolder, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkImages(full, topFolder, out);
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
      out.push({ folder: topFolder, name: entry.name, full, key: normTitleKey(entry.name) });
    }
  }
}

function gatherSourceFiles() {
  const byFolder = {};
  for (const entry of fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const list = [];
    walkImages(path.join(SOURCE_ROOT, entry.name), entry.name, list);
    byFolder[entry.name] = list;
  }
  return byFolder;
}

(async () => {
  const byFolder = gatherSourceFiles();

  const { data: cats, error: cErr } = await supabase.from("categories").select("id, name, slug");
  if (cErr) { console.error("categories error:", cErr.message); process.exit(1); }
  const slugById = {};
  cats.forEach((c) => (slugById[c.id] = c.slug));

  // resolve Nails slug
  if (!FOLDER_TO_SLUG["Nails"]) {
    const nail = cats.find((c) => /nail/i.test(c.slug) || /nail/i.test(c.name));
    FOLDER_TO_SLUG["Nails"] = nail ? nail.slug : null;
  }
  const slugToFolder = {};
  for (const [folder, slug] of Object.entries(FOLDER_TO_SLUG)) if (slug) slugToFolder[slug] = folder;

  console.log("=== CATEGORIES ===");
  cats.forEach((c) => console.log(`${c.slug}  (${c.name})`));
  console.log("\n=== FOLDER -> SLUG ===");
  console.log(JSON.stringify(FOLDER_TO_SLUG, null, 2));
  console.log("\n=== SOURCE FOLDER COUNTS ===");
  Object.entries(byFolder).forEach(([f, l]) => console.log(`${f}: ${l.length}`));

  const { data: styles, error } = await supabase
    .from("platform_styles")
    .select("id, title, category, category_id, image_url, sort_order")
    .order("sort_order", { ascending: true });
  if (error) { console.error("styles error:", error.message); process.exit(1); }

  console.log(`\n=== DB platform_styles: ${styles.length} ===`);
  console.log(`EXECUTE MODE: ${EXECUTE ? "YES (uploads + DB writes)" : "NO (dry run)"}\n`);

  const matched = [];
  const nameUnmatched = [];
  const used = new Set();

  for (const s of styles) {
    const slug = slugById[s.category_id];
    const folder = slugToFolder[slug];
    if (!folder || !byFolder[folder]) {
      nameUnmatched.push({ style: s, folder: null, slug });
      continue;
    }
    const key = normTitleKey(s.title);
    const cand = byFolder[folder].filter((f) => f.key === key);
    if (cand.length === 1) {
      matched.push({ style: s, file: cand[0], how: "name" });
      used.add(cand[0].full);
    } else {
      nameUnmatched.push({ style: s, folder, slug });
    }
  }

  console.log(`NAME-MATCHED: ${matched.length}`);
  console.log(`NEEDS VISUAL MATCH: ${nameUnmatched.length}`);

  // ---- Visual matching for the rest, within their category folder ----
  async function sigFromBuffer(buf) {
    return sharp(buf).removeAlpha().resize(12, 12, { fit: "fill" }).toColourspace("srgb").raw().toBuffer();
  }
  function dist(a, b) {
    let s = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) { const d = a[i] - b[i]; s += d * d; }
    return s;
  }
  const sigCache = new Map();
  async function fileSig(full) {
    if (sigCache.has(full)) return sigCache.get(full);
    const sig = await sigFromBuffer(fs.readFileSync(full));
    sigCache.set(full, sig);
    return sig;
  }

  // group needs-visual by folder
  const byFolderNeeds = {};
  for (const u of nameUnmatched) {
    if (!u.folder) continue;
    (byFolderNeeds[u.folder] = byFolderNeeds[u.folder] || []).push(u);
  }
  const stillUnmatched = nameUnmatched.filter((u) => !u.folder).map((u) => ({ title: u.style.title, reason: "no folder", slug: u.slug }));

  for (const [folder, needs] of Object.entries(byFolderNeeds)) {
    const candidates = byFolder[folder].filter((f) => !used.has(f.full));
    // compute style signatures (from current stored image_url)
    const pairs = [];
    for (const u of needs) {
      let styleSig = null;
      try {
        const res = await fetch(u.style.image_url);
        const buf = Buffer.from(await res.arrayBuffer());
        styleSig = await sigFromBuffer(buf);
      } catch (e) {
        styleSig = null;
      }
      for (const c of candidates) {
        if (!styleSig) continue;
        const cs = await fileSig(c.full);
        pairs.push({ u, c, d: dist(styleSig, cs) });
      }
    }
    pairs.sort((a, b) => a.d - b.d);
    const assignedStyle = new Set();
    const assignedFile = new Set();
    for (const p of pairs) {
      if (assignedStyle.has(p.u.style.id) || assignedFile.has(p.c.full)) continue;
      assignedStyle.add(p.u.style.id);
      assignedFile.add(p.c.full);
      used.add(p.c.full);
      matched.push({ style: p.u.style, file: p.c, how: "visual", d: p.d });
    }
    for (const u of needs) {
      if (!assignedStyle.has(u.style.id)) stillUnmatched.push({ title: u.style.title, folder, reason: "no candidate left/visual fail" });
    }
  }

  console.log(`TOTAL MATCHED: ${matched.length} (name + visual)`);
  console.log(`STILL UNMATCHED: ${stillUnmatched.length}`);
  if (stillUnmatched.length) console.log(JSON.stringify(stillUnmatched, null, 2));

  if (!EXECUTE) {
    console.log("\n--- VISUAL MATCHES (review these) ---");
    matched.filter((m) => m.how === "visual").forEach((m) => console.log(`"${m.style.title}"  <=  ${m.file.folder}/${m.file.name}`));
    console.log("\n--- NAME MATCHES (first 10) ---");
    matched.filter((m) => m.how === "name").slice(0, 10).forEach((m) => console.log(`"${m.style.title}"  <=  ${m.file.folder}/${m.file.name}`));
    console.log("\nDry run complete. Re-run with --execute to upload + update DB.");
    return;
  }

  console.log("=== EXECUTING ===");
  const backup = styles.map((s) => ({ id: s.id, title: s.title, image_url: s.image_url }));
  fs.writeFileSync(path.join(__dirname, "style-restore-backup.json"), JSON.stringify(backup, null, 2));
  console.log(`Backup of current image URLs written to style-restore-backup.json (${backup.length} rows).`);
  let ok = 0, fail = 0;
  for (const { style, file } of matched) {
    try {
      const buffer = fs.readFileSync(file.full);
      let ext = file.name.split(".").pop().toLowerCase();
      if (ext === "jpeg") ext = "jpg";
      const newPath = `styles/style_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("public-assets").upload(newPath, buffer, {
        contentType: contentType(file.name), cacheControl: "31536000", upsert: true,
      });
      if (upErr) throw new Error(`upload: ${upErr.message}`);
      const { data: pub } = supabase.storage.from("public-assets").getPublicUrl(newPath);
      const { error: dbErr } = await supabase.from("platform_styles").update({ image_url: pub.publicUrl }).eq("id", style.id);
      if (dbErr) throw new Error(`db: ${dbErr.message}`);
      ok++;
      if (ok % 10 === 0) console.log(`...${ok} done`);
    } catch (e) {
      fail++;
      console.log(`FAIL "${style.title}": ${e.message}`);
    }
  }
  console.log(`\nDone. Success: ${ok}, Failed: ${fail}`);
})();
