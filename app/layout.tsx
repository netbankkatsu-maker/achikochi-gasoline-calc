import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'あちこちガソリン代計算くん',
  description: '複数経由地のガソリン代・高速料金を計算するアプリ',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-gray-50">
        <main className="max-w-md mx-auto pb-24 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
