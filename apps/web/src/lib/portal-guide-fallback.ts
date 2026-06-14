export type PortalGuideDocument = {
  id: string;
  slug: string;
  document_type: string;
  language: string;
  title: string;
  description: string;
  file_path: string;
  file_url: string;
  file_size_bytes: number | null;
  version: number;
  is_published: boolean;
  download_url: string;
};

function docxPath(folder: string, language: string) {
  return `/help/${folder}/trimma-${folder}-${language}.docx`;
}

export const AGENT_GUIDE_FALLBACKS: PortalGuideDocument[] = [
  {
    id: "agent-en",
    slug: "agent-guide-en",
    document_type: "agent_guide",
    language: "en",
    title: "Trimma Agent Portal Guide",
    description: "Full walkthrough for field agents — onboard salons, invite owners, and earn commissions.",
    file_path: "agent-guide/trimma-agent-guide-en.docx",
    file_url: docxPath("agent-guide", "en"),
    file_size_bytes: null,
    version: 1,
    is_published: true,
    download_url: docxPath("agent-guide", "en"),
  },
  {
    id: "agent-si",
    slug: "agent-guide-si",
    document_type: "agent_guide",
    language: "si",
    title: "ට්‍රිම්මා Agent Portal මාර්ගෝපදේශය",
    description: "Field agents සඳහා සම්පූර්ණ මාර්ගෝපදේශය — සැලුන් onboard කිරීම, owners ආරාධනා කිරීම, commissions.",
    file_path: "agent-guide/trimma-agent-guide-si.docx",
    file_url: docxPath("agent-guide", "si"),
    file_size_bytes: null,
    version: 1,
    is_published: true,
    download_url: docxPath("agent-guide", "si"),
  },
  {
    id: "agent-ta",
    slug: "agent-guide-ta",
    document_type: "agent_guide",
    language: "ta",
    title: "ட்ரிம்மா Agent Portal வழிகாட்டி",
    description: "Field agents க்கான முழுமையான வழிகாட்டி — சலூன்களை onboard செய்தல், commissions.",
    file_path: "agent-guide/trimma-agent-guide-ta.docx",
    file_url: docxPath("agent-guide", "ta"),
    file_size_bytes: null,
    version: 1,
    is_published: true,
    download_url: docxPath("agent-guide", "ta"),
  },
];

export const REGIONAL_HEAD_GUIDE_FALLBACKS: PortalGuideDocument[] = [
  {
    id: "rh-en",
    slug: "regional-head-guide-en",
    document_type: "regional_head_guide",
    language: "en",
    title: "Trimma Regional Head Portal Guide",
    description: "Lead your agent team, onboard salons, set commission splits, and grow your territory.",
    file_path: "regional-head-guide/trimma-regional-head-guide-en.docx",
    file_url: docxPath("regional-head-guide", "en"),
    file_size_bytes: null,
    version: 1,
    is_published: true,
    download_url: docxPath("regional-head-guide", "en"),
  },
  {
    id: "rh-si",
    slug: "regional-head-guide-si",
    document_type: "regional_head_guide",
    language: "si",
    title: "ට්‍රිම්මා Regional Head Portal මාර්ගෝපදේශය",
    description: "Agent කණ්ඩායම නිලවත් කිරීම, සැලුන් onboard කිරීම, commission splits සහ territory වර්ධනය.",
    file_path: "regional-head-guide/trimma-regional-head-guide-si.docx",
    file_url: docxPath("regional-head-guide", "si"),
    file_size_bytes: null,
    version: 1,
    is_published: true,
    download_url: docxPath("regional-head-guide", "si"),
  },
  {
    id: "rh-ta",
    slug: "regional-head-guide-ta",
    document_type: "regional_head_guide",
    language: "ta",
    title: "ட்ரிம்மா Regional Head Portal வழிகாட்டி",
    description: "Agent குழுவை வழிநடத்துதல், சலூன்களை onboard செய்தல், commission splits மற்றும் territory வளர்ச்சி.",
    file_path: "regional-head-guide/trimma-regional-head-guide-ta.docx",
    file_url: docxPath("regional-head-guide", "ta"),
    file_size_bytes: null,
    version: 1,
    is_published: true,
    download_url: docxPath("regional-head-guide", "ta"),
  },
];

export function getPortalGuideFallbacks(documentType: string): PortalGuideDocument[] {
  if (documentType === "regional_head_guide") return REGIONAL_HEAD_GUIDE_FALLBACKS;
  if (documentType === "agent_guide") return AGENT_GUIDE_FALLBACKS;
  return [];
}

export function resolvePortalGuideDocuments(
  documentType: string,
  rows: Array<{
    id: string;
    slug: string;
    document_type: string;
    language: string;
    title: string;
    description: string | null;
    file_path: string;
    file_url: string | null;
    file_size_bytes: number | null;
    version: number;
    is_published: boolean;
  }> | null | undefined,
  language?: string | null
): PortalGuideDocument[] {
  const fallbacks = getPortalGuideFallbacks(documentType);
  const folder = documentType === "regional_head_guide" ? "regional-head-guide" : "agent-guide";

  const source =
    rows && rows.length > 0
      ? rows.map((row) => {
          const fallbackPath = `/help/${folder}/trimma-${folder}-${row.language}.docx`;
          const rawUrl = row.file_url?.startsWith("http") ? row.file_url : row.file_url || fallbackPath;
          const fileUrl = rawUrl.endsWith(".pdf") ? fallbackPath : rawUrl;
          return {
            ...row,
            description: row.description || "",
            file_url: fileUrl,
            download_url: fileUrl,
          };
        })
      : fallbacks;

  if (language) return source.filter((d) => d.language === language);
  return source;
}
