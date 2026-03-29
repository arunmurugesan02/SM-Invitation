/**
 * ParticleSystemLite - A simplified DOM-based particle system for background effects.
 * Creates floating gold dust particles that drift upward.
 */
class ParticleSystemLite {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;

    this.count = options.count || 25;
    this.particles = [];
    this._init();
  }

  _init() {
    for (let i = 0; i < this.count; i++) {
      this._createParticle();
    }
  }

  _createParticle() {
    const p = document.createElement('div');
    p.className = 'particle';
    
    // Random position
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // Random delay and duration
    const delay = Math.random() * 8;
    const duration = 6 + Math.random() * 6;
    const size = 1 + Math.random() * 3;
    
    p.style.left = `${x}%`;
    p.style.top = `${y}%`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.animationDelay = `-${delay}s`;
    p.style.animationDuration = `${duration}s`;
    p.style.opacity = Math.random() * 0.5;

    this.container.appendChild(p);
    this.particles.push(p);
  }
}
