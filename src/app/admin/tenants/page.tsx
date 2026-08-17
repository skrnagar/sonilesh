import { redirect } from "next/navigation";

export default function AdminTenantsRedirect() {
  redirect("/admin/organizations");
}
