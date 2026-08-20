import { redirect } from "next/navigation";

export default async function LegacyHazardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const allowed = ["hazard", "unsafe_act", "unsafe_condition", "safety_observation"];
  const suffix = type && allowed.includes(type) ? `?type=${encodeURIComponent(type)}` : "";
  redirect(`/field/lmra${suffix}`);
}
