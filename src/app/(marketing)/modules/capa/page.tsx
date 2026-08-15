import type { Metadata } from "next";
import { ModulePage } from "@/components/marketing/module-page";
import { getModule } from "@/lib/marketing/content";

const slug = "capa";
const mod = getModule(slug);

export const metadata: Metadata = {
  title: mod?.name ?? "Module",
  description: mod?.summary,
};

export default function Page() {
  return <ModulePage slug={slug} />;
}
