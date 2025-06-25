import './theme.css';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { MiniAppProvider } from '@/contexts/miniapp-context';
import { AppInit } from '@/components/app-init';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Mini Games',
  description: 'Play Mini Games, Earn Tokens',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <head>
        <link rel="preconnect" href="https://auth.farcaster.xyz" />
      </head>
      <body className="antialiased bg-black text-white">
        <MiniAppProvider>
          <AppInit>{children}</AppInit>
        </MiniAppProvider>
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
