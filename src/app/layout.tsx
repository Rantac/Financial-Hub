import type {Metadata} from 'next';
import { Inter, Roboto_Mono } from 'next/font/google'; // Replaced Geist_Sans and Geist_Mono
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: '--font-inter', // Updated variable name
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono', // Updated variable name
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TradeFlow',
  description: 'Manage tasks, calculate trades, and monitor crypto markets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}> {/* Updated font variables */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
