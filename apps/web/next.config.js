import fs from 'fs';
import path from 'path';

// Self-healing logo copy script
try {
  const src = path.resolve(process.cwd(), '../../lib/Trimma_icon.svg');
  const destDir = path.resolve(process.cwd(), 'public');
  const dest = path.resolve(destDir, 'logo.svg');
  if (fs.existsSync(src)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log('Trimma Logo successfully synced to public/logo.svg!');
  } else {
    console.warn('Source logo not found at:', src);
  }
} catch (err) {
  console.error('Failed to sync logo:', err);
}

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  serverExternalPackages: [],
  serverActions: {
    bodySizeLimit: '20mb',
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "date-fns", "recharts"]
  },
  images: {
    // Dev: skip _next/image proxy — Supabase image fetches were timing out at 60s and blocking pages.
    unoptimized: isDev,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  },
  webpack: (config, { dev }) => {
    // Windows dev file-watching can leave .next in a broken state after rapid edits.
    if (dev && process.platform === "win32") {
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 300,
        poll: 1000,
      };
    }
    return config;
  },
}

export default nextConfig;

