import { organizationJsonLd } from "@/lib/marketing/seo";

export function OrganizationJsonLd() {
  const payload = organizationJsonLd();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
