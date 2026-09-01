import { redirect } from "next/navigation";

export default function SettingsIndexPage() {
  redirect("/org-admin/general");
}
