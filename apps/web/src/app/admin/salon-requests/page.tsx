import { redirect } from "next/navigation";

export default function AdminSalonRequestsRedirectPage() {
  redirect("/admin/leads?tab=salon-requests");
}
