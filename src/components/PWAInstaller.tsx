"use client";

import { useEffect } from "react";

export default function PWAInstaller() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "development") {
      // Clear service workers during development to prevent HMR loops.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {
            // Unregister is best-effort; ignore races with an already-dead worker.
          });
        }
      });
      return;
    }

    // Register the production service worker (it previously never ran because
    // this component only ever unregistered workers).
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration is best-effort; offline support is a progressive enhancement.
    });
  }, []);

  return null;
}
