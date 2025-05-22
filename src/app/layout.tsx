import type {Metadata} from 'next';
import { Work_Sans, Noto_Sans } from 'next/font/google'; // Changed fonts
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const workSans = Work_Sans({ // Changed font
  variable: '--font-work-sans', // Changed variable
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'] // Added weights from new design
});

const notoSans = Noto_Sans({ // Changed font
  variable: '--font-noto-sans', // Changed variable
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'] // Added weights from new design
});

export const metadata: Metadata = {
  title: 'Finance Hub', // Updated title
  description: 'Manage tasks, calculate trades, and monitor crypto markets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${workSans.variable} ${notoSans.variable} font-sans antialiased`}> {/* Updated font variables and added base font-sans */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
