import { IndustryPage } from "@/components/marketing/industry-page";
import { metadataForPath } from "@/lib/marketing/seo";

const slug = "infrastructure";

export const metadata = metadataForPath("/solutions/infrastructure");

export default function Page() {
  return <IndustryPage slug={slug} />;
}
