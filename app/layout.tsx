import type { Metadata } from 'next';
import { Cairo } from 'next/font/google'; // خط عربي جميل
import './globals.css';

const cairo = Cairo({ subsets: ['arabic'] });

export const metadata: Metadata = {
  title: 'شمسين - إدارة الدواجن',
  description: 'نظام إدارة مزارع الدواجن اللاحم',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
