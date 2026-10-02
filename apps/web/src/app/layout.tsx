import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './_providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Balance — расходы на ремонт', template: '%s · Balance' },
  description: 'Трекер расходов на ремонт квартиры',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
