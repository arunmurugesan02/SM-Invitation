/* ============================================================
   Lightbox.js — Reusable Image Lightbox Component
   Sudarasan & Maheswari Wedding Invitation
   ------------------------------------------------------------
   Automatically builds its own DOM, injects required styles,
   and binds click triggers via a data attribute.

   Usage:
     new Lightbox({
       triggerSelector:  '[data-lightbox]',   // elements that open the lightbox
       srcAttr:          'data-lightbox',      // attribute holding image src
       altAttr:          'data-lightbox-alt',  // attribute holding alt text
       captionAttr:      'data-lightbox-caption', // optional caption text
       closeOnBackdrop:  true,
       closeOnEscape:    true,
       animationClass:   'lightbox--active',
     });

   HTML example:
     <div data-lightbox="images/ring1.jpg"
          data-lightbox-alt="Wedding rings"
          data-lightbox-caption="Sealed with Love">
       <img src="images/ring1.jpg" />
     </div>
   ============================================================ */

class Lightbox {
  /**
   * @param {object} options — configuration overrides
   */
  constructor(options = {}) {
    this._opts = Object.assign(
      {
        triggerSelector:  '[data-lightbox]',
        srcAttr:          'data-lightbox',
        altAttr:          'data-lightbox-alt',
        captionAttr:      'data-lightbox-caption',
        closeOnBackdrop:  true,
        closeOnEscape:    true,
        animationClass:   'lightbox--active',
        loadingClass:     'lightbox--loading',
        bodyLockClass:    'lightbox-open',
        swipeThreshold:   60,        // px needed to dismiss via swipe
      },
      options
    );

    /** @type {HTMLElement|null} — the backdrop/root element */
    this._el = null;

    /** @type {HTMLImageElement|null} */
    this._img = null;

    /** @type {HTMLElement|null} */
    this._caption = null;

    /** @type {HTMLButtonElement|null} */
    this._closeBtn = null;

    /** @type {boolean} */
    this._isOpen = false;

    /** @type {string} — src of the currently displayed image */
    this._currentSrc = '';

    /* Touch-swipe tracking */
    this._touchStartY = 0;
    this._touchStartX = 0;

    /* Bound handler refs (needed for removeEventListener) */
    this._onKeyDown   = this._handleKeyDown.bind(this);
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchEnd   = this._handleTouchEnd.bind(this);

    this._build();
    this._bindGlobalEvents();
    this.bindTriggers();
  }


  /* ──────────────────────────────────────────────────────────
     PRIVATE — DOM CONSTRUCTION
     ────────────────────────────────────────────────────────── */

  /**
   * Create and append the lightbox DOM to <body>.
   * Called once in the constructor.
   */
  _build() {
    /* ── Backdrop / root ── */
    const lb = document.createElement('div');
    lb.id           = 'lightbox';
    lb.className    = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');

    /* ── Close button ── */
    const closeBtn = document.createElement('button');
    closeBtn.className  = 'lightbox__close';
    closeBtn.type       = 'button';
    closeBtn.innerHTML  = '&times;';
    closeBtn.setAttribute('aria-label', 'Close image viewer');

    /* ── Loading spinner ── */
    const spinner = document.createElement('div');
    spinner.className = 'lightbox__spinner';
    spinner.setAttribute('aria-hidden', 'true');
    spinner.innerHTML = `
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="20"
          fill="none" stroke="rgba(212,175,55,0.6)"
          stroke-width="3" stroke-linecap="round"
          stroke-dasharray="100 28">
          <animateTransform attributeName="transform" type="rotate"
            from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/>
        </circle>
      </svg>
    `;

    /* ── Image ── */
    const img = document.createElement('img');
    img.className = 'lightbox__img';
    img.alt       = '';

    /* ── Caption ── */
    const caption = document.createElement('p');
    caption.className = 'lightbox__caption';

    /* ── Assemble ── */
    lb.appendChild(closeBtn);
    lb.appendChild(spinner);
    lb.appendChild(img);
    lb.appendChild(caption);
    document.body.appendChild(lb);

    /* ── Store refs ── */
    this._el       = lb;
    this._img      = img;
    this._caption  = caption;
    this._closeBtn = closeBtn;
    this._spinner  = spinner;

    /* ── Inject styles once ── */
    Lightbox._injectStyles();
  }


  /* ──────────────────────────────────────────────────────────
     PRIVATE — EVENT BINDING
     ────────────────────────────────────────────────────────── */

  /**
   * Bind events that live for the entire lifetime of the component.
   */
  _bindGlobalEvents() {
    /* Close button */
    this._closeBtn.addEventListener('click', () => this.close());

    /* Backdrop click (only when clicking the backdrop itself, not the image) */
    if (this._opts.closeOnBackdrop) {
      this._el.addEventListener('click', e => {
        if (e.target === this._el) this.close();
      });
    }

    /* Keyboard */
    if (this._opts.closeOnEscape) {
      document.addEventListener('keydown', this._onKeyDown);
    }

    /* Touch swipe-to-dismiss */
    this._el.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this._el.addEventListener('touchend',   this._onTouchEnd,   { passive: true });
  }

  /**
   * Bind click listeners to all matching trigger elements within scope.
   * Safe to call multiple times (e.g. after dynamic DOM changes).
   *
   * @param {Document|Element} scope
   */
  bindTriggers(scope = document) {
    scope.querySelectorAll(this._opts.triggerSelector).forEach(trigger => {
      /* Prevent double-binding */
      if (trigger.dataset._lightboxBound === '1') return;
      trigger.dataset._lightboxBound = '1';

      trigger.style.cursor = 'pointer';
      trigger.addEventListener('click', () => {
        const src     = trigger.getAttribute(this._opts.srcAttr)     || '';
        const alt     = trigger.getAttribute(this._opts.altAttr)     || '';
        const caption = trigger.getAttribute(this._opts.captionAttr) || '';
        if (src) this.open(src, alt, caption);
      });

      /* Keyboard accessibility: open on Enter / Space */
      if (!trigger.hasAttribute('tabindex')) {
        trigger.setAttribute('tabindex', '0');
      }
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger.click();
        }
      });
    });
  }

  /**
   * Keyboard handler — close on Escape.
   * @param {KeyboardEvent} e
   */
  _handleKeyDown(e) {
    if (!this._isOpen) return;
    if (e.key === 'Escape') this.close();
  }

  /**
   * Record touch start position for swipe detection.
   * @param {TouchEvent} e
   */
  _handleTouchStart(e) {
    const t = e.changedTouches[0];
    this._touchStartX = t.clientX;
    this._touchStartY = t.clientY;
  }

  /**
   * Close lightbox if the user swiped down or sideways enough.
   * @param {TouchEvent} e
   */
  _handleTouchEnd(e) {
    if (!this._isOpen) return;
    const t   = e.changedTouches[0];
    const dx  = t.clientX - this._touchStartX;
    const dy  = t.clientY - this._touchStartY;
    const thr = this._opts.swipeThreshold;

    /* Swipe down or swipe left/right closes */
    if (dy > thr || Math.abs(dx) > thr) {
      this.close();
    }
  }


  /* ──────────────────────────────────────────────────────────
     PRIVATE — IMAGE LOADING
     ────────────────────────────────────────────────────────── */

  /**
   * Preload an image, then update the visible <img> src.
   * Shows a loading spinner while the image fetches.
   *
   * @param {string} src
   * @param {string} alt
   */
  _loadImage(src, alt) {
    /* Show spinner while loading */
    this._el.classList.add(this._opts.loadingClass);
    this._img.style.opacity = '0';

    const probe = new Image();
    probe.onload = () => {
      this._img.src     = src;
      this._img.alt     = alt;
      this._el.classList.remove(this._opts.loadingClass);

      /* Fade image in */
      requestAnimationFrame(() => {
        this._img.style.transition = 'opacity 0.3s ease';
        this._img.style.opacity    = '1';
      });
    };
    probe.onerror = () => {
      console.warn('[Lightbox] Failed to load image:', src);
      this._el.classList.remove(this._opts.loadingClass);
      this._img.alt = 'Image failed to load';
    };
    probe.src = src;
  }


  /* ──────────────────────────────────────────────────────────
     PUBLIC API
     ────────────────────────────────────────────────────────── */

  /**
   * Open the lightbox with a given image source.
   *
   * @param {string} src     — image URL
   * @param {string} alt     — alt text for accessibility
   * @param {string} caption — optional visible caption
   */
  open(src, alt = '', caption = '') {
    if (!src) return;

    this._currentSrc = src;

    /* Set caption (hide element when empty) */
    this._caption.textContent = caption;
    this._caption.style.display = caption ? 'block' : 'none';

    /* Make visible before loading so spinner shows */
    this._el.classList.add(this._opts.animationClass);
    document.body.classList.add(this._opts.bodyLockClass);
    document.body.style.overflow = 'hidden';
    this._isOpen = true;

    /* Focus trap — move focus to close button */
    requestAnimationFrame(() => this._closeBtn.focus());

    /* Load image (async, with spinner) */
    this._loadImage(src, alt);
  }

  /**
   * Close the lightbox and restore scroll.
   */
  close() {
    if (!this._isOpen) return;

    this._el.classList.remove(this._opts.animationClass);
    this._el.classList.remove(this._opts.loadingClass);
    document.body.classList.remove(this._opts.bodyLockClass);
    document.body.style.overflow = '';
    this._isOpen     = false;
    this._currentSrc = '';

    /* Clear src after the CSS close transition completes */
    setTimeout(() => {
      if (!this._isOpen) {
        this._img.src             = '';
        this._img.style.opacity   = '0';
        this._img.style.transition = 'none';
      }
    }, 350);
  }

  /**
   * Completely destroy the lightbox instance.
   * Removes the DOM element and all global event listeners.
   */
  destroy() {
    this.close();
    document.removeEventListener('keydown', this._onKeyDown);
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el      = null;
    this._img     = null;
    this._caption = null;
  }

  /**
   * Returns whether the lightbox is currently open.
   * @returns {boolean}
   */
  get isOpen() {
    return this._isOpen;
  }

  /**
   * Returns the src of the currently displayed image.
   * @returns {string}
   */
  get currentSrc() {
    return this._currentSrc;
  }


  /* ──────────────────────────────────────────────────────────
     STATIC — inject CSS once per page
     ────────────────────────────────────────────────────────── */

  static _injectStyles() {
    if (document.getElementById('_lightbox-styles')) return;

    const style = document.createElement('style');
    style.id    = '_lightbox-styles';
    style.textContent = `

      /* ── Lock body when lightbox is open ── */
      body.lightbox-open {
        overflow: hidden;
      }

      /* ── Spinner ── */
      .lightbox__spinner {
        display: none;
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 50px;
        height: 50px;
        z-index: 2;
      }

      .lightbox--loading .lightbox__spinner {
        display: block;
      }

      /* ── Close button rotate on hover ── */
      .lightbox__close {
        transition: color 0.3s ease, transform 0.3s ease;
      }
      .lightbox__close:hover {
        transform: rotate(90deg) scale(1.1);
      }

      /* ── Image enter animation ── */
      .lightbox__img {
        will-change: opacity, transform;
      }

      /* ── Caption ── */
      .lightbox__caption {
        position: absolute;
        bottom: 1.8rem;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Cormorant Garamond', serif;
        font-size: 1rem;
        font-style: italic;
        color: rgba(245, 230, 160, 0.85);
        letter-spacing: 0.05em;
        white-space: nowrap;
        pointer-events: none;
        text-shadow: 0 1px 4px rgba(0,0,0,0.6);
      }

    `;
    document.head.appendChild(style);
  }
}
