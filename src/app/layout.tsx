import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans-face",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "SONIL EHS360 — The EHS operating system for India’s critical sites.",
    template: "%s | SONIL EHS360",
  },
  description:
    "India-first multi-tenant platform for EHS operations, ESG/BRSR-oriented reporting, and regulatory tracking — field modules, My Zone, workspace, and org admin.",
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
    title: "SONIL EHS360 — The EHS operating system for India’s critical sites.",
    description:
      "Field EHS modules, My Zone apps, workspace controls, and org admin — one multi-tenant platform from workfront capture to BRSR-ready reporting.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SONIL EHS360 — The EHS operating system for India’s critical sites.",
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
      <body className={`${plusJakarta.variable} bg-background text-foreground antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
