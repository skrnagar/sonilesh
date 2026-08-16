import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-face",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SONIL EHS360 — EHS control built for how infrastructure gets executed.",
    template: "%s | SONIL EHS360",
  },
  description:
    "Multi-tenant Environment, Health & Safety platform for incidents, CAPA, permits, inspections, and analytics. From the field to the boardroom.",
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
    title: "SONIL EHS360 — EHS control built for how infrastructure gets executed.",
    description:
      "Unify incidents, LMRA, risk, permits, inspections, CAPA, training, and analytics in one multi-tenant EHS SaaS platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SONIL EHS360 — One Platform. Complete EHS Control.",
    description:
      "From the field to the boardroom — complete EHS control on one platform.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b141c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
