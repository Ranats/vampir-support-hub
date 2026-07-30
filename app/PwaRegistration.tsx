"use client";

import { useEffect } from "react";

export default function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let active = true;
    const register = async () => {
      try {
        if (active) await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // The app remains fully usable when registration is unavailable.
      }
    };

    if (document.readyState === "complete") {
      void register();
      return () => {
        active = false;
      };
    }

    window.addEventListener("load", register, { once: true });
    return () => {
      active = false;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
