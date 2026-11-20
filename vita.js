/* Vitalidad: contadores y barras que se animan al entrar en pantalla (y se reinician al salir).
   Marcado: [data-n="valor"][data-dec="decimales"] cuenta desde 0 · [data-w="%"] barra que crece desde 0 · [data-reveal] se descubre de izquierda a derecha.
   El HTML ya trae el valor final: sin JS (o con movimiento reducido) se ve igual, sin animar. */
(function () {
  const RM = matchMedia('(prefers-reduced-motion:reduce)').matches, ez = t => 1 - Math.pow(1 - t, 3);
  const fmt = (v, d) => v.toFixed(d);
  const io = 'IntersectionObserver' in window && !RM ? new IntersectionObserver(es => es.forEach(e => { const el = e.target; if (e.isIntersecting) { if (!el._on) { el._on = true; play(el); } } else if (el._on) { el._on = false; rest(el); } }), { threshold: .25 }) : null;
  function rest(el) { cancelAnimationFrame(el._r);
    if (el.dataset.n != null) el.textContent = fmt(0, +el.dataset.dec || 0);
    else if (el.dataset.w != null) { el.style.transition = 'none'; el.style.width = '0%'; }
    else if (el.dataset.reveal != null) { el.style.transition = 'none'; el.style.clipPath = 'inset(0 100% 0 0 round 999px)'; } }
  function play(el) { const dl = el._d || 0;
    if (el.dataset.n != null) { const to = +el.dataset.n, d = +el.dataset.dec || 0, T0 = performance.now() + dl, D = 1100;
      const f = now => { const t = Math.max(0, Math.min(1, (now - T0) / D)); el.textContent = fmt(to * ez(t), d); if (t < 1) el._r = requestAnimationFrame(f); else el.textContent = fmt(to, d); }; el._r = requestAnimationFrame(f); }
    else if (el.dataset.w != null) { void el.offsetWidth; el.style.transition = `width 1.15s cubic-bezier(.22,.9,.3,1) ${dl}ms`; el.style.width = el.dataset.w + '%'; }
    else if (el.dataset.reveal != null) { void el.offsetWidth; el.style.transition = `clip-path 1.1s cubic-bezier(.22,.9,.3,1) ${dl}ms`; el.style.clipPath = 'inset(0 0 0 0 round 999px)'; } }
  function scan(root) { if (!io) return; let i = 0;
    (root || document).querySelectorAll('[data-n],[data-w],[data-reveal]').forEach(el => { if (el._v) return; el._v = 1; el._d = Math.min(i++, 9) * 55; rest(el); io.observe(el); }); }
  window.VITA = { scan };
  addEventListener('DOMContentLoaded', () => scan());
})();
