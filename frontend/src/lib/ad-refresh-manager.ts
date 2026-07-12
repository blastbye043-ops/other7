/**
 * AdRefreshManager — AdSense-policy-compliant ad refresh controller.
 *
 * Policy rules enforced:
 * - Minimum 30-second interval between refreshes per slot.
 * - Only refreshes while the browser tab is visible.
 * - Only refreshes a slot when it is ≥50% visible in the viewport.
 * - Only refreshes when the user has been active within ACTIVITY_TIMEOUT_MS.
 * - Randomises delay by ±JITTER_MS so slots don't all refresh at once.
 * - Destroys the previous ad instance before requesting a new one.
 * - Pauses all timers on tab blur; resumes on tab focus.
 */

const MIN_INTERVAL_MS = 30_000;       // 30 s — AdSense minimum allowed refresh
const JITTER_MS = 8_000;              // 0–8 s additive jitter (never subtracts — hard floor stays ≥30 s)
const ACTIVITY_TIMEOUT_MS = 60_000;  // user considered "active" within last 60 s

interface SlotRecord {
  slotId: string;
  adClient: string;
  adSlot: string;
  lastRefreshed: number;
  visible: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "scroll",
  "click",
  "touchstart",
] as const;

class AdRefreshManager {
  private slots = new Map<string, SlotRecord>();
  private lastActivity = Date.now();
  private tabVisible = typeof document !== "undefined" ? !document.hidden : true;
  private intersectionObserver: IntersectionObserver | null = null;
  private initialized = false;

  /** Call once on app mount. Idempotent. */
  init(): void {
    if (this.initialized || typeof document === "undefined") return;
    this.initialized = true;

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, this.handleActivity, { passive: true })
    );

    this.intersectionObserver = new IntersectionObserver(
      this.handleIntersection,
      { threshold: 0.5 }
    );
  }

  /** Clean up all listeners, timers, and observations. */
  destroy(): void {
    if (!this.initialized) return;
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    ACTIVITY_EVENTS.forEach((ev) =>
      window.removeEventListener(ev, this.handleActivity)
    );
    this.intersectionObserver?.disconnect();
    this.slots.forEach(({ timer }) => { if (timer) clearTimeout(timer); });
    this.slots.clear();
    this.initialized = false;
  }

  /** Register a slot for refresh tracking. */
  register(slotId: string, adClient: string, adSlot: string): void {
    if (this.slots.has(slotId)) return;

    const record: SlotRecord = {
      slotId,
      adClient,
      adSlot,
      lastRefreshed: Date.now(),
      visible: false,
      timer: null,
    };
    this.slots.set(slotId, record);

    const el = document.getElementById(slotId);
    if (el) this.intersectionObserver?.observe(el);
  }

  /** Unregister a slot (call on component unmount). */
  unregister(slotId: string): void {
    const record = this.slots.get(slotId);
    if (!record) return;
    if (record.timer) clearTimeout(record.timer);
    const el = document.getElementById(slotId);
    if (el) this.intersectionObserver?.unobserve(el);
    this.slots.delete(slotId);
  }

  // ── Private handlers ──────────────────────────────────────────────────────

  private handleVisibilityChange = (): void => {
    this.tabVisible = !document.hidden;

    if (this.tabVisible) {
      // Resume scheduling for slots that are already visible in the viewport.
      this.slots.forEach((record) => {
        if (record.visible && record.timer === null) {
          this.scheduleRefresh(record);
        }
      });
    } else {
      // Pause all pending refresh timers.
      this.slots.forEach((record) => {
        if (record.timer) {
          clearTimeout(record.timer);
          record.timer = null;
        }
      });
    }
  };

  private handleActivity = (): void => {
    this.lastActivity = Date.now();
  };

  private handleIntersection = (entries: IntersectionObserverEntry[]): void => {
    entries.forEach((entry) => {
      const record = this.slots.get(entry.target.id);
      if (!record) return;

      const wasVisible = record.visible;
      record.visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;

      if (record.visible && !wasVisible) {
        // Slot just entered viewport — start scheduling.
        if (record.timer === null) this.scheduleRefresh(record);
      } else if (!record.visible && wasVisible) {
        // Slot left viewport — cancel pending timer.
        if (record.timer) {
          clearTimeout(record.timer);
          record.timer = null;
        }
      }
    });
  };

  // ── Refresh logic ─────────────────────────────────────────────────────────

  private scheduleRefresh(record: SlotRecord): void {
    if (record.timer !== null) return; // already scheduled

    const elapsed = Date.now() - record.lastRefreshed;
    // Hard floor: always wait the full MIN_INTERVAL_MS from last refresh,
    // then add additive-only jitter so we never fire before 30 s.
    const remaining = Math.max(0, MIN_INTERVAL_MS - elapsed);
    const jitter = Math.floor(Math.random() * JITTER_MS); // 0 to JITTER_MS — never negative
    const delay = remaining + jitter;

    record.timer = setTimeout(() => {
      record.timer = null;
      this.tryRefresh(record);
    }, delay);
  }

  private isUserActive(): boolean {
    return Date.now() - this.lastActivity < ACTIVITY_TIMEOUT_MS;
  }

  private tryRefresh(record: SlotRecord): void {
    // Re-check all conditions at execution time (they may have changed).
    if (!this.tabVisible || !record.visible || !this.isUserActive()) return;

    this.refreshSlot(record);

    // Schedule the next refresh cycle if the slot is still visible.
    if (record.visible) this.scheduleRefresh(record);
  }

  private refreshSlot(record: SlotRecord): void {
    const container = document.getElementById(record.slotId);
    if (!container) return;

    const ins = container.querySelector<HTMLElement>("ins.adsbygoogle");
    if (!ins) return;

    // Destroy previous ad instance.
    try {
      ins.removeAttribute("data-adsbygoogle-status");
      ins.removeAttribute("data-ad-status");
      ins.innerHTML = "";
    } catch {
      // Ignore DOM errors.
    }

    // Request a new ad fill.
    try {
      const w = window as Window & { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle ?? [];
      (w.adsbygoogle as { push: (o: object) => void }).push({});
      record.lastRefreshed = Date.now();
    } catch {
      // Ignore adsbygoogle errors.
    }
  }
}

/** Singleton — import and use anywhere in the app. */
export const adRefreshManager = new AdRefreshManager();
