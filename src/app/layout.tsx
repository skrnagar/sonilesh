import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-face",
});

const display = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
});

export const metadata: Metadata = {
  title: {
    default: "EHS360 — One Platform. Complete EHS Control.",
    template: "%s | EHS360",
  },
  description:
    "Multi-tenant Environment, Health & Safety platform for incidents, CAPA, permits, inspections, and analytics. From the field to the boardroom.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "EHS360 Field",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "EHS360",
    title: "EHS360 — One Platform. Complete EHS Control.",
    description:
      "Unify incidents, risk, permits, inspections, CAPA, training, and analytics in one multi-tenant EHS SaaS platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EHS360 — One Platform. Complete EHS Control.",
    description:
      "From the field to the boardroom — complete EHS control on one platform.",
  },
};

export const viewport: Viewport = {
  themeColor: "#071f2d",
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
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
