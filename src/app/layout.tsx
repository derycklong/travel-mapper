import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hokkaido Autumn Road Trip — Interactive Itinerary",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%234285F4'/%3E%3Cpath fill='white' d='M16 5a8 8 0 0 0-8 8c0 5.6 8 14 8 14s8-8.4 8-14a8 8 0 0 0-8-8Zm0 11.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z'/%3E%3C/svg%3E",
  },
  description:
    "10 Days in Hokkaido — Sapporo, Lake Toya, Furano, Biei, Sounkyo & Otaru. An interactive travel itinerary with maps and daily plans.",
  openGraph: {
    title: "Hokkaido Autumn Road Trip",
    description: "10 Days exploring Japan's northern wilderness",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full overflow-hidden">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
