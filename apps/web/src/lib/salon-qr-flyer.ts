export type SalonQrFlyerData = {
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  tagline?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function resolveSalonPublicBaseUrl(): string {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      window.location.origin
    );
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.NODE_ENV === "production" ? "https://www.trimma.io" : "http://localhost:3000")
  );
}

export function buildSalonPublicUrl(slug: string, baseUrl = resolveSalonPublicBaseUrl()): string {
  const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, "");
  return `${baseUrl.replace(/\/$/, "")}/salons/${encodeURIComponent(cleanSlug)}`;
}

export function buildQrCodeImageUrl(targetUrl: string, size = 400): string {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: targetUrl,
    color: "000000",
    bgcolor: "ffffff",
    margin: "12",
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

export function printSalonQrFlyer(data: SalonQrFlyerData): void {
  const slug = data.slug?.trim();
  if (!slug) {
    throw new Error("Save your salon profile first — a public URL slug is required.");
  }

  const salonName = data.name?.trim() || "Your Salon";
  const salonUrl = buildSalonPublicUrl(slug);
  const qrUrl = buildQrCodeImageUrl(salonUrl, 420);
  const address = data.address?.trim() || "";
  const phone = data.phone?.trim() || "";
  const tagline =
    data.tagline?.trim() ||
    "Scan the code to view our services and book your next appointment on Trimma.";
  const logoUrl =
    data.logoUrl?.trim() ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(salonName)}`;

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
  if (!printWindow) {
    throw new Error("Pop-up blocked. Allow pop-ups for this site to print the QR flyer.");
  }

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(salonName)} — Trimma QR Flyer</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        color: #111;
        background: #fff;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 18mm 16mm 14mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background:
          radial-gradient(circle at top right, rgba(249, 224, 0, 0.18), transparent 38%),
          #ffffff;
      }
      .brand-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10mm;
      }
      .brand-mark {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .brand-dot {
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: #f9e000;
        box-shadow: 0 0 0 4px rgba(249, 224, 0, 0.25);
      }
      .badge {
        background: #f9e000;
        color: #111;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        padding: 8px 14px;
        border-radius: 999px;
      }
      .hero {
        text-align: center;
        padding: 0 8mm;
      }
      .logo {
        width: 88px;
        height: 88px;
        border-radius: 24px;
        object-fit: cover;
        border: 4px solid #f9e000;
        margin: 0 auto 16px;
        display: block;
        background: #fff;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 34px;
        line-height: 1.1;
        font-weight: 900;
        letter-spacing: -0.03em;
      }
      .tagline {
        margin: 0 auto;
        max-width: 140mm;
        font-size: 15px;
        line-height: 1.6;
        color: #52525b;
      }
      .meta {
        margin-top: 14px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px 18px;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        color: #3f3f46;
      }
      .qr-panel {
        margin: 12mm auto 0;
        width: 118mm;
        padding: 10mm 8mm 8mm;
        border: 3px solid #111;
        border-radius: 24px;
        text-align: center;
        background: #fff;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
      }
      .qr-panel img {
        width: 92mm;
        height: 92mm;
        display: block;
        margin: 0 auto;
      }
      .scan-label {
        margin-top: 8mm;
        font-size: 18px;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .url {
        margin-top: 4mm;
        font-size: 12px;
        color: #71717a;
        word-break: break-all;
      }
      .footer {
        margin-top: 10mm;
        text-align: center;
        font-size: 11px;
        color: #71717a;
        line-height: 1.5;
      }
      .cta {
        margin-top: 6mm;
        display: inline-block;
        background: #111;
        color: #fff;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 10px 18px;
        border-radius: 999px;
      }
      @media print {
        body { background: #fff; }
        .page { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div>
        <div class="brand-bar">
          <div class="brand-mark"><span class="brand-dot"></span> Trimma</div>
          <div class="badge">Book Online</div>
        </div>
        <div class="hero">
          <img class="logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(salonName)} logo" />
          <h1>${escapeHtml(salonName)}</h1>
          <p class="tagline">${escapeHtml(tagline)}</p>
          ${
            address || phone
              ? `<div class="meta">${address ? `<span>${escapeHtml(address)}</span>` : ""}${phone ? `<span>${escapeHtml(phone)}</span>` : ""}</div>`
              : ""
          }
        </div>
        <div class="qr-panel">
          <img src="${escapeHtml(qrUrl)}" alt="QR code for ${escapeHtml(salonName)}" />
          <div class="scan-label">Scan to Book</div>
          <div class="url">${escapeHtml(salonUrl)}</div>
        </div>
      </div>
      <div class="footer">
        <div class="cta">Powered by Trimma</div>
        <p style="margin-top: 8mm;">Print this A4 poster for your storefront, reception desk, or mirror station.</p>
      </div>
    </div>
    <script>
      window.onload = function () {
        window.focus();
        window.print();
      };
    </script>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
