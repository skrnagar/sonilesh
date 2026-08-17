import { IndustryPage } from "@/components/marketing/industry-page";
import { metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/solutions/construction-epc");

export default function Page() {
  return <IndustryPage slug="construction-epc" />;
}
