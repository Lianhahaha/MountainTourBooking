"use client";

import { useState } from "react";

export function AdminLogoutButton() {
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
    } finally {
      // A full navigation clears the client router cache, so a shared device
      // cannot press Back into a signed-in dashboard.
      window.location.assign("/admin/login");
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={busy}
      className="rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-60"
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
