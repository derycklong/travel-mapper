import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Travel Mapper — Interactive Itinerary",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%232563EB'/%3E%3Cpath fill='white' d='M16 5a8 8 0 0 0-8 8c0 5.6 8 14 8 14s8-8.4 8-14a8 8 0 0 0-8-8Zm0 11.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z'/%3E%3C/svg%3E",
  },
  description: "Interactive travel itinerary with timeline and map views.",
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
    <html lang="en" className="h-full overflow-hidden" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            var t = localStorage.getItem("theme");
            if (t === "dark" || (!t && matchMedia("(prefers-color-scheme: dark)").matches)) {
              document.documentElement.setAttribute("data-theme", "dark");
            } else {
              document.documentElement.setAttribute("data-theme", "light");
            }
          })();
        `}</Script>
      </head>
      <body className={`h-full overflow-hidden ${inter.variable}`} style={{ fontFamily: "var(--font-inter)" }}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
