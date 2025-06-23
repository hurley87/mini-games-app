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

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  return {
    title: 'Mini Games',
    description: 'Play Mini Games',
    other: {
      'fc:frame': JSON.stringify({
        version: 'next',
        imageUrl: 'https://app.minigames.studio/hero.png',
        button: {
          title: `Launch Mini Games`,
          action: {
            type: 'launch_frame',
            name: 'Mini Games',
            url: URL,
            splashImageUrl: 'https://app.minigames.studio/splash.png',
            splashBackgroundColor: '#000000',
          },
        },
      }),
    },
  };
}

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
