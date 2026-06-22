/**
 * Generate Trimma Salon Onboarding Journey Word document.
 *
 * Usage: node apps/web/scripts/generate-salon-onboarding-docx.mjs
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
  DOC_META,
  SECTIONS,
  STATUS_PIPELINE_SECTION,
} from "./salon-onboarding-journey-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIRS = [
  path.resolve(__dirname, "../../../docs"),
  path.resolve(__dirname, "../public/help/salon-onboarding"),
];

const GOLD = "FFC800";
const INK = "1A1C29";
const HEADER_FILL = "F4F4F5";
const CRITICAL_FILL = "FEE2E2";

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 320, after: 160 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: INK,
        size: level === HeadingLevel.HEADING_1 ? 30 : 26,
      }),
    ],
  });
}

function body(text) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function bullets(items) {
  return items.map(
    (text) =>
      new Paragraph({
        spacing: { after: 80 },
        bullet: { level: 0 },
        children: [new TextRun({ text, size: 22 })],
      })
  );
}

function tableCell(text, opts = {}) {
  const fill = opts.critical ? CRITICAL_FILL : opts.header ? HEADER_FILL : undefined;
  return new TableCell({
    shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text ?? ""),
            bold: Boolean(opts.header || opts.critical),
            size: 20,
            color: opts.header ? INK : "3F3F46",
          }),
        ],
      }),
    ],
  });
}

function dataTable({ headers, rows }, opts = {}) {
  const colWidth = Math.floor(100 / headers.length);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h) => tableCell(h, { header: true, width: colWidth })),
      }),
      ...rows.map((row) =>
        new TableRow({
          children: row.map((cell, idx) =>
            tableCell(cell, {
              width: colWidth,
              critical: opts.highlightCritical && idx === 0 && String(cell).startsWith("C"),
            })
          ),
        })
      ),
    ],
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "" })] });
}

function buildDocument() {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "Trimma", bold: true, size: 52, color: INK })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: DOC_META.title, bold: true, size: 34, color: INK })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: DOC_META.subtitle, size: 24, color: "52525B" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `Version: ${DOC_META.version}`, size: 20, color: "71717A" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `Audience: ${DOC_META.audience}`, size: 20, color: "71717A" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      shading: { type: ShadingType.CLEAR, fill: GOLD },
      children: [
        new TextRun({
          text: "Discovery → Agent → Owner → Admin Verify → Live Bookings",
          bold: true,
          size: 22,
          color: INK,
        }),
      ],
    }),
    heading("Document purpose"),
    body(
      "This document maps the complete salon partner onboarding journey on Trimma, lists notifications at each stage, defines what gates public booking, and identifies gaps that should be addressed before and after go-live."
    ),
    heading("Table of contents", HeadingLevel.HEADING_2),
    ...SECTIONS.map((s) => body(s.title)),
    body(STATUS_PIPELINE_SECTION.title),
    spacer(),
  ];

  for (const section of SECTIONS) {
    children.push(heading(section.title, HeadingLevel.HEADING_1));

    if (section.paragraphs) {
      section.paragraphs.forEach((p) => children.push(body(p)));
    }

    if (section.table) {
      const highlightCritical = section.id === "go-live-gaps";
      children.push(spacer(), dataTable(section.table, { highlightCritical }), spacer());
    }

    if (section.bullets) {
      children.push(...bullets(section.bullets), spacer());
    }

    if (section.subsections) {
      for (const sub of section.subsections) {
        children.push(heading(sub.title, HeadingLevel.HEADING_2));
        if (sub.paragraphs) sub.paragraphs.forEach((p) => children.push(body(p)));
        if (sub.table) {
          const highlightCritical = sub.title.includes("Critical");
          children.push(spacer(), dataTable(sub.table, { highlightCritical }), spacer());
        }
        if (sub.bullets) children.push(...bullets(sub.bullets), spacer());
      }
    }
  }

  children.push(
    heading(STATUS_PIPELINE_SECTION.title, HeadingLevel.HEADING_1),
    dataTable(STATUS_PIPELINE_SECTION.table),
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
      children: [new TextRun({ text: DOC_META.footer, size: 18, color: "71717A" })],
    })
  );

  return new Document({ sections: [{ children }] });
}

async function main() {
  const doc = buildDocument();
  const buffer = await Packer.toBuffer(doc);

  for (const dir of OUT_DIRS) {
    fs.mkdirSync(dir, { recursive: true });
    const outPath = path.join(dir, DOC_META.fileName);
    fs.writeFileSync(outPath, buffer);
    console.log(`✓ ${outPath} (${Math.round(buffer.length / 1024)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
