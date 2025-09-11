// app/layout.tsx - Root layout with provider
import { Inter } from 'next/font/google';
import './app.css';
import { TimerProvider } from '@/components/AppwriteProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Esports Timer System',
  description: 'Professional timer management for live broadcasts',
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TimerProvider>
          {children}
        </TimerProvider>
      </body>
    </html>
  );
}
