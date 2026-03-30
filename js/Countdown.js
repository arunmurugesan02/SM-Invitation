/* ============================================================
   Countdown.js — Reusable Countdown Timer Component
   Sudarasan & Maheswari Wedding Invitation
   ------------------------------------------------------------
   Usage:
     new Countdown('2026-05-17T18:00:00+05:30', {
       days:    '#cd-days',
       hours:   '#cd-hours',
       minutes: '#cd-mins',
       seconds: '#cd-secs',
     });

   Options (3rd argument):
     padLength  {number}   – zero-pad width        (default: 2)
     onComplete {function} – called when time is up (optional)
     flipClass  {string}   – CSS class added during flip anim
   ============================================================ */

class Countdown {

  /**
   * @param {string}   targetDate  – ISO 8601 date string (with timezone offset)
   * @param {Object}   selectors   – map of unit → CSS selector
   *                                 { days, hours, minutes, seconds }
   * @param {Object}   [options]   – optional configuration overrides
   */
  constructor(targetDate, selectors, options = {}) {

    // ── Validate target date ──────────────────────────────
    const parsed = new Date(targetDate);
    if (isNaN(parsed.getTime())) {
      console.error('[Countdown] Invalid targetDate:', targetDate);
      return;
    }

    this._target    = parsed.getTime();
    this._selectors = selectors;

    // ── Options with defaults ─────────────────────────────
    this._opts = {
      padLength:   2,
      flipClass:   'count-box--flip',
      onComplete:  null,
      tickInterval: 1000,
      ...options,
    };

    // ── Internal state ────────────────────────────────────
    this._elements   = {};   // resolved DOM elements
    this._intervalId = null;
    this._prevValues = {};   // track last value to skip no-op updates
    this._completed  = false;

    // ── Inject flip animation styles once ─────────────────
    Countdown._injectStyles();

    // ── Resolve selectors → elements ─────────────────────
    this._resolveElements();

    // ── Kick off ─────────────────────────────────────────
    this.start();
  }


  /* ──────────────────────────────────────────────────────────
     PRIVATE — resolve CSS selectors to DOM elements
     ────────────────────────────────────────────────────────── */
  _resolveElements() {
    for (const [unit, selector] of Object.entries(this._selectors)) {
      const el = document.querySelector(selector);
      if (!el) {
        console.warn(`[Countdown] Element not found for "${unit}": ${selector}`);
      }
      this._elements[unit]   = el;
      this._prevValues[unit] = null;  // force first render
    }
  }


  /* ──────────────────────────────────────────────────────────
     PRIVATE — zero-pad a number to the configured width
     ────────────────────────────────────────────────────────── */
  _pad(n) {
    return String(Math.max(0, Math.floor(n))).padStart(this._opts.padLength, '0');
  }


  /* ──────────────────────────────────────────────────────────
     PRIVATE — calculate time parts from a millisecond diff
     Returns { days, hours, minutes, seconds } as numbers.
     ────────────────────────────────────────────────────────── */
  _decompose(diff) {
    return {
      days:    Math.floor(diff / 86_400_000),
      hours:   Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000)  /    60_000),
      seconds: Math.floor((diff %    60_000)  /     1_000),
    };
  }


  /* ──────────────────────────────────────────────────────────
     PRIVATE — animate a single box when its value changes
     Uses a CSS class toggle for a brief translate + fade.
     ────────────────────────────────────────────────────────── */
  _animateFlip(el, newVal) {
    if (!el) return;

    // Skip update if value hasn't changed
    const key = el.id || el.className;
    if (this._prevValues[key] === newVal) return;
    this._prevValues[key] = newVal;

    // Phase 1 — slide up
    el.style.transition = 'none';
    el.style.transform  = 'translateY(-5px)';

    // Phase 2 — snap new value in, then slide down
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.textContent = newVal;
        el.style.transition = 'transform 0.28s ease';
        el.style.transform  = 'translateY(0)';
      });
    });
  }


  /* ──────────────────────────────────────────────────────────
     PRIVATE — main tick executed every interval
     ────────────────────────────────────────────────────────── */
  _tick() {
    const diff = this._target - Date.now();

    // ── Countdown finished ──────────────────────────────
    if (diff <= 0) {
      this._renderAll({ days: 0, hours: 0, minutes: 0, seconds: 0 });

      if (!this._completed) {
        this._completed = true;
        this.stop();

        if (typeof this._opts.onComplete === 'function') {
          this._opts.onComplete();
        }
      }
      return;
    }

    // ── Active countdown ────────────────────────────────
    const parts = this._decompose(diff);
    this._renderAll(parts);
  }


  /* ──────────────────────────────────────────────────────────
     PRIVATE — push all unit values to the DOM
     ────────────────────────────────────────────────────────── */
  _renderAll(parts) {
    for (const [unit, el] of Object.entries(this._elements)) {
      if (!el) continue;
      const padded = this._pad(parts[unit] ?? 0);
      this._animateFlip(el, padded);
    }
  }


  /* ──────────────────────────────────────────────────────────
     PUBLIC API
     ────────────────────────────────────────────────────────── */

  /** Start (or restart) the countdown. */
  start() {
    if (this._intervalId) this.stop();

    // Render immediately before the first interval fires
    this._tick();

    this._intervalId = setInterval(
      () => this._tick(),
      this._opts.tickInterval
    );
  }

  /** Pause the countdown without resetting it. */
  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  /** Completely destroy the instance and clean up. */
  destroy() {
    this.stop();
    this._elements   = {};
    this._prevValues = {};
  }

  /**
   * Change the target date at runtime.
   * @param {string} newDateString – ISO 8601 date string
   */
  setTarget(newDateString) {
    const parsed = new Date(newDateString);
    if (isNaN(parsed.getTime())) {
      console.error('[Countdown] Invalid date passed to setTarget:', newDateString);
      return;
    }
    this._target    = parsed.getTime();
    this._completed = false;
    this.start();   // restart with new target
  }

  /**
   * Returns remaining time as a plain object.
   * @returns {{ days:number, hours:number, minutes:number, seconds:number, total:number }}
   */
  getRemaining() {
    const diff = Math.max(0, this._target - Date.now());
    return { ...this._decompose(diff), total: diff };
  }


  /* ──────────────────────────────────────────────────────────
     STATIC — inject required CSS once per page load
     ────────────────────────────────────────────────────────── */
  static _injectStyles() {
    if (document.getElementById('_countdown-styles')) return;

    const style = document.createElement('style');
    style.id    = '_countdown-styles';
    style.textContent = `
      .count-box {
        will-change: transform, opacity;
      }
    `;
    document.head.appendChild(style);
  }
}
