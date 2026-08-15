import { redirect } from "next/navigation";

export default async function HazardDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/app/incidents/${id}`);
}
