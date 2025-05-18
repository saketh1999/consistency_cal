import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { NavBar } from '@/components/custom/NavBar';
import { Footer } from '@/components/custom/Footer';
import { AuthProvider } from '@/lib/hooks/useAuth';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Consistency',
  description: 'Your personal consistency tracker and motivational companion.',
  manifest: '/manifest.json',
  icons: [
    { rel: 'icon', url: '/icons/icon-192x192.png' },
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
  ],
};

export const viewport: Viewport = {
  themeColor: '#FACC15', // Updated to a yellow/gold color for dark theme consistency
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-background">
            <NavBar />
            {children}
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
