import type { Metadata } from "next";

const appBase = (process.env.NEXT_PUBLIC_APP_URL || "https://www.trimma.io").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(appBase),
  robots: { index: true, follow: true },
};
