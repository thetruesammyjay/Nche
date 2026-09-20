"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function RouteLoadingOverlay() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const startedAt = pendingStartedAtRef.current;
    if (startedAt === null) {
      setPending(false);
      return;
    }

    const clearPending = () => {
      pendingStartedAtRef.current = null;
      setPending(false);
    };
    const remaining = Math.max(0, 260 - (Date.now() - startedAt));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(clearPending, remaining);
  }, [pathname]);

  useEffect(() => {
    function startLoading() {
      pendingStartedAtRef.current = Date.now();
      setPending(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        pendingStartedAtRef.current = null;
        setPending(false);
      }, 3500);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (destination.origin !== current.origin || destination.pathname === current.pathname && destination.search === current.search && destination.hash) return;
      if (destination.pathname === current.pathname && destination.search === current.search) return;

      startLoading();
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("nche:route-start", startLoading);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("nche:route-start", startLoading);
    };
  }, [pathname]);

  if (!pending) return null;

  return (
    <div className="route-loading-overlay" role="status" aria-live="polite" aria-label="Loading next page">
      <span className="route-loading-spinner" aria-hidden="true" />
      <span><strong>Loading Nche</strong><small>Preparing the next view</small></span>
    </div>
  );
}
