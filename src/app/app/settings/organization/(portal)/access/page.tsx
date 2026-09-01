import { redirect } from "next/navigation";

export default function OrganizationAccessRedirect() {
  redirect("/org-admin/access");
}
