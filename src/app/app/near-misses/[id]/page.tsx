import { redirect } from "next/navigation";

export default async function NearMissDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Shared engine detail UX currently centered on incidents route pattern;
  // keep NM detail under its own path by reusing incident detail composition.
  redirect(`/app/incidents/${id}`);
}
