import type { Metadata } from "next";
import { IndustryPage } from "@/components/marketing/industry-page";
import { getIndustry } from "@/lib/marketing/content";

const slug = "logistics";
const industry = getIndustry(slug);

export const metadata: Metadata = {
  title: industry?.name ?? "Solution",
  description: industry?.summary,
};

export default function Page() {
  return <IndustryPage slug={slug} />;
}
