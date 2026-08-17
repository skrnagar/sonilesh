import { IndustryPage } from "@/components/marketing/industry-page";
import { metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/solutions/oil-gas-chemicals");

export default function Page() {
  return <IndustryPage slug="oil-gas-chemicals" />;
}
