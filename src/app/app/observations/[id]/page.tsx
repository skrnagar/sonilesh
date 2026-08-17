import { redirect } from "next/navigation";

export default async function ObservationDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Shared detail lives under hazards until type-aware detail is unified
  redirect(`/app/hazards/${id}`);
}
