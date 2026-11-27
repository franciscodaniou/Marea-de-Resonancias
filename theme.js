/* Modo claro / oscuro: sigue al sistema por defecto; el botón de la barra lateral fija la elección (se recuerda) y «auto» no existe: para volver al sistema basta con borrar el dato del sitio.
   El tema se aplica antes de pintar (script en <head>) y la paleta de fuentes se compensa en app.js; al cambiar se recarga conservando la posición. */
(() => {
  const root = document.documentElement, dark = () => root.dataset.theme === 'dark', st = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const MOON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 9.6A5.4 5.4 0 016.4 3a5.4 5.4 0 106.6 6.6z"/></svg>';
  const SUN = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="2.7"/><path d="M8 1.6v1.5M8 12.9v1.5M1.6 8h1.5M12.9 8h1.5M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1"/></svg>';
  const apply = t => { put('marea-theme', t); try { sessionStorage.setItem('marea-y', String(scrollY)); } catch (e) {} location.reload(); };
  const label = b => { const d = dark(); b.setAttribute('aria-pressed', d); b.setAttribute('aria-label', d ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); b.innerHTML = '<span>' + (d ? 'Modo claro' : 'Modo oscuro') + '</span>' + (d ? SUN : MOON); };
  const build = () => { if (document.querySelector('.thm')) return; const b = document.createElement('button'); b.className = 'thm'; b.type = 'button'; label(b); b.addEventListener('click', () => apply(dark() ? 'light' : 'dark'));
    const rail = document.getElementById('sec'), snd = rail && rail.querySelector('.snd');
    if (snd) snd.after(b); else if (rail) rail.appendChild(b); else { b.classList.add('fl'); document.body.appendChild(b); } };
  addEventListener('keydown', e => { if (e.key !== 't' && e.key !== 'T' || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return; apply(dark() ? 'light' : 'dark'); });
  if (!st('marea-theme') && matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!st('marea-theme')) location.reload(); });
  try { const y = +sessionStorage.getItem('marea-y'); if (y) { sessionStorage.removeItem('marea-y'); addEventListener('load', () => setTimeout(() => scrollTo(0, y), 60)); } } catch (e) {}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(build, 0)); else setTimeout(build, 0);
})();
