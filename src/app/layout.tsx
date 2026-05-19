import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DesktopSidebar, MobileNav } from "@/components/layout/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APM Project – Projekthub",
  description:
    "Internt CRM och projekthub för APM Project – cirkulär kontorsinredning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex min-h-screen">
          <div className="print:hidden">
            <DesktopSidebar />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="print:hidden">
              <MobileNav />
            </div>
            <main className="flex-1 p-4 md:p-8 print:p-0">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
