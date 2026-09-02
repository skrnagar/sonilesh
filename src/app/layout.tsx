import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-face",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "SONIL EHS360 — From field capture to audit-ready reporting.",
    template: "%s | SONIL EHS360",
  },
  description:
    "India-first multi-tenant platform for EHS operations, ESG/BRSR-oriented reporting, and regulatory tracking — field capture through CAPA and leadership analytics.",
  manifest: "/manifest.webmanifest",
  applicationName: "SONIL EHS360",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "SONIL EHS360 Field",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "SONIL EHS360",
    title: "SONIL EHS360 — From field capture to audit-ready reporting.",
    description:
      "Connect field safety, risk, regulatory compliance, sustainability reporting and management analytics in one configurable platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SONIL EHS360 — From field capture to audit-ready reporting.",
    description:
      "India-first EHS, ESG and regulatory compliance on one multi-tenant platform.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b141c" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-background text-foreground antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
