/* ============================================================
   main.js — Application Entry Point
   Sudarasan & Maheswari Wedding Reception Invitation
   ------------------------------------------------------------
   Wires together all reusable components:
     • ParticleSystem  — floating gold particle canvas
     • ScrollReveal    — scroll-triggered element animations
     • Countdown       — live countdown to the event date
     • Lightbox        — fullscreen gallery image viewer
     • Effects         — ripple, cursor glow, parallax, nav, tilt
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ══════════════════════════════════════════════════════════
     1. PARTICLE SYSTEM
     Gold/rose bokeh particles drifting upward across the page.
     ══════════════════════════════════════════════════════════ */
  new ParticleSystem("particles-canvas", {
    colors: [
      "rgba(212,175,55,", // rich gold
      "rgba(240,208,96,", // light gold
      "rgba(245,230,160,", // pale gold
      "rgba(201,160,168,", // rose
      "rgba(255,255,255,", // white sparkle
    ],
    maxParticles: 120,
    densityFactor: 8500,
    minRadius: 0.4,
    maxRadius: 2.6,
    speedX: 0.3,
    speedY: 0.5,
    minLife: 150,
    maxLife: 320,
    sparkle: true,
    glow: true,
  });

  /* ══════════════════════════════════════════════════════════
     2. SCROLL REVEAL
     Every element with class="reveal" fades/slides into view.
     Direction variants: .left  .right  .scale  .fade
     Stagger via:        data-reveal-delay="2"  (or CSS reveal-delay-N)
     ══════════════════════════════════════════════════════════ */
  new ScrollReveal(".reveal", {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px",
    visibleClass: "visible",
    delayStep: 0.1, // seconds per data-reveal-delay unit
    maxDelay: 0.8,
    once: true,
  });

  /* ══════════════════════════════════════════════════════════
     3. COUNTDOWN TIMER
     Counts down to the reception: 17 May 2026, 6:00 PM IST.
     ══════════════════════════════════════════════════════════ */
  new Countdown(
    "2026-05-17T18:00:00+05:30", // ISO 8601 with IST offset
    {
      days: "#cd-days",
      hours: "#cd-hours",
      minutes: "#cd-mins",
      seconds: "#cd-secs",
    },
    {
      padLength: 2,
      onComplete: () => {
        const wrap = document.querySelector(".countdown");
        if (wrap) {
          wrap.innerHTML = `
            <p class="countdown__title" style="font-size:1rem; letter-spacing:0.1em;">
              🎉 The celebration has begun!
            </p>
          `;
        }
      },
    },
  );

  /* ══════════════════════════════════════════════════════════
     4. LIGHTBOX
     Clicking any [data-lightbox="…"] element opens the viewer.
     ══════════════════════════════════════════════════════════ */
  new Lightbox({
    triggerSelector: "[data-lightbox]",
    srcAttr: "data-lightbox",
    altAttr: "data-lightbox-alt",
    captionAttr: "data-lightbox-caption",
    closeOnBackdrop: true,
    closeOnEscape: true,
    swipeThreshold: 55,
  });

  /* ══════════════════════════════════════════════════════════
     5. NAV SCROLL
     Adds glass-blur background to nav after scrolling 60px.
     ══════════════════════════════════════════════════════════ */
  Effects.navScroll("#main-nav", "scrolled", 60);

  /* ══════════════════════════════════════════════════════════
     6. CINEMATIC BACKGROUND PARTICLES
     Adds subtle floating gold dust to the quote/family transition.
     ══════════════════════════════════════════════════════════ */
  if (typeof ParticleSystemLite !== 'undefined') {
    new ParticleSystemLite('.particles-container', { count: 35 });
  }
  /* ══════════════════════════════════════════════════════════
     7. CURSOR GLOW
     Subtle radial gold glow that follows the mouse (desktop).
     Skipped on touch-only devices.
     ══════════════════════════════════════════════════════════ */
  if (window.matchMedia("(pointer: fine)").matches) {
    Effects.cursorGlow({
      size: 320,
      color: "rgba(212,175,55,0.045)",
      lag: 120,
      zIndex: 0,
    });
  }

  /* ══════════════════════════════════════════════════════════
     8. PARALLAX — Hero background scrolls at reduced speed
     ══════════════════════════════════════════════════════════ */
  Effects.parallax(".hero__bg-img", 0.08, {
    axis: "y",
    clampToSection: false,
  });

  /* ══════════════════════════════════════════════════════════
     9. RIPPLE — click feedback on interactive cards
     ══════════════════════════════════════════════════════════ */
  Effects.ripple("[data-ripple]", {
    color: "rgba(212,175,55,0.14)",
    duration: "0.65s",
    scale: 2.6,
  });

  /* ══════════════════════════════════════════════════════════
     10. TILT CARDS — subtle 3-D tilt on detail & parent cards
        (desktop only — skip on touch devices for performance)
     ══════════════════════════════════════════════════════════ */
  if (window.matchMedia("(pointer: fine)").matches) {
    Effects.tiltCard(".detail-card", {
      maxTilt: 8,
      scale: 1.025,
      glare: false,
      speed: 450,
    });

    Effects.tiltCard(".family__parent-card", {
      maxTilt: 10,
      scale: 1.03,
      glare: false,
      speed: 400,
    });
  }

  /* ══════════════════════════════════════════════════════════
     11. MAGNETIC — interactive cursor attractor
     ══════════════════════════════════════════════════════════ */
  if (window.matchMedia("(pointer: fine)").matches) {
    Effects.magnetic(".magnetic", {
      mag: 0.28,
      lerp: 0.12,
    });
  }

  /* ══════════════════════════════════════════════════════════
     12. SPARKLE TRAIL — Cinematic cursor stars
     ══════════════════════════════════════════════════════════ */
  if (window.matchMedia("(pointer: fine)").matches) {
    Effects.sparkleTrail({
      symbols: ["✨", "✦", "💍", "🤍", "✿"],
      frequency: 5,
      duration: 1.5,
    });
  }

  /* ══════════════════════════════════════════════════════════
     13. HERO SYMBOL PARALLAX — floating element depth
     ══════════════════════════════════════════════════════════ */
  Effects.parallax(".hero__symbol", 0.05, { axis: "y" });

  /* ══════════════════════════════════════════════════════════
     14. SMOOTH ACTIVE NAV LINK HIGHLIGHT
         Highlights the nav link whose section is in view.
     ══════════════════════════════════════════════════════════ */
  _initActiveNavLinks();





  /* ══════════════════════════════════════════════════════════
     15. MOBILE NAV TOGGLE
         Hamburger button opens/closes the nav overlay on mobile.
         Closes when a link is clicked, Escape is pressed, or
         the user taps outside the nav.
     ══════════════════════════════════════════════════════════ */
  _initMobileNav();

  /* ══════════════════════════════════════════════════════════
     16. MEMORY TREE
     Triggers drop animation on scroll + injects leaf particles.
     ══════════════════════════════════════════════════════════ */
  _initMemoryTree();
}); /* END DOMContentLoaded */

/* ============================================================
   PRIVATE HELPERS
   ============================================================ */

/**
 * Watches sections via IntersectionObserver and adds an
 * `.active` class to the matching nav link when in view.
 * Relies on nav links having href="#section-id".
 */
function _initActiveNavLinks() {
  const navLinks = Array.from(
    document.querySelectorAll('.nav__link[href^="#"]'),
  );
  if (!navLinks.length) return;

  const sectionIds = navLinks
    .map((link) => link.getAttribute("href").slice(1))
    .filter(Boolean);

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const id = entry.target.id;

        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${id}`;
          link.classList.toggle("nav__link--active", isActive);
          link.style.color = isActive ? "var(--clr-gold)" : "";
        });
      });
    },
    {
      threshold: 0.45,
      rootMargin: "-10% 0px -10% 0px",
    },
  );

  sections.forEach((section) => observer.observe(section));
}

/**
 * Wires up the mobile hamburger menu toggle.
 * Adds/removes `.nav--open` on <nav> and <body>.
 * Updates aria-expanded on the toggle button.
 */
function _initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  const links = document.querySelectorAll(".nav__link");

  if (!toggle || !nav) return;

  /** Open the mobile menu */
  function openMenu() {
    nav.classList.add("nav--open");
    document.body.classList.add("nav--open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");
  }

  /** Close the mobile menu */
  function closeMenu() {
    nav.classList.remove("nav--open");
    document.body.classList.remove("nav--open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
  }

  // Toggle on button click
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.contains("nav--open");
    isOpen ? closeMenu() : openMenu();
  });

  // Close when a nav link is clicked (smooth-scroll to section)
  links.forEach((link) => {
    link.addEventListener("click", () => {
      if (nav.classList.contains("nav--open")) closeMenu();
    });
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("nav--open")) {
      closeMenu();
      toggle.focus(); // return focus to toggle for accessibility
    }
  });

  // Close when clicking outside the nav (on the backdrop)
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("nav--open") && !nav.contains(e.target)) {
      closeMenu();
    }
  });
}

/**
 * Memory Tree — triggers in-view animation and injects
 * floating leaf particles into the #friends section.
 */
function _initMemoryTree() {
  const tree = document.getElementById("mem-tree");
  if (!tree) return;

  /* ── Scroll-triggered drop + swing animation ── */
  const treeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tree.classList.add("in-view");
          treeObserver.unobserve(tree);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
  );
  treeObserver.observe(tree);

  /* ── Floating leaf particles ── */
  const leavesEl = document.getElementById("tree-leaves");
  if (!leavesEl) return;

  // Respect reduced-motion preference
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const symbols = ["🍂", "🍃", "🌿", "✦", "✿", "❋"];
  const count = 14;

  for (let i = 0; i < count; i++) {
    const leaf = document.createElement("span");
    leaf.className = "mem-leaf";
    leaf.setAttribute("aria-hidden", "true");
    leaf.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    const size = 0.55 + Math.random() * 0.65;
    const left = 3 + Math.random() * 94;
    const dur = 14 + Math.random() * 16;
    const delay = Math.random() * 22;

    leaf.style.cssText = [
      `left: ${left}%`,
      `top: 100%`,
      `font-size: ${size}rem`,
      `animation-duration: ${dur}s`,
      `animation-delay: ${delay}s`,
    ].join("; ");

    leavesEl.appendChild(leaf);
  }
}
