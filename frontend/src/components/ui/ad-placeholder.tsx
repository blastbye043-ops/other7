import { useEffect, useRef, useState, useId } from "react";
import { cn } from "@/lib/utils";
import { adRefreshManager } from "@/lib/ad-refresh-manager";

export interface AdPlaceholderProps {
  /**
   * Stable DOM id for the ad container.
   * Used to target the slot with AdSense and by the refresh manager.
   */
  id: string;

  /** Ad unit type — controls default dimensions and layout hints. */
  type?: "banner" | "sidebar" | "responsive";

  /** Minimum reserved height on desktop viewports (px). Prevents CLS. */
  desktopHeight?: number;

  /** Minimum reserved height on mobile viewports (px). Prevents CLS. */
  mobileHeight?: number;

  /** Render this slot on desktop (≥768px) viewports. */
  showOnDesktop?: boolean;

  /** Render this slot on mobile (<768px) viewports. */
  showOnMobile?: boolean;

  /**
   * Show the visual dev placeholder label instead of a real ad.
   * Set to false and provide adClient + adSlot for production AdSense.
   */
  showPlaceholder?: boolean;

  /**
   * Google AdSense publisher ID (e.g. "ca-pub-XXXXXXXXXXXXXXXX").
   * Required for real ads (showPlaceholder=false).
   */
  adClient?: string;

  /**
   * Google AdSense ad-slot ID (e.g. "1234567890").
   * Required for real ads (showPlaceholder=false).
   */
  adSlot?: string;

  /**
   * AdSense ad-format. Defaults to "auto".
   * Use "autorelaxed" for in-article placements.
   */
  adFormat?: string;

  /**
   * Whether the ad should be full-width responsive.
   * Defaults to true.
   */
  fullWidthResponsive?: boolean;

  /** Extra class names forwarded to the outer container. */
  className?: string;
}

/**
 * AdPlaceholder — production-ready Google AdSense slot container.
 *
 * Features:
 * - CLS prevention: always reserves its minimum height so no layout shift
 *   occurs when the ad loads or is toggled.
 * - Lazy loading: the <ins> element is only initialised (adsbygoogle.push)
 *   when the container enters the viewport (IntersectionObserver).
 * - Empty ad hiding: if AdSense returns no ad (data-ad-status="unfilled"),
 *   the outer container collapses to avoid blank white space.
 * - Policy-compliant refresh: slots with adClient + adSlot are registered
 *   with AdRefreshManager for staggered, visibility-gated refresh.
 * - Accessibility: role="complementary" + aria-label + tabIndex={-1} so
 *   keyboard navigation skips empty slots.
 *
 * Dev mode (showPlaceholder=true):
 *   Renders a styled placeholder label — no network requests.
 *
 * Production mode (showPlaceholder=false, adClient, adSlot provided):
 *   Renders a real <ins class="adsbygoogle"> and lazy-initialises it.
 */
export function AdPlaceholder({
  id,
  type = "banner",
  desktopHeight,
  mobileHeight,
  showOnDesktop = true,
  showOnMobile = true,
  showPlaceholder = true,
  adClient,
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  className,
}: AdPlaceholderProps) {
  const isSidebar = type === "sidebar";
  const dHeight = desktopHeight ?? (isSidebar ? 600 : 90);
  const mHeight = mobileHeight ?? (isSidebar ? 600 : 100);
  const reservedHeight = Math.max(mHeight, dHeight);

  const containerRef = useRef<HTMLElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adEmpty, setAdEmpty] = useState(false);
  // Track whether we've already pushed to adsbygoogle for this slot
  const pushed = useRef(false);

  const isRealAd = !showPlaceholder && Boolean(adClient) && Boolean(adSlot);

  // Lazy-load: observe the container and push adsbygoogle when visible.
  useEffect(() => {
    if (!isRealAd || !insRef.current) return;

    const ins = insRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (pushed.current) return;
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        // Slot entered viewport — initialise AdSense.
        pushed.current = true;
        observer.disconnect();

        try {
          const w = window as Window & { adsbygoogle?: unknown[] };
          w.adsbygoogle = w.adsbygoogle ?? [];
          (w.adsbygoogle as { push: (o: object) => void }).push({});
          setAdLoaded(true);
        } catch {
          // adsbygoogle not available yet — will be retried on refresh.
        }
      },
      { rootMargin: "200px", threshold: 0 } // pre-load 200px before entering
    );

    observer.observe(ins);
    return () => observer.disconnect();
  }, [isRealAd]);

  // Watch data-ad-status on the <ins> to detect unfilled slots.
  useEffect(() => {
    if (!isRealAd || !insRef.current) return;
    const ins = insRef.current;

    const mutationObs = new MutationObserver(() => {
      const status = ins.getAttribute("data-ad-status");
      if (status === "unfilled") {
        setAdEmpty(true);
      } else if (status === "filled") {
        setAdEmpty(false);
        setAdLoaded(true);
      }
    });

    mutationObs.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status", "data-adsbygoogle-status"],
    });

    return () => mutationObs.disconnect();
  }, [isRealAd]);

  // Register/unregister with the refresh manager.
  useEffect(() => {
    if (!isRealAd || !adClient || !adSlot) return;

    adRefreshManager.init();
    adRefreshManager.register(id, adClient, adSlot);
    return () => adRefreshManager.unregister(id);
  }, [isRealAd, id, adClient, adSlot]);

  // Visibility class based on show flags.
  const visibilityClass = cn(
    !showOnDesktop && !showOnMobile && "hidden",
    !showOnMobile && showOnDesktop && "hidden md:block",
    showOnMobile && !showOnDesktop && "md:hidden",
    showOnMobile && showOnDesktop && "block",
  );

  return (
    <aside
      ref={containerRef}
      id={id}
      role="complementary"
      aria-label="Advertisement"
      tabIndex={-1}
      data-ad-slot={id}
      data-ad-type={type}
      className={cn(
        visibilityClass || "block",
        "w-full overflow-hidden outline-none",
        isSidebar && "max-w-[300px]",
        className,
      )}
      // When the slot is unfilled, collapse height to zero so it disappears
      // without causing CLS — reserved space is released smoothly.
      // Space is always reserved (minHeight) until AdSense confirms "unfilled".
      style={{ minHeight: adEmpty ? 0 : `${reservedHeight}px`, overflow: "hidden" }}
    >
      {showPlaceholder ? (
        /* ── Dev placeholder ── */
        <div
          className="flex flex-col items-center justify-center w-full rounded-2xl border border-dashed border-white/[0.12] bg-[#18181b] text-muted-foreground/40 select-none pointer-events-none"
          aria-hidden="true"
          style={{
            height: `${dHeight}px`,
            width: isSidebar ? "300px" : "100%",
          }}
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase opacity-60">
            Advertisement
          </p>
          <p className="text-[10px] opacity-40 mt-0.5">
            Responsive Ad Space · Google AdSense Ready
          </p>
        </div>
      ) : (
        /* ── Production AdSense slot ──
         * The <ins> is always rendered so the refresh manager can find it.
         * adsbygoogle.push is deferred until the slot enters the viewport.
         */
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{
            display: "block",
            width: "100%",
            minHeight: `${mHeight}px`,
            // Hide the ins until AdSense fills it to avoid flashing empty space.
            visibility: adLoaded ? "visible" : "hidden",
          }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
        />
      )}
    </aside>
  );
}
