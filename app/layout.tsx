import './globals.css';
import type { Metadata } from 'next';
import { Inter, Noto_Naskh_Arabic } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AppProvider } from '@/components/app-provider';
import { Navbar } from '@/components/navbar';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const arabic = Noto_Naskh_Arabic({ subsets: ['arabic'], variable: '--font-arabic', weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'Scout — مراقب الإعلانات المبوبة',
  description: 'Monitor classified listings from multiple sources, ranked by price.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.variable} ${arabic.variable} font-arabic`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AppProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-64px)] pt-16">{children}</main>
            <Toaster />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
