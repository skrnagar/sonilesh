import { redirect } from "next/navigation";
import { modules } from "@/lib/marketing/content";
import { productHrefForModule } from "@/lib/marketing/product-routes";

export function generateStaticParams() {
  return modules.map((mod) => ({ slug: mod.slug }));
}

export default async function LegacyModuleRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(productHrefForModule(slug));
}
