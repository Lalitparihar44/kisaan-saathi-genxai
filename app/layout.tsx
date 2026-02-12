import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// Global styles
import "./globals.css";
import "./styles/styles.css";
import "./styles/styles_custom.css";
import "./styles/table-card.css";

// Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";

// Mapbox CSS
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import ConditionalLayout from "./ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kissan Saathi",
  description: "AI-powered crop monitoring & Admin platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full overflow-visible`}
      >
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
