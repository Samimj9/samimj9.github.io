/* Faint, scrolling multi-channel EEG traces behind the hero.
   Low opacity, ~30 fps, paused when off-screen / tab hidden, static under prefers-reduced-motion. */
const canvas = document.getElementById('hero-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const CHANNELS = 7;
  let w = 0, h = 0, dpr = 1, accent = '#1f8a83', ink = '#888', raf = 0, running = false, last = 0;
  const t0 = performance.now();

  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    accent = cs.getPropertyValue('--accent').trim() || accent;
    ink = cs.getPropertyValue('--ink-3').trim() || ink;
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  };

  // Deterministic "EEG": alpha/beta rhythms with slow bursting envelopes plus a drifting theta wave.
  const sig = (x, t, k) => {
    const p = k * 1.7;
    const env = 0.55 + 0.45 * Math.sin(x * 0.0035 + t * 0.00022 + p);
    const alpha = Math.sin(x * 0.045 + t * 0.0016 + p) * 9 * env;
    const beta = Math.sin(x * 0.13 + t * 0.0031 + p * 2) * 3.2 * (1.1 - env);
    const theta = Math.sin(x * 0.012 - t * 0.0007 + p) * 10;
    const jitter = Math.sin(x * 0.41 + p) * Math.sin(x * 0.073 + t * 0.001) * 1.6;
    return alpha + beta + theta + jitter;
  };

  function draw(now) {
    const t = now - t0;
    ctx.clearRect(0, 0, w, h);
    const top = h * 0.12, span = h * 0.76, step = span / (CHANNELS - 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (let k = 0; k < CHANNELS; k++) {
      const y0 = top + k * step;
      ctx.beginPath();
      for (let x = 0; x <= w + 4; x += 4) {
        const y = y0 + sig(x + t * 0.03, t, k) * (0.8 + (k % 3) * 0.2);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = accent;
      ctx.globalAlpha = k % 2 ? 0.2 : 0.3;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    // sparse electrode markers on the left edge
    ctx.globalAlpha = 0.35; ctx.fillStyle = ink;
    for (let k = 0; k < CHANNELS; k++) { ctx.beginPath(); ctx.arc(14, top + k * step, 1.6, 0, 6.2832); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  const loop = (now) => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return;      // ~30 fps
    last = now; draw(now);
  };
  const start = () => { if (running || reduce.matches) return; running = true; raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  let visible = true;
  const sync = () => (visible && !document.hidden && !reduce.matches ? start() : stop());

  readColors();
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(canvas);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', () => { sync(); draw(performance.now()); });
  window.addEventListener('themechange', () => { readColors(); draw(performance.now()); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTimeout(() => { readColors(); draw(performance.now()); }, 50));
  resize();
  sync();
}
