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
  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "date-fns", "recharts"]
  }
}

export default nextConfig;

