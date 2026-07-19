import '../index.css';
import SiteChromeLoader from '../components/SiteChromeLoader';
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner';
import { Toaster } from 'sonner';
import { outfit, inter } from '../lib/fonts';
import { ThemeProvider } from '../providers/ThemeProvider';
import { PublicSiteJsonLd } from '@/components/seo/PublicSiteJsonLd';
import {
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_OG_IMAGE_SIZE,
} from '@/lib/public-page-metadata';
import { absoluteUrl, getSiteUrl } from '@/lib/site-url';

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

const supabaseOrigin = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
})();

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Trimma OS - Find. Book. Glow.',
    template: '%s | Trimma',
  },
  description:
    'Find and book salons across Sri Lanka — barbers, beauty parlours, spas, nail studios, and more.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: 'Trimma',
    type: 'website',
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        alt: DEFAULT_OG_IMAGE_ALT,
        width: DEFAULT_OG_IMAGE_SIZE.width,
        height: DEFAULT_OG_IMAGE_SIZE.height,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
  icons: {
    icon: '/favicon.svg',
  },
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('trimma-theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}})();`,
          }}
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        {supabaseOrigin ? (
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
        ) : null}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <PublicSiteJsonLd />
      </head>
      <body className={`font-sans antialiased flex flex-col min-h-screen`} suppressHydrationWarning>
        <ThemeProvider>
          <SiteChromeLoader>{children}</SiteChromeLoader>
          <CookieConsentBanner />
          <Toaster
            position="top-center"
            toastOptions={{
              className: "trimma-toast",
              style: {
                background: "#0a0a0a",
                color: "#ffffff",
                border: "1px solid #262626",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
