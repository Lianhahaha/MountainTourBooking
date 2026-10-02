"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Visitors never see a login link in the main nav (it lives in the footer);
// a signed-in owner gets a shortcut back to the dashboard.
export function OwnerNavLink({ mobile = false }: { mobile?: boolean }) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => setIsOwner(Boolean(data.authenticated)))
      .catch(() => setIsOwner(false));
  }, []);

  if (!isOwner) return null;

  return (
    <Link
      href="/admin"
      className={
        mobile
          ? "flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium text-accent transition-colors hover:bg-surface"
          : "rounded-md px-2 py-1.5 text-[13px] font-medium text-accent transition-colors hover:text-accent-hover"
      }
    >
      Dashboard
    </Link>
  );
}
