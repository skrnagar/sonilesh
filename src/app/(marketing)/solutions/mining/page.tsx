import { IndustryPage } from "@/components/marketing/industry-page";
import { metadataForPath } from "@/lib/marketing/seo";

const slug = "mining";

export const metadata = metadataForPath("/solutions/mining");

export default function Page() {
  return <IndustryPage slug={slug} />;
}
