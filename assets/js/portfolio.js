/* portfolio.js — theme toggle, spotlight, mobile nav */

// === Theme ===
const html   = document.documentElement;
const toggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
  html.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}

if (toggle) {
  toggle.addEventListener('click', () => {
    applyTheme(html.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

// System theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
});

// === Mouse spotlight (throttled via rAF) ===
let rafPending = false;
document.addEventListener('mousemove', (e) => {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    rafPending = false;
  });
});

// Reset spotlight when mouse leaves window
document.addEventListener('mouseleave', () => {
  document.body.style.setProperty('--mouse-x', '-999px');
  document.body.style.setProperty('--mouse-y', '-999px');
});

// === Hero constellation ===
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx       = canvas.getContext('2d');
  const N         = 45;
  const MAX_EDGE  = 130;
  const REVEAL_R  = 190;
  const GHOST_NODE = 0.05;
  const GHOST_EDGE = 0.03;

  // Hero bg is always dark → always use blue accent
  const [r, g, b] = [88, 166, 255];

  let mx = -9999, my = -9999;
  let autoAnimate = true;
  let tick = 0;
  let nodes = [];

  // Desktop: nodes live in the right ~58% (dark overlay area)
  // Mobile:  nodes live in the bottom ~50% (gradient goes bottom→top)
  function getBounds() {
    if (window.innerWidth < 640) {
      return { x0: 0, x1: canvas.width, y0: canvas.height * 0.48, y1: canvas.height };
    }
    return { x0: canvas.width * 0.40, x1: canvas.width, y0: 0, y1: canvas.height };
  }

  function initNodes() {
    const b = getBounds();
    nodes = Array.from({ length: N }, () => ({
      x:  b.x0 + Math.random() * (b.x1 - b.x0),
      y:  b.y0 + Math.random() * (b.y1 - b.y0),
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
    }));
  }

  function resize() {
    // Size canvas to the hero element's actual dimensions
    const rect   = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
    initNodes();
  }

  function ptSegDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - ax, py - ay);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function smoothstep(t) { return t * t * (3 - 2 * t); }

  function draw() {
    tick += 0.005;

    if (autoAnimate) {
      const bd = getBounds();
      const cx = bd.x0 + (bd.x1 - bd.x0) * 0.5;
      const cy = bd.y0 + (bd.y1 - bd.y0) * 0.5;
      mx = cx + Math.cos(tick)         * (bd.x1 - bd.x0) * 0.28;
      my = cy + Math.sin(tick * 0.71)  * (bd.y1 - bd.y0) * 0.28;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Drift nodes, bounce inside their allowed zone
    const bd = getBounds();
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < bd.x0 || n.x > bd.x1) { n.vx *= -1; n.x = Math.max(bd.x0, Math.min(bd.x1, n.x)); }
      if (n.y < bd.y0 || n.y > bd.y1) { n.vy *= -1; n.y = Math.max(bd.y0, Math.min(bd.y1, n.y)); }
    }

    // Edges
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b     = nodes[j];
        const dist  = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist > MAX_EDGE) continue;

        const edgeFade = 1 - dist / MAX_EDGE;
        const segDist  = ptSegDist(mx, my, a.x, a.y, b.x, b.y);
        const revealed = smoothstep(Math.max(0, 1 - segDist / REVEAL_R));
        const alpha    = Math.max(GHOST_EDGE * edgeFade, revealed * edgeFade * 0.55);
        if (alpha < 0.01) continue;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth   = 0.4 + revealed * 0.4;
        ctx.stroke();
      }
    }

    // Nodes
    for (const n of nodes) {
      const d        = Math.hypot(mx - n.x, my - n.y);
      const revealed = smoothstep(Math.max(0, 1 - d / REVEAL_R));
      const alpha    = Math.max(GHOST_NODE, revealed * 0.85);
      const radius   = 1.5 + revealed * 2;

      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // Convert viewport → canvas-local coordinates
  function toLocal(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return [clientX - rect.left, clientY - rect.top];
  }

  window.addEventListener('mousemove', e => {
    autoAnimate = false;
    [mx, my] = toLocal(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', e => {
    autoAnimate = false;
    [mx, my] = toLocal(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('resize', resize);

  resize();
  draw();
})();

// === Mobile Nav ===
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}
