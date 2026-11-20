/* Vitalidad: contadores y barras que se animan al entrar en pantalla (y se reinician al salir del todo).
   Marcado: [data-n="valor"][data-dec="decimales"] cuenta desde 0 · [data-big] cuenta más lento y con «pop» · [data-w="%"] barra que crece desde 0 · [data-reveal] se descubre de izquierda a derecha.
   Dentro de .step la animación es manual (VITA.play / VITA.reset, la dispara story.js cuando el lugar queda en el centro).
   El HTML ya trae el valor final: sin JS (o con movimiento reducido) se ve igual, sin animar. */
(function () {
  const RM = matchMedia('(prefers-reduced-motion:reduce)').matches, ez = t => 1 - Math.pow(1 - t, 3), ex = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const key = el => el.dataset.n != null ? 'n' : el.dataset.w != null ? 'w' : 'r';
  const obs = el => el.dataset.w != null ? (el.closest('.tr,.ba,.bb,.pb') || el.parentElement) : el.dataset.reveal != null ? el.parentElement : el; // las barras miden 0: se observa su pista
  const io = 'IntersectionObserver' in window && !RM ? new IntersectionObserver(es => es.forEach(e => (e.target._vs || []).forEach(el => {
    if (e.isIntersecting && e.intersectionRatio >= .3) { if (!el._on) { el._on = true; play(el); } }
    else if (!e.isIntersecting && el._on) { el._on = false; rest(el); } })), { threshold: [0, .3, .6] }) : null;
  function rest(el) { cancelAnimationFrame(el._r); el.classList.remove('vp');
    if (el.dataset.n != null) el.textContent = (0).toFixed(+el.dataset.dec || 0);
    else if (el.dataset.w != null) { el.style.transition = 'none'; el.style.width = '0%'; }
    else { el.style.transition = 'none'; el.style.clipPath = el instanceof SVGElement ? 'inset(-14px 100% -14px -14px)' : 'inset(0 100% 0 0 round 999px)'; } }
  function play(el) { const dl = el._d || 0, big = el.dataset.big != null;
    if (el.dataset.n != null) { const to = +el.dataset.n, d = +el.dataset.dec || 0, T0 = performance.now() + dl + (big ? 150 : 0), D = big ? 2100 : 1100, f = big ? ex : ez;
      if (big) { void el.offsetWidth; el.classList.add('vp'); }
      const fr = now => { const t = Math.max(0, Math.min(1, (now - T0) / D)); el.textContent = (to * f(t)).toFixed(d); if (t < 1) el._r = requestAnimationFrame(fr); else el.textContent = to.toFixed(d); }; el._r = requestAnimationFrame(fr); }
    else if (el.dataset.w != null) { void el.offsetWidth; el.style.transition = `width 1.2s cubic-bezier(.22,.9,.3,1) ${dl}ms`; el.style.width = el.dataset.w + '%'; }
    else { void el.offsetWidth; el.style.transition = `clip-path 1.2s cubic-bezier(.22,.9,.3,1) ${dl}ms`; el.style.clipPath = el instanceof SVGElement ? 'inset(-14px -14px -14px -14px)' : 'inset(0 0 0 0 round 999px)'; } }
  const all = r => (r || document).querySelectorAll('[data-n],[data-w],[data-reveal]');
  function scan(root) { if (!io) return; let i = 0;
    all(root).forEach(el => { if (el._v) return; el._v = 1; el._d = Math.min(i++, 9) * 55; rest(el);
      if (el.closest('.step')) { el._m = 1; return; }
      const t = obs(el); (t._vs = t._vs || []).push(el); io.observe(t); }); }
  const manual = (root, fn) => { if (!io) return; let i = 0; all(root).forEach(el => { if (!el._m) return; el._d = Math.min(i++, 9) * 55; fn(el); }); };
  window.VITA = { scan,
    play: root => manual(root, el => { el._on = true; play(el); }),
    reset: root => manual(root, el => { el._on = false; rest(el); }) };
  addEventListener('DOMContentLoaded', () => scan());
})();
