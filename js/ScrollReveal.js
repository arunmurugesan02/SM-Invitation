/* ============================================================
   ScrollReveal.js — Reusable Scroll-Triggered Reveal
   Sudarasan & Maheswari Wedding Invitation

   Usage:
     const sr = new ScrollReveal('.reveal', {
       threshold:   0.12,
       rootMargin:  '0px 0px -40px 0px',
       visibleClass: 'visible',
       delayStep:    0.1,   // seconds per delay unit
     });

   HTML:
     <div class="reveal">…</div>
     <div class="reveal left" data-reveal-delay="2">…</div>
     <div class="reveal right reveal-delay-3">…</div>

   CSS expected:
     .reveal          { opacity: 0; transform: translateY(40px); transition: … }
     .reveal.left     { transform: translateX(-40px); }
     .reveal.right    { transform: translateX( 40px); }
     .reveal.scale    { transform: scale(0.92); }
     .reveal.fade     { transform: none; }
     .reveal.visible  { opacity: 1; transform: none; }
   ============================================================ */

class ScrollReveal {
  /**
   * @param {string}  selector    — CSS selector for elements to observe
   * @param {object}  options     — Optional configuration overrides
   */
  constructor(selector = '.reveal', options = {}) {
    this.selector = selector;

    this.options = Object.assign(
      {
        threshold:    0.12,           // % of element visible before triggering
        rootMargin:   '0px 0px -40px 0px', // shrink bottom of viewport
        visibleClass: 'visible',      // class added when element enters view
        delayStep:    0.10,           // seconds added per data-reveal-delay unit
        maxDelay:     1.0,            // cap on auto-computed transition-delay (s)
        once:         true,           // unobserve after first reveal
      },
      options
    );

    /** @type {IntersectionObserver|null} */
    this._observer = null;

    this._init();
  }

  /* ── Private ────────────────────────────────────────────── */

  /**
   * Build IntersectionObserver and start observing existing elements.
   */
  _init() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything immediately for unsupported browsers
      this._revealAll();
      return;
    }

    this._observer = new IntersectionObserver(
      this._onIntersect.bind(this),
      {
        threshold:  this.options.threshold,
        rootMargin: this.options.rootMargin,
      }
    );

    this._applyDelays();
    this.observe();
  }

  /**
   * IntersectionObserver callback.
   * @param {IntersectionObserverEntry[]} entries
   */
  _onIntersect(entries) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add(this.options.visibleClass);

      if (this.options.once) {
        this._observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Read `data-reveal-delay` attribute on each element and apply
   * an inline `transition-delay` so stagger works without extra classes.
   *
   * Priority order:
   *   1. data-reveal-delay="3"  → delay = 3 × delayStep
   *   2. CSS class reveal-delay-N is handled purely in CSS
   */
  _applyDelays() {
    document.querySelectorAll(this.selector).forEach(el => {
      const raw = el.dataset.revealDelay;
      if (raw === undefined) return;

      const units = parseFloat(raw);
      if (isNaN(units)) return;

      const delay = Math.min(units * this.options.delayStep, this.options.maxDelay);

      // Only set inline delay if no CSS delay class is already present
      const hasDelayClass = [...el.classList].some(c => /^reveal-delay-/.test(c));
      if (!hasDelayClass) {
        el.style.transitionDelay = `${delay}s`;
      }
    });
  }

  /**
   * Immediately reveal all matched elements (no-observer fallback).
   */
  _revealAll() {
    document.querySelectorAll(this.selector).forEach(el => {
      el.classList.add(this.options.visibleClass);
    });
  }

  /* ── Public API ─────────────────────────────────────────── */

  /**
   * Observe all matching elements within a given scope.
   * Call this again after dynamically adding elements to the DOM.
   *
   * @param {Document|Element} scope — root to query inside (default: document)
   */
  observe(scope = document) {
    if (!this._observer) return;

    scope.querySelectorAll(this.selector).forEach(el => {
      // Skip elements already revealed
      if (el.classList.contains(this.options.visibleClass)) return;
      this._observer.observe(el);
    });
  }

  /**
   * Stop observing all elements and disconnect the observer.
   */
  disconnect() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  /**
   * Hide all revealed elements and re-observe them.
   * Useful for page transitions or re-running animations.
   */
  reset() {
    document.querySelectorAll(this.selector).forEach(el => {
      el.classList.remove(this.options.visibleClass);
    });
    this.observe();
  }

  /**
   * Re-apply delays and observe any newly added elements.
   * Convenience wrapper to call after dynamic DOM insertion.
   */
  refresh() {
    this._applyDelays();
    this.observe();
  }
}
