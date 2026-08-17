import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sans-face",
  display: "swap",
  preload: true,
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "SONIL EHS360 — One Platform for EHS, ESG & Compliance.",
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
    title: "SONIL EHS360 — One Platform for EHS, ESG & Compliance.",
    description:
      "Connect field safety, risk, regulatory compliance, sustainability reporting and management analytics in one configurable platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SONIL EHS360 — One Platform for EHS, ESG & Compliance.",
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
      <body className={`${sans.variable} ${display.variable} bg-background text-foreground antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
