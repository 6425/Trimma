/**
 * Generate Agent & Regional Head Word guides (EN, SI, TA).
 * Usage: node apps/web/scripts/generate-portal-guide-docx.mjs
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
import {
  AGENT_GUIDE_META,
  AGENT_GUIDE_STEPS,
  REGIONAL_HEAD_GUIDE_META,
  REGIONAL_HEAD_GUIDE_STEPS,
} from "./portal-guide-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLD = "FFC800";
const INK = "1A1C29";

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

function buildDoc(meta, steps) {
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
      spacing: { after: 400 },
      children: [new TextRun({ text: meta.coverTagline, size: 22, color: "71717A" })],
    }),
  ];

  steps.forEach((step, idx) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        children: [
          new TextRun({
            text: `${meta.stepsLabel} ${idx + 1}: ${step.title}`,
            bold: true,
            color: INK,
            size: 26,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: step.body, size: 22 })],
      })
    );
    if (step.screen) {
      children.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({ text: `${meta.screenLabel}: `, bold: true, italics: true, size: 20, color: "71717A" }),
            new TextRun({ text: step.screen, italics: true, size: 20, color: "71717A" }),
          ],
        })
      );
    }
    if (step.tip) children.push(tipBox(meta.tipLabel, step.tip));
  });

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
      children: [new TextRun({ text: meta.footer, size: 18, color: "71717A" })],
    })
  );

  return new Document({ sections: [{ children }] });
}

async function writeGuide(outDir, meta, steps, lang) {
  const m = meta[lang];
  const doc = buildDoc(m, steps[lang]);
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outDir, m.fileName);
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ ${outPath.replace(/.*public/, "public")} (${Math.round(buffer.length / 1024)} KB)`);
}

async function main() {
  const agentDir = path.resolve(__dirname, "../public/help/agent-guide");
  const rhDir = path.resolve(__dirname, "../public/help/regional-head-guide");
  fs.mkdirSync(agentDir, { recursive: true });
  fs.mkdirSync(rhDir, { recursive: true });

  for (const lang of ["en", "si", "ta"]) {
    await writeGuide(agentDir, AGENT_GUIDE_META, AGENT_GUIDE_STEPS, lang);
    await writeGuide(rhDir, REGIONAL_HEAD_GUIDE_META, REGIONAL_HEAD_GUIDE_STEPS, lang);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
