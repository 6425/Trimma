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
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  serverExternalPackages: [],
  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "date-fns", "recharts"],
    serverActions: {
      bodySizeLimit: '20mb',
    }
  },
  async redirects() {
    return [
      {
        source: '/salons',
        destination: '/',
        permanent: true,
      },
    ]
  },
  images: {
    // Skip _next/image proxy — Supabase and other remote images were timing out in production.
    unoptimized: true,
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

