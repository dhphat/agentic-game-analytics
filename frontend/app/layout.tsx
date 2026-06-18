import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const instrumentSans = Instrument_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agentic Game Analytics",
  description: "AI-powered data analytics for games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.className} min-h-screen bg-transparent text-gray-900 dark:text-slate-100 overflow-hidden`}>
        <Toaster position="bottom-right" />
        {children}
      </body>
    </html>
  );
}
