import { redirect } from "next/navigation";

/** Legacy path — preserve type query when present. */
export default async function LegacyHazardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const type = params.type ? `?type=${encodeURIComponent(params.type)}` : "";
  redirect(`/field/hazard${type}`);
}
