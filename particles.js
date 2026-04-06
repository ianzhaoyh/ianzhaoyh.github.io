/* ============================================================
   Canvas 2D Particle Text — "Yunhao Zhao"
   Spring physics + mouse repulsion + Perlin noise coloring
   Vermeer palette (deep blue / golden yellow)
   ============================================================ */

(function () {
  'use strict';

  // ── Perlin Noise (simplex 2D) ─────────────────────────────
  const G3 = [
    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1],
  ];
  const P = new Uint8Array(512);
  (function () {
    const a = [];
    for (let i = 0; i < 256; i++) a[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    for (let i = 0; i < 512; i++) P[i] = a[i & 255];
  })();

  function dot2(g, x, y) { return g[0] * x + g[1] * y; }

  function noise2D(xin, yin) {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const gi0 = P[ii + P[jj]] % 12;
    const gi1 = P[ii + i1 + P[jj + j1]] % 12;
    const gi2 = P[ii + 1 + P[jj + 1]] % 12;
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot2(G3[gi0], x0, y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot2(G3[gi1], x1, y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot2(G3[gi2], x2, y2); }
    return 70 * (n0 + n1 + n2);
  }

  // ── Vermeer Palette ───────────────────────────────────────
  const COLORS = [
    '#1e3a5f', '#2b5797', '#4a7fb5',
    '#dab769', '#f0d68a', '#f5e6c8',
    '#8fa8c8', '#c4a44a', '#e8d5a0',
  ];

  function hexToRgb(h) {
    return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  }
  function lerpColor(a, b, t) {
    const [r1,g1,b1] = hexToRgb(a), [r2,g2,b2] = hexToRgb(b);
    return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
  }
  function getColor(px, py) {
    const n = (noise2D(px * 0.004, py * 0.004) + 1) * 0.5;
    const idx = n * (COLORS.length - 1);
    const lo = Math.floor(idx);
    return lerpColor(COLORS[lo], COLORS[Math.min(lo+1, COLORS.length-1)], idx - lo);
  }

  // ── Particle ──────────────────────────────────────────────
  class Particle {
    constructor(tx, ty, color) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.tx = tx; this.ty = ty;
      this.vx = 0; this.vy = 0;
      this.color = color;
      this.size = Math.random() * 1.6 + 1.0;
      this.friction = 0.86 + Math.random() * 0.07;
      this.spring = 0.02 + Math.random() * 0.03;
    }
    update(mx, my, active) {
      this.vx += (this.tx - this.x) * this.spring;
      this.vy += (this.ty - this.y) * this.spring;
      if (active) {
        const dx = this.x - mx, dy = this.y - my;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 120 && d > 0) {
          const f = ((120 - d) / 120);
          this.vx += (dx/d) * f * f * 12;
          this.vy += (dy/d) * f * f * 12;
        }
      }
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.x += this.vx;
      this.y += this.vy;
    }
    draw(c) {
      c.fillStyle = this.color;
      c.beginPath();
      c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      c.fill();
    }
  }

  // ── Canvas ────────────────────────────────────────────────
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mx = -9999, my = -9999, mActive = false;
  let animId, running = true;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    build();
  }

  function sampleText(text, fontSize, offsetY) {
    const off = document.createElement('canvas');
    const oc = off.getContext('2d');
    const w = window.innerWidth, h = window.innerHeight;
    off.width = w; off.height = h;
    oc.fillStyle = '#000';
    oc.font = `700 ${fontSize}px "Playfair Display","Inter",serif`;
    oc.textAlign = 'center';
    oc.textBaseline = 'middle';
    oc.fillText(text, w/2, h/2 + offsetY);
    const img = oc.getImageData(0, 0, w, h);
    const pts = [];
    const gap = Math.max(3, Math.round(4 * (1000/w)));
    for (let y = 0; y < h; y += gap)
      for (let x = 0; x < w; x += gap)
        if (img.data[(y*w+x)*4+3] > 128) pts.push({x, y});
    return pts;
  }

  function build() {
    const w = window.innerWidth;
    const mobile = w < 600;
    const fs = mobile ? Math.round(w * 0.12) : Math.round(w * 0.058);
    const pts = sampleText('Yunhao Zhao', fs, 0);
    particles = pts.map(p => new Particle(p.x, p.y, getColor(p.x, p.y)));
  }

  function animate() {
    if (!running) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of particles) { p.update(mx, my, mActive); p.draw(ctx); }
    animId = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => { if (running) resize(); });
  canvas.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; mActive = true; });
  canvas.addEventListener('mouseleave', () => { mActive = false; });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    mx = e.touches[0].clientX; my = e.touches[0].clientY; mActive = true;
  }, { passive: false });
  canvas.addEventListener('touchend', () => { mActive = false; });

  canvas.addEventListener('click', (e) => {
    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    const d = Math.sqrt((e.clientX-cx)**2 + (e.clientY-cy)**2);
    if (d < Math.max(window.innerWidth, window.innerHeight) * 0.35)
      window.enterMainSite();
  });

  window.particleEngine = {
    stop()  { running = false; if (animId) cancelAnimationFrame(animId); },
    start() { running = true; resize(); animate(); },
  };

  resize();
  animate();
})();
