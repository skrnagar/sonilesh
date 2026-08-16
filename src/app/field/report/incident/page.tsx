import { redirect } from "next/navigation";

export default function LegacyIncidentRedirect() {
  redirect("/field/incident");
}
