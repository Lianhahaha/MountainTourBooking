"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function OwnerNavLink({ mobile = false }: { mobile?: boolean }) {
  const [isOwner, setIsOwner] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => setIsOwner(Boolean(data.authenticated)))
      .catch(() => setIsOwner(false))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <span className={mobile ? "block rounded-md px-4 py-3 text-base font-medium text-muted opacity-50" : "hidden text-sm md:inline"}>
        Login
      </span>
    );
  }

  if (isOwner) {
    return (
      <Link
        href="/admin"
        className={
          mobile
            ? "block rounded-md px-4 py-3 text-base font-medium text-accent transition-colors hover:bg-muted/10 active:bg-muted/20"
            : "text-sm font-medium text-accent transition hover:text-accent-hover"
        }
      >
        Dashboard
      </Link>
    );
  }

  return (
    <Link
      href="/admin/login"
      className={
        mobile
          ? "block rounded-md px-4 py-3 text-base font-medium text-muted transition-colors hover:bg-muted/10 hover:text-accent active:bg-muted/20"
          : "text-sm font-medium text-muted transition hover:text-accent"
      }
    >
      Login
    </Link>
  );
}
