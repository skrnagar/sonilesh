import { redirect } from "next/navigation";

/** Spec route. Regulatory licenses live at /licenses to stay distinct from EHS PTW /app/permits. */
export default function RegulatoryPermitsAliasPage() {
  redirect("/app/compliance/licenses");
}
