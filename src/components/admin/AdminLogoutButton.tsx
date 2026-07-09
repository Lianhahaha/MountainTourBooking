"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-md border border-border px-3 py-1.5 text-sm text-muted transition hover:border-muted hover:bg-surface-elevated hover:text-foreground"
    >
      Log out
    </button>
  );
}
