import '../index.css';
import SiteChromeLoader from '../components/SiteChromeLoader';
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner';
import { CookieSettingsControl } from '@/components/legal/CookieSettingsControl';
import { Toaster } from 'sonner';
import { outfit, inter } from '../lib/fonts';
import { ThemeProvider } from '../providers/ThemeProvider';
import { getSiteUrl } from '@/lib/site-url';

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
  title: 'Trimma OS - Find. Book. Glow.',
  description: 'The intelligent operating system for a salon marketplace.',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
  }
}

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
      </head>
      <body className={`font-sans antialiased flex flex-col min-h-screen`} suppressHydrationWarning>
        <ThemeProvider>
          <SiteChromeLoader>{children}</SiteChromeLoader>
          <CookieConsentBanner />
          <CookieSettingsControl />
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
