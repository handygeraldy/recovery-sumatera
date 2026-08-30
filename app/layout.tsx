import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { ThemeProvider } from '@/app/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Recovery Sumatera | Dashboard Ketahanan Pangan & Pemulihan Pasca-Bencana',
  description:
    'Sistem pemantauan spasial ketahanan pangan dan pemulihan pasca-bencana untuk Provinsi Aceh, Sumatera Utara, dan Sumatera Barat berbasis machine learning dan citra satelit.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
