import { redirect } from "next/navigation";

export default async function OrganizationDataRedirect({
  searchParams,
}: {
  searchParams: Promise<{ exported?: string }>;
}) {
  const params = await searchParams;
  const query = params.exported ? "?exported=1" : "";
  redirect(`/org-admin/data${query}`);
}
