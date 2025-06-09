import './theme.css';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { GeistSans } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';

const geistSans = GeistSans({
  subsets: ['latin'],
  variable: '--font-geist-sans',
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
    <html lang="en" className={`${geistSans.variable} dark`}>
      <body className="antialiased bg-gray-900 text-white">
        <Providers>{children}</Providers>
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
