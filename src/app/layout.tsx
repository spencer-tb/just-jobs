import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { getNiche } from "@/lib/niche";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export function generateMetadata(): Metadata {
  const niche = getNiche();
  return {
    title: niche.name,
    description: niche.seo.description,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const niche = getNiche();

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold" style={{ color: niche.theme.primaryColor }}>
              {niche.name}
            </Link>
            <p className="text-sm text-gray-500 hidden sm:block">{niche.tagline}</p>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 bg-white mt-16">
          <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-gray-400">
            {niche.name} — Aggregated from multiple sources. Jobs link to original postings.
          </div>
        </footer>
      </body>
    </html>
  );
}
