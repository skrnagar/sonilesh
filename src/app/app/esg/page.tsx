import { redirect } from "next/navigation";

export default function EsgIndexPage() {
  redirect("/app/esg/metrics");
}
