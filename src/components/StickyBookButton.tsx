"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function StickyBookButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="sticky-book-bar fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 md:hidden">
      <Link
        href="/book"
        className="btn-cta flex w-full items-center justify-center gap-2 shadow-lg shadow-black/20"
      >
        Book Now
      </Link>
    </div>
  );
}
