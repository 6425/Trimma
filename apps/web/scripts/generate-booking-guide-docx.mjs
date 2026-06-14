/**
 * Generate Trimma Customer Booking Guide Word documents (English, Sinhala, Tamil).
 *
 * Usage: node apps/web/scripts/generate-booking-guide-docx.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { GUIDE_META, GUIDE_STEPS } from "./booking-guide-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public/help/booking-guide");

const GOLD = "F5B700";
const INK = "1A1C29";

const VISUAL_CAPTIONS = {
  marketplace: "Marketplace home — search by location, service, and date.",
  search: "Search results — salon cards with ratings and verified badges.",
  salon: "Salon profile — services list with Book button.",
  "step-services": "Booking Step 1 — select services from the menu.",
  "step-stylist": "Booking Step 2 — choose stylist or Any Available.",
  "step-datetime": "Booking Step 3 — pick date and open time slot.",
  "step-details": "Booking Step 4 — phone lookup, name, email, and phone.",
  "step-summary": "Booking Step 5 — summary, 20% deposit, policy checkboxes.",
  checkout: "Stripe checkout — pay 20% reservation deposit online.",
  whatsapp: "WhatsApp confirmation — booking reference and balance due.",
  visit: "Salon visit — pay remaining 80% balance after service.",
  account: "Sign in with Google — customer dashboard access.",
  reviews: "Leave a review — star rating after your visit time passes.",
};

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: INK, size: level === HeadingLevel.HEADING_1 ? 32 : 26 })],
  });
}

function body(text) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function tipBox(label, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "FFF8E1" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: GOLD },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: GOLD },
              left: { style: BorderStyle.SINGLE, size: 1, color: GOLD },
              right: { style: BorderStyle.SINGLE, size: 1, color: GOLD },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${label}: `, bold: true, color: "92400E", size: 20 }),
                  new TextRun({ text, color: "92400E", size: 20 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function screenCaption(visual) {
  const caption = VISUAL_CAPTIONS[visual] || "Trimma booking screen.";
  return new Paragraph({
    spacing: { before: 80, after: 200 },
    children: [
      new TextRun({ text: "Screen: ", bold: true, italics: true, size: 20, color: "71717A" }),
      new TextRun({ text: caption, italics: true, size: 20, color: "71717A" }),
    ],
  });
}

function buildDocument(lang) {
  const meta = { ...GUIDE_META[lang], fileName: `trimma-booking-guide-${lang}.docx` };
  const steps = GUIDE_STEPS[lang];
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "Trimma", bold: true, size: 48, color: INK })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: meta.coverTitle, bold: true, size: 36, color: INK })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: meta.coverSubtitle, size: 24, color: "52525B" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: meta.coverTagline, size: 22, color: "71717A" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      shading: { type: ShadingType.CLEAR, fill: GOLD },
      children: [new TextRun({ text: meta.depositNote, bold: true, size: 22, color: INK })],
    }),
    new Paragraph({ children: [new TextRun({ text: "" })] }),
  ];

  steps.forEach((step, idx) => {
    children.push(
      heading(`${meta.stepsLabel} ${idx + 1}: ${step.title.replace(/^\d+\.\s*/, "")}`, HeadingLevel.HEADING_2),
      body(step.body),
      screenCaption(step.visual)
    );
    if (step.tip) {
      children.push(tipBox(meta.tipLabel, step.tip));
    }
    children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "" })] }));
  });

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
      children: [new TextRun({ text: meta.footer, size: 18, color: "71717A" })],
    })
  );

  return { meta, doc: new Document({ sections: [{ children }] }) };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const lang of ["en", "si", "ta"]) {
    const { meta, doc } = buildDocument(lang);
    const buffer = await Packer.toBuffer(doc);
    const outPath = path.join(OUT_DIR, meta.fileName);
    fs.writeFileSync(outPath, buffer);
    console.log(`✓ ${meta.fileName} (${Math.round(buffer.length / 1024)} KB)`);
  }

  console.log("\nWord guides saved to apps/web/public/help/booking-guide/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
