/* ============================================================
   ParticleSystem.js — Reusable Canvas Particle Engine
   Sudarasan & Maheswari Wedding Invitation

   Usage:
     new ParticleSystem('canvas-id', { ...options });

   Options:
     colors        {string[]}  — Array of rgba prefix strings e.g. 'rgba(212,175,55,'
     maxParticles  {number}    — Hard cap on particle count (default 130)
     densityFactor {number}    — px² per particle (lower = denser, default 8000)
     minRadius     {number}    — Minimum particle radius in px (default 0.4)
     maxRadius     {number}    — Maximum particle radius in px (default 2.8)
     speedX        {number}    — Max horizontal drift speed   (default 0.35)
     speedY        {number}    — Upward float speed cap       (default 0.55)
     minLife       {number}    — Minimum lifetime in frames   (default 140)
     maxLife       {number}    — Maximum lifetime in frames   (default 340)
     sparkle       {boolean}   — Draw cross sparkle on large particles (default true)
     glow          {boolean}   — Draw radial glow halo (default true)
   ============================================================ */

class ParticleSystem {
  /**
   * @param {string}  canvasId  — id of the <canvas> element
   * @param {object}  options   — optional configuration overrides
   */
  constructor(canvasId, options = {}) {
    this._canvas = document.getElementById(canvasId);
    if (!this._canvas) {
      console.warn(`ParticleSystem: canvas "#${canvasId}" not found.`);
      return;
    }

    this._ctx = this._canvas.getContext('2d');

    /* ── Merge defaults with caller options ── */
    this._opts = {
      colors: [
        'rgba(212,175,55,',   // gold
        'rgba(240,208,96,',   // gold light
        'rgba(245,230,160,',  // pale gold
        'rgba(201,160,168,',  // rose
        'rgba(255,255,255,',  // white
      ],
      maxParticles:  130,
      densityFactor: 8000,
      minRadius:     0.4,
      maxRadius:     2.8,
      speedX:        0.35,
      speedY:        0.55,
      minLife:       140,
      maxLife:       340,
      sparkle:       true,
      glow:          true,
      ...options,
    };

    this._particles = [];
    this._animId    = null;
    this._W         = 0;
    this._H         = 0;

    /* Bind once so we can remove listener if needed */
    this._onResize = this._handleResize.bind(this);
    this._tick     = this._tick.bind(this);

    this._init();
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC API
     ────────────────────────────────────────────────────────── */

  /** Start the animation loop (called automatically by constructor). */
  start() {
    if (this._animId) return; // already running
    this._tick();
  }

  /** Pause the animation loop without destroying particles. */
  pause() {
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
  }

  /** Destroy the system: stop loop, clear canvas, remove listeners. */
  destroy() {
    this.pause();
    window.removeEventListener('resize', this._onResize);
    if (this._ctx) {
      this._ctx.clearRect(0, 0, this._W, this._H);
    }
    this._particles = [];
  }

  /** Dynamically update one or more options at runtime. */
  setOptions(newOptions = {}) {
    Object.assign(this._opts, newOptions);
    this._rebuildParticles();
  }

  /* ──────────────────────────────────────────────────────────
     PRIVATE — INITIALISATION
     ────────────────────────────────────────────────────────── */

  _init() {
    this._resize();
    this._buildParticles(/* initial = */ true);
    this.start();
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  _handleResize() {
    this._resize();
    this._rebuildParticles();
  }

  _resize() {
    this._W = this._canvas.width  = window.innerWidth;
    this._H = this._canvas.height = window.innerHeight;
  }

  /* ──────────────────────────────────────────────────────────
     PRIVATE — PARTICLE MANAGEMENT
     ────────────────────────────────────────────────────────── */

  /**
   * Build the full particle array.
   * @param {boolean} initial — if true, scatter y randomly across screen;
   *                            otherwise place new particles at the bottom.
   */
  _buildParticles(initial = false) {
    const count = Math.min(
      Math.floor((this._W * this._H) / this._opts.densityFactor),
      this._opts.maxParticles,
    );

    this._particles = [];
    for (let i = 0; i < count; i++) {
      const p = {};
      this._resetParticle(p, initial);
      this._particles.push(p);
    }
  }

  _rebuildParticles() {
    this._buildParticles(false);
  }

  /**
   * Reset a single particle (reuse object to avoid GC pressure).
   * @param {object}  p        — particle object to mutate
   * @param {boolean} initial  — if true, y starts at random position
   */
  _resetParticle(p, initial = false) {
    const o = this._opts;

    p.x     = Math.random() * this._W;
    p.y     = initial ? Math.random() * this._H : this._H + 10;
    p.r     = Math.random() * (o.maxRadius - o.minRadius) + o.minRadius;
    p.alpha = Math.random() * 0.55 + 0.12;
    p.vx    = (Math.random() - 0.5) * o.speedX;
    p.vy    = -(Math.random() * o.speedY + 0.08);
    p.life  = 0;
    p.maxL  = Math.floor(Math.random() * (o.maxLife - o.minLife) + o.minLife);
    p.color = o.colors[Math.floor(Math.random() * o.colors.length)];

    /* Twinkle oscillation */
    p.twinkleSpeed = Math.random() * 0.045 + 0.008;
    p.twinklePhase = Math.random() * Math.PI * 2;
  }

  /* ──────────────────────────────────────────────────────────
     PRIVATE — RENDER LOOP
     ────────────────────────────────────────────────────────── */

  _tick() {
    this._update();
    this._draw();
    this._animId = requestAnimationFrame(this._tick);
  }

  _update() {
    for (const p of this._particles) {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.twinklePhase += p.twinkleSpeed;

      /* Reset when lifetime expires or particle drifts off-screen */
      const offScreen = p.y < -20 || p.x < -40 || p.x > this._W + 40;
      if (p.life >= p.maxL || offScreen) {
        this._resetParticle(p, false);
      }
    }
  }

  _draw() {
    const { _ctx: ctx, _W: W, _H: H, _opts: o } = this;

    ctx.clearRect(0, 0, W, H);

    for (const p of this._particles) {
      const lifeRatio = p.life / p.maxL;
      const twinkle   = Math.sin(p.twinklePhase) * 0.30 + 0.70; // 0.4 – 1.0

      /* Fade in for first 10 % of life, fade out for last 20 % */
      let alpha = p.alpha * twinkle;
      if (lifeRatio < 0.10) alpha *= lifeRatio / 0.10;
      if (lifeRatio > 0.80) alpha *= (1 - lifeRatio) / 0.20;
      alpha = Math.min(alpha, 1);

      /* ── Radial glow halo ── */
      if (o.glow) {
        const glowR = p.r * 3.5;
        const grad  = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        grad.addColorStop(0, `${p.color}${(alpha * 0.7).toFixed(3)})`);
        grad.addColorStop(1, `${p.color}0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      /* ── Solid core ── */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${Math.min(alpha * 1.6, 1).toFixed(3)})`;
      ctx.fill();

      /* ── Cross sparkle (only for larger, brighter particles) ── */
      if (o.sparkle && p.r > 1.4 && twinkle > 0.78) {
        const armLen = p.r * 4.5;
        ctx.save();
        ctx.globalAlpha = alpha * 0.75;
        ctx.strokeStyle = `${p.color}0.9)`;
        ctx.lineWidth   = 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x - armLen, p.y);
        ctx.lineTo(p.x + armLen, p.y);
        ctx.moveTo(p.x, p.y - armLen);
        ctx.lineTo(p.x, p.y + armLen);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
