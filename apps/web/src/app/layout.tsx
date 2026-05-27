import '../index.css';
import SiteChrome from '../components/SiteChrome';
import { Toaster } from 'sonner';
import { outfit } from '../lib/fonts';

export const metadata = {
  title: 'Trimma OS',
  description: 'The intelligent operating system for a salon marketplace.',
  icons: {
    icon: '/logo.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" sizes="any" />
      </head>
      <body className={`${outfit.className} antialiased flex flex-col min-h-screen`} suppressHydrationWarning>
        <SiteChrome>{children}</SiteChrome>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
