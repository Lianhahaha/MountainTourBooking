import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-panel flex min-h-screen flex-col bg-background md:flex-row">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 md:px-6 md:py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-muted transition hover:text-accent"
            >
              ← View website
            </Link>
            <span className="hidden text-border sm:inline">|</span>
            <p className="hidden text-sm text-muted sm:block">Owner dashboard</p>
          </div>
          <AdminLogoutButton />
        </header>
        <main className="flex-1 p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
