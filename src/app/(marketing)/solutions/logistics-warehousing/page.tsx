import { IndustryPage } from "@/components/marketing/industry-page";
import { metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/solutions/logistics-warehousing");

export default function Page() {
  return <IndustryPage slug="logistics-warehousing" />;
}
