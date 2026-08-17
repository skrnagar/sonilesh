import { ProductModulePage } from "@/components/marketing/product-module-page";
import { PRODUCT_PAGES } from "@/lib/marketing/product-routes";
import { metadataForPath } from "@/lib/marketing/seo";

export function generateStaticParams() {
  return PRODUCT_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return metadataForPath(`/product/${slug}`);
}

export default async function ProductSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductModulePage slug={slug} />;
}
