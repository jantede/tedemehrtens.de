(function () {
  function createConstellation(options) {
    const {
      canvas,
      nodeCount = 80,
      maxEdge = 110,
      revealRadius = 190,
      ghostNode = 0.05,
      ghostEdge = 0.03,
      speed = 0.28,
      colorResolver,
      boundsResolver,
      mobileBreakpoint = 639,
      disableOnMobile = false,
      reduceMotion,
    } = options;

    if (!canvas) return;
    if (disableOnMobile && window.matchMedia(`(max-width: ${mobileBreakpoint}px)`).matches) return;

    const ctx = canvas.getContext('2d');
    let nodes = [];
    let frameId;
    let tick = 0;
    let mx = -9999;
    let my = -9999;
    let autoAnimate = true;

    function getBounds() {
      if (typeof boundsResolver === 'function') return boundsResolver(canvas);
      return { x0: 0, x1: canvas.width, y0: 0, y1: canvas.height };
    }

    function initNodes() {
      const b = getBounds();
      nodes = Array.from({ length: nodeCount }, () => ({
        x: b.x0 + Math.random() * (b.x1 - b.x0),
        y: b.y0 + Math.random() * (b.y1 - b.y0),
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
      }));
    }

    function resize() {
      const rect = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      canvas.width = rect.width;
      canvas.height = rect.height;
      initNodes();
    }

    function ptSegDist(px, py, ax, ay, bx, by) {
      const dx = bx - ax;
      const dy = by - ay;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return Math.hypot(px - ax, py - ay);
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
      return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }

    function smoothstep(t) {
      return t * t * (3 - 2 * t);
    }

    function toLocal(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return [clientX - rect.left, clientY - rect.top];
    }

    function draw() {
      if (reduceMotion && reduceMotion.matches) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      tick += 0.005;

      if (autoAnimate) {
        const b = getBounds();
        const cx = b.x0 + (b.x1 - b.x0) * 0.5;
        const cy = b.y0 + (b.y1 - b.y0) * 0.5;
        mx = cx + Math.cos(tick) * (b.x1 - b.x0) * 0.28;
        my = cy + Math.sin(tick * 0.71) * (b.y1 - b.y0) * 0.28;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const [r, g, b] = colorResolver();
      const bounds = getBounds();

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < bounds.x0 || n.x > bounds.x1) {
          n.vx *= -1;
          n.x = Math.max(bounds.x0, Math.min(bounds.x1, n.x));
        }
        if (n.y < bounds.y0 || n.y > bounds.y1) {
          n.vy *= -1;
          n.y = Math.max(bounds.y0, Math.min(bounds.y1, n.y));
        }
      }

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const c = nodes[j];
          const dist = Math.hypot(a.x - c.x, a.y - c.y);
          if (dist > maxEdge) continue;
          const edgeFade = 1 - dist / maxEdge;
          const segDist = ptSegDist(mx, my, a.x, a.y, c.x, c.y);
          const revealed = smoothstep(Math.max(0, 1 - segDist / revealRadius));
          const alpha = Math.max(ghostEdge * edgeFade, revealed * edgeFade * 0.55);
          if (alpha < 0.01) continue;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(c.x, c.y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = 0.4 + revealed * 0.4;
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        const d = Math.hypot(mx - n.x, my - n.y);
        const revealed = smoothstep(Math.max(0, 1 - d / revealRadius));
        const alpha = Math.max(ghostNode, revealed * 0.85);
        const radius = 1.5 + revealed * 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      frameId = requestAnimationFrame(draw);
    }

    const onMouseMove = (event) => {
      autoAnimate = false;
      [mx, my] = toLocal(event.clientX, event.clientY);
    };

    const onTouchMove = (event) => {
      autoAnimate = false;
      [mx, my] = toLocal(event.touches[0].clientX, event.touches[0].clientY);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    if (reduceMotion) {
      reduceMotion.addEventListener('change', () => {
        if (reduceMotion.matches) {
          cancelAnimationFrame(frameId);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
          draw();
        }
      });
    }
  }

  window.createConstellation = createConstellation;
})();
