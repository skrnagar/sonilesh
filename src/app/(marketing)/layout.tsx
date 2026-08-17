import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { OrganizationJsonLd } from "@/components/marketing/json-ld";
import { brand } from "@/lib/marketing/content";
import { metadataForPath } from "@/lib/marketing/seo";

/** Public marketing HTML can be cached at the CDN; logged-in HTML stays private via cookies. */
export const revalidate = 300;

export const metadata: Metadata = {
  ...metadataForPath("/"),
  metadataBase: new URL("https://ehs360.app"),
  title: {
    default: `${brand.name} — EHS + ESG + Compliance software`,
    template: `%s | ${brand.name}`,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <OrganizationJsonLd />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
