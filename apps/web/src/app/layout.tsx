import '../index.css';
import SiteChrome from '../components/SiteChrome';
import { Toaster } from 'sonner';
import { outfit, inter } from '../lib/fonts';

const supabaseOrigin = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
})();

export const metadata = {
  title: 'Trimma OS - Find. Book. Glow.',
  description: 'The intelligent operating system for a salon marketplace.',
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        {supabaseOrigin ? (
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
        ) : null}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      </head>
      <body className={`font-sans antialiased flex flex-col min-h-screen`} suppressHydrationWarning>
        <SiteChrome>{children}</SiteChrome>
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
      </body>
    </html>
  )
}
