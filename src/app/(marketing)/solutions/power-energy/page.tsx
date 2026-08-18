import { IndustryPage } from "@/components/marketing/industry-page";
import { metadataForPath } from "@/lib/marketing/seo";

const slug = "power-energy";

export const metadata = metadataForPath("/solutions/power-energy");

export default function Page() {
  return <IndustryPage slug={slug} />;
}
