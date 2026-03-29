/* ============================================================
   Effects.js — Reusable UI Effect Utilities
   Sudarasan & Maheswari Wedding Invitation
   ------------------------------------------------------------
   A singleton object exposing independent, configurable effects
   that can be applied to any element or selector.

   Available methods:
     Effects.ripple(elements, options)
     Effects.cursorGlow(options)
     Effects.parallax(selector, factor, options)
     Effects.navScroll(navSelector, activeClass, threshold)
     Effects.tiltCard(elements, options)
     Effects.typeWriter(element, text, options)
   ============================================================ */

const Effects = (() => {

  /* ──────────────────────────────────────────────────────────
     PRIVATE HELPERS
     ────────────────────────────────────────────────────────── */

  /** Inject a <style> block once, keyed by id. */
  function _injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const style   = document.createElement('style');
    style.id      = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /** Resolve a value that may be a selector string or NodeList/Array. */
  function _resolveElements(target) {
    if (typeof target === 'string') {
      return Array.from(document.querySelectorAll(target));
    }
    if (target instanceof NodeList || Array.isArray(target)) {
      return Array.from(target);
    }
    if (target instanceof Element) {
      return [target];
    }
    return [];
  }

  /** Clamp a value between min and max. */
  function _clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }


  /* ══════════════════════════════════════════════════════════
     1. RIPPLE
     Adds a Material-style radial ripple on click.

     Usage:
       Effects.ripple('.card, .btn');
       Effects.ripple(document.querySelectorAll('[data-ripple]'), {
         color:    'rgba(212,175,55,0.18)',
         duration: '0.65s',
       });

     Options:
       color     {string}  — ripple fill colour   (default: rgba(212,175,55,0.15))
       duration  {string}  — CSS animation time   (default: '0.6s')
       scale     {number}  — final scale factor   (default: 2.8)
     ══════════════════════════════════════════════════════════ */
  function ripple(target, options = {}) {
    const opts = {
      color:    'rgba(212,175,55,0.15)',
      duration: '0.6s',
      scale:    2.8,
      ...options,
    };

    /* Inject keyframe once */
    _injectStyle('_fx-ripple', `
      @keyframes _fxRipple {
        to { transform: scale(${opts.scale}); opacity: 0; }
      }
    `);

    const elements = _resolveElements(target);

    elements.forEach(el => {
      /* Ensure positioning context */
      const pos = window.getComputedStyle(el).position;
      if (pos === 'static') el.style.position = 'relative';
      el.style.overflow = 'hidden';

      el.addEventListener('pointerdown', function handleRipple(e) {
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x    = e.clientX - rect.left  - size / 2;
        const y    = e.clientY - rect.top   - size / 2;

        const dot = document.createElement('span');
        dot.style.cssText = [
          'position:absolute',
          'border-radius:50%',
          'pointer-events:none',
          `width:${size}px`,
          `height:${size}px`,
          `left:${x}px`,
          `top:${y}px`,
          `background:${opts.color}`,
          'transform:scale(0)',
          'opacity:1',
          `animation:_fxRipple ${opts.duration} ease-out forwards`,
        ].join(';');

        el.appendChild(dot);
        dot.addEventListener('animationend', () => dot.remove(), { once: true });
      });
    });

    return { destroy() { /* listeners are per-element closures; call removeEventListener manually if needed */ } };
  }


  /* ══════════════════════════════════════════════════════════
     2. CURSOR GLOW
     A soft radial gradient div that trails the mouse cursor.

     Usage:
       Effects.cursorGlow();
       Effects.cursorGlow({
         size:        350,
         color:       'rgba(212,175,55,0.05)',
         lag:         120,   // transition ms
         zIndex:      0,
       });

     Returns: { el, destroy }
     ══════════════════════════════════════════════════════════ */
  function cursorGlow(options = {}) {
    const opts = {
      size:    300,
      color:   'rgba(212,175,55,0.05)',
      lag:     130,
      zIndex:  0,
      ...options,
    };

    const el = document.createElement('div');
    el.id    = '_fx-cursor-glow';
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = [
      'position:fixed',
      `width:${opts.size}px`,
      `height:${opts.size}px`,
      'border-radius:50%',
      'pointer-events:none',
      `z-index:${opts.zIndex}`,
      `background:radial-gradient(circle, ${opts.color} 0%, transparent 68%)`,
      'transform:translate(-50%,-50%)',
      `transition:left ${opts.lag}ms ease,top ${opts.lag}ms ease`,
      'top:-200px',
      'left:-200px',
      'will-change:left,top',
    ].join(';');

    document.body.appendChild(el);

    let rafId = null;
    let mouseX = -200, mouseY = -200;

    function onMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          el.style.left = mouseX + 'px';
          el.style.top  = mouseY + 'px';
          rafId = null;
        });
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true });

    /* Hide when cursor leaves the window */
    document.addEventListener('mouseleave', () => {
      el.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      el.style.opacity = '1';
    });

    return {
      el,
      destroy() {
        window.removeEventListener('mousemove', onMove);
        if (rafId) cancelAnimationFrame(rafId);
        el.remove();
      },
    };
  }


  /* ══════════════════════════════════════════════════════════
     3. PARALLAX
     Translates an element on the Y axis as the user scrolls.
     Supports clamping to a section boundary so it only moves
     while its parent section is in view.

     Usage:
       Effects.parallax('.hero-photo', 0.15);
       Effects.parallax('.hero-photo', 0.15, {
         axis:       'y',       // 'x' | 'y' (default: 'y')
         clampToSection: true,  // only move while section is visible
         scaleLock: true,       // keep scale(1) to avoid layout shift
       });

     Returns: { destroy }
     ══════════════════════════════════════════════════════════ */
  function parallax(selector, factor = 0.15, options = {}) {
    const opts = {
      axis:           'y',
      clampToSection: false,
      scaleLock:      true,
      ...options,
    };

    const el = (typeof selector === 'string')
      ? document.querySelector(selector)
      : selector;

    if (!el) {
      console.warn('[Effects.parallax] Element not found:', selector);
      return { destroy() {} };
    }

    /* Prefer the closest <section> ancestor as boundary */
    const section = opts.clampToSection
      ? (el.closest('section') || null)
      : null;

    let rafId = null;

    function onScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;

        const scrollY = window.scrollY;

        /* If clampToSection, only run while section overlaps viewport */
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        } else {
          /* Simple clamp: only while element is near top of page */
          if (scrollY >= window.innerHeight * 1.5) return;
        }

        const offset = section
          ? scrollY - section.offsetTop
          : scrollY;

        const translateVal = (offset * factor).toFixed(2);

        if (opts.axis === 'y') {
          el.style.transform = `translateY(${translateVal}px)`;
        } else {
          el.style.transform = `translateX(${translateVal}px)`;
        }
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    return {
      destroy() {
        window.removeEventListener('scroll', onScroll);
        if (rafId) cancelAnimationFrame(rafId);
        el.style.transform = '';
      },
    };
  }


  /* ══════════════════════════════════════════════════════════
     4. NAV SCROLL
     Toggles an "active" class on a nav element once the page
     scrolls past a given threshold. Used for frosted-glass nav.

     Usage:
       Effects.navScroll('#main-nav', 'scrolled', 60);
       Effects.navScroll('.nav', 'nav--scrolled');

     Returns: { destroy }
     ══════════════════════════════════════════════════════════ */
  function navScroll(navSelector = 'nav', activeClass = 'scrolled', threshold = 60) {
    const nav = (typeof navSelector === 'string')
      ? document.querySelector(navSelector)
      : navSelector;

    if (!nav) {
      console.warn('[Effects.navScroll] Nav element not found:', navSelector);
      return { destroy() {} };
    }

    let rafId = null;
    let lastState = null;

    function onScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const shouldActive = window.scrollY > threshold;
        if (shouldActive === lastState) return; // no change, skip DOM write
        lastState = shouldActive;
        nav.classList.toggle(activeClass, shouldActive);
      });
    }

    /* Set correct state on load (e.g. user refreshed mid-page) */
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });

    return {
      destroy() {
        window.removeEventListener('scroll', onScroll);
        if (rafId) cancelAnimationFrame(rafId);
        nav.classList.remove(activeClass);
      },
    };
  }


  /* ══════════════════════════════════════════════════════════
     5. TILT CARD
     Subtle 3-D perspective tilt following the mouse over a card.

     Usage:
       Effects.tiltCard('.detail-card');
       Effects.tiltCard(document.querySelectorAll('.family__parent-card'), {
         maxTilt:  12,   // degrees
         scale:    1.03,
         glare:    true,
       });

     Returns: { destroy }
     ══════════════════════════════════════════════════════════ */
  function tiltCard(target, options = {}) {
    const opts = {
      maxTilt:  10,
      scale:    1.02,
      glare:    false,
      speed:    400,    // transition ms for reset
      ...options,
    };

    const elements = _resolveElements(target);

    const cleanup = [];

    elements.forEach(el => {
      el.style.transition       = `transform ${opts.speed}ms ease`;
      el.style.transformStyle   = 'preserve-3d';
      el.style.willChange       = 'transform';

      /* Optional glare overlay */
      let glareEl = null;
      if (opts.glare) {
        glareEl = document.createElement('div');
        glareEl.setAttribute('aria-hidden', 'true');
        glareEl.style.cssText = [
          'position:absolute', 'inset:0', 'border-radius:inherit',
          'pointer-events:none', 'opacity:0',
          'background:linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
          'transition:opacity 0.3s ease',
        ].join(';');
        const pos = window.getComputedStyle(el).position;
        if (pos === 'static') el.style.position = 'relative';
        el.appendChild(glareEl);
      }

      function onEnter() {
        el.style.transition = 'transform 0.1s ease';
      }

      function onMove(e) {
        const rect   = el.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = e.clientX - cx;
        const dy     = e.clientY - cy;
        const halfW  = rect.width  / 2;
        const halfH  = rect.height / 2;
        const tiltX  = _clamp(-dy / halfH * opts.maxTilt, -opts.maxTilt, opts.maxTilt);
        const tiltY  = _clamp( dx / halfW * opts.maxTilt, -opts.maxTilt, opts.maxTilt);

        el.style.transform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${opts.scale})`;

        if (glareEl) {
          const pct = (dx / halfW + 1) / 2 * 100;
          glareEl.style.opacity = '1';
          glareEl.style.backgroundImage =
            `linear-gradient(${pct}deg, rgba(255,255,255,0.12) 0%, transparent 60%)`;
        }
      }

      function onLeave() {
        el.style.transition = `transform ${opts.speed}ms ease`;
        el.style.transform  = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)';
        if (glareEl) glareEl.style.opacity = '0';
      }

      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mousemove',  onMove);
      el.addEventListener('mouseleave', onLeave);

      cleanup.push(() => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mousemove',  onMove);
        el.removeEventListener('mouseleave', onLeave);
        el.style.transform    = '';
        el.style.transition   = '';
        el.style.willChange   = '';
        if (glareEl) glareEl.remove();
      });
    });

    return {
      destroy() { cleanup.forEach(fn => fn()); },
    };
  }


  /* ══════════════════════════════════════════════════════════
     6. TYPEWRITER
     Types text into an element character by character, then
     optionally loops or calls a completion callback.

     Usage:
       Effects.typeWriter('#tagline', 'Wedding Reception', {
         speed:    60,      // ms per character
         cursor:   true,    // show blinking cursor
         loop:     false,
         onDone:   () => console.log('done'),
       });

     Returns: { destroy }
     ══════════════════════════════════════════════════════════ */
  function typeWriter(selector, text, options = {}) {
    const opts = {
      speed:      65,
      deleteSpeed: 40,
      pauseEnd:   1800,
      cursor:     true,
      loop:       false,
      onDone:     null,
      ...options,
    };

    const el = (typeof selector === 'string')
      ? document.querySelector(selector)
      : selector;

    if (!el) {
      console.warn('[Effects.typeWriter] Element not found:', selector);
      return { destroy() {} };
    }

    /* Cursor element */
    let cursorEl = null;
    if (opts.cursor) {
      _injectStyle('_fx-cursor', `
        ._fx-cursor {
          display: inline-block;
          width: 2px;
          background: currentColor;
          margin-left: 2px;
          vertical-align: middle;
          height: 1em;
          animation: _fxBlink 1s step-end infinite;
        }
        @keyframes _fxBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `);
      cursorEl = document.createElement('span');
      cursorEl.className = '_fx-cursor';
      cursorEl.setAttribute('aria-hidden', 'true');
    }

    el.textContent = '';
    if (cursorEl) el.appendChild(cursorEl);

    let index     = 0;
    let timeoutId = null;
    let destroyed = false;

    function type() {
      if (destroyed) return;
      if (index < text.length) {
        /* Insert character before cursor */
        const char = document.createTextNode(text[index]);
        el.insertBefore(char, cursorEl);
        index++;
        timeoutId = setTimeout(type, opts.speed);
      } else {
        /* Finished typing */
        if (typeof opts.onDone === 'function') opts.onDone();

        if (opts.loop) {
          /* Delete then retype */
          timeoutId = setTimeout(deleteAll, opts.pauseEnd);
        }
      }
    }

    function deleteAll() {
      if (destroyed) return;
      const firstText = el.firstChild;
      if (firstText && firstText !== cursorEl) {
        el.removeChild(firstText);
        timeoutId = setTimeout(deleteAll, opts.deleteSpeed);
      } else {
        /* All deleted — restart */
        index = 0;
        timeoutId = setTimeout(type, 400);
      }
    }

    timeoutId = setTimeout(type, 300);

    return {
      destroy() {
        destroyed = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (cursorEl)  cursorEl.remove();
      },
    };
  }


  /* ══════════════════════════════════════════════════════════
     PUBLIC SURFACE
     ══════════════════════════════════════════════════════════ */
  return Object.freeze({
    ripple,
    cursorGlow,
    parallax,
    navScroll,
    tiltCard,
    typeWriter,
    magnetic,
    sparkleTrail,
  });

  /* ══════════════════════════════════════════════════════════
     8. SPARKLE TRAIL — Mouse trail effect
     Creates tiny, fading star/sparkle elements following the cursor.
     ══════════════════════════════════════════════════════════ */
  function sparkleTrail(options = {}) {
    const opts = {
      symbols:   ['✨', '✦', '💍', '❤️', '✿'],
      frequency: 4,      // higher = more sparkles (1 spark per N pixels)
      duration:  1.2,    // fade out time
      ...options
    };

    let lastX = 0, lastY = 0;
    
    function createSpark(x, y) {
      const char = opts.symbols[Math.floor(Math.random() * opts.symbols.length)];
      const span = document.createElement('span');
      span.textContent = char;
      const size = 0.5 + Math.random() * 1.2;
      const rot  = Math.random() * 360;
      const driftX = (Math.random() - 0.5) * 80;
      const driftY = (Math.random() - 0.5) * 80;

      span.style.cssText = [
        'position:fixed',
        `left:${x}px`,
        `top:${y}px`,
        'pointer-events:none',
        'z-index:9999',
        `font-size:${size}rem`,
        `opacity:1`,
        'transform-origin:center',
        `transform:translate(-50%,-50%) rotate(${rot}deg)`,
        `transition:all ${opts.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
        'will-change:transform,opacity'
      ].join(';');

      document.body.appendChild(span);

      /* Trigger animation after paint */
      requestAnimationFrame(() => {
        span.style.transform = `translate(-50%, -50%) translate(${driftX}px, ${driftY}px) rotate(${rot + (Math.random() - 0.5) * 90}deg) scale(0)`;
        span.style.opacity = '0';
      });

      setTimeout(() => span.remove(), opts.duration * 1000 + 100);
    }

    const onMove = (e) => {
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist > opts.frequency * 8) {
        createSpark(e.clientX, e.clientY);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return { destroy() { window.removeEventListener('mousemove', onMove); } };
  }

  /* ══════════════════════════════════════════════════════════
     7. MAGNETIC — Mouse Attractor
     Gently pulls an element towards the cursor when hovering.
     ══════════════════════════════════════════════════════════ */
  function magnetic(target, options = {}) {
    const opts = { lerp: 0.12, mag: 0.35, ...options };
    const elements = _resolveElements(target);
    const cleanup = [];

    elements.forEach(el => {
      let mX = 0, mY = 0, eX = 0, eY = 0, rafId = null, destroyed = false;

      const onMove = (e) => {
        const rect = el.getBoundingClientRect();
        mX = (e.clientX - (rect.left + rect.width / 2)) * opts.mag;
        mY = (e.clientY - (rect.top + rect.height / 2)) * opts.mag;
      };

      const onLeave = () => { mX = 0; mY = 0; };

      const loop = () => {
        if (destroyed) return;
        eX += (mX - eX) * opts.lerp; eY += (mY - eY) * opts.lerp;
        el.style.transform = `translate3d(${eX.toFixed(2)}px, ${eY.toFixed(2)}px, 0)`;
        rafId = requestAnimationFrame(loop);
      };

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      loop();

      cleanup.push(() => {
        destroyed = true; cancelAnimationFrame(rafId);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
        el.style.transform = '';
      });
    });

    return { destroy() { cleanup.forEach(fn => fn()); } };
  }

})();
