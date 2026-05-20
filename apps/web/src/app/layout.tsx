import '../index.css';

export const metadata = {
  title: 'Trimma OS',
  description: 'The intelligent operating system for a salon marketplace.',
  icons: {
    icon: '/logo.svg',
  }
}

import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" sizes="any" />
      </head>
      <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning>
        <GlobalHeader />
        <main className="flex-1">
          {children}
        </main>
        <GlobalFooter />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
