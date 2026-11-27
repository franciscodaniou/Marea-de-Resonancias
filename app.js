/* Variación sonora · Barrio Puerto — arte de datos generativo (Canvas 2D)
   Codificación:
   · nodo = sector · rayo = ficha de terreno (ángulo = hora del día, largo = dB mín→máx, punto = dB prom)
   · partículas por rayo: oscilan entre dB mín y máx; velocidad ∝ dB prom; dispersión ∝ flujo vehicular;
     cantidad ∝ flujo peatonal · color = tipo de fuente (V/H/M/N)
   · metabola (silueta líquida) = perfil de dB promedio según la hora
   · halo = agrado percibido en encuestas (coral → ámbar → turquesa) */

const COL = { V: '#D20A2E', H: '#E2AC2C', C: '#6150A2', M: '#1A5E89', N: '#00675B' }; // paleta sobre fondo salvia
/* modo oscuro: la página se invierte con invert()+hue-rotate(180°); para que cada fuente se vea con el color deseado se pre-compensa: P = 1 − Hr·D (Hr·Hr = I a 180°) */
if (window.__DK) { const D = { V: [255, 111, 125], H: [244, 196, 80], C: [170, 156, 255], M: [108, 184, 255], N: [58, 208, 176] }, Hr = [[-.574, 1.43, .144], [.426, .43, .144], [.426, 1.43, -.856]];
  Object.keys(D).forEach(k => { const d = D[k].map(x => x / 255), p = Hr.map(r => 1 - (r[0] * d[0] + r[1] * d[1] + r[2] * d[2])).map(x => Math.round(Math.max(0, Math.min(1, x)) * 255)); COL[k] = '#' + p.map(x => x.toString(16).padStart(2, '0')).join(''); }); }
const CAT = { V: 'Vehicular', H: 'Humana (voces, música)', C: 'Comercial (locales, captadores)', M: 'Mecánica / portuaria', N: 'Natural' };
const rgbOf = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const SH = { V: 'Vehicular', H: 'Humana', C: 'Comercial', M: 'Portuaria', N: 'Natural' };
const F = FICHAS.map((r, i) => { const nd = r[2] == null, gp = nd ? 48 + ((r[10] || 3) - 1) / 4 * 35 : r[3]; // nd = sin dB medido: el relieve usa la intensidad percibida (1–5), nunca se muestra como dB
  return { id: /^apra/.test(r[12] || '') ? 'APrA 2018' : r[11] ? r[11] + '·' + (i - FICHAS.findIndex(q => q[11] === r[11]) + 1) : 'BP-' + String(i + 1).padStart(2, '0'), t: r[0], m: (+r[0].slice(0, 2) < 5 ? 24 : 0) * 60 + +r[0].slice(0, 2) * 60 + +r[0].slice(3), s: r[1], nd, ap: /^apra/.test(r[12] || ''), night: r[12] === 'apra_n',
  mn: nd ? gp - 5 : r[2], pr: gp, mx: nd ? gp + 5 : r[4], fp: r[5], fv: r[6], c: r[7], src: r[8], ph: r[9] }; });
const NSX = Array.from({ length: NS }, (_, i) => i), real = fs => fs.filter(f => !f.nd), hasAg = s => E.some(e => e[0] === s);
const DOM = NSX.map(s => { if (PRED[s]) return PRED[s]; const n = {}; F.filter(f => f.s === s && !f.ap).forEach(f => n[f.c] = (n[f.c] || 0) + 1); let b = 'M', v = 0; ['M', 'V', 'C', 'H', 'N'].forEach(c => { if ((n[c] || 0) > v) { v = n[c]; b = c; } }); return b; });
const E = ENCUESTAS;
const rOf = s => s < 4 ? 0 : 1, rI = s => s < 4 ? s : s - 4, rN = s => s < 4 ? 4 : 2; // fase intermedia: Valparaíso (4 lugares) y Buenos Aires (2)

let CMY0 = 0, CMR0 = 100, mo = 0, LW = 200, CMX = 0, CMY = 0, CMR = 100, cA = 0, cm = 0, CPX = [0, 0], CPY = 0, CPR = 80; const kc = Array(NS).fill(0); // comparativa: la malla acompaña al texto
let CX0 = 0, CY0 = 0, S0 = 100, eS = 0, eR = 0, er = 0, RgR = 100, KR = .64, RC = [[0, 0], [0, 0]], amb = 0, ee = 0, Aglob = 1; // centro y escala de la marea total; progreso de escena
const FILTERS = { all: [0, 1e4], am: [0, 756], pm: [757, 1049], pk: [1050, 1439] };
let flt = 'all', want = null, wantR = null, focR = null, kR = 0, hsR = null, GR = [{ cx: 0, cy: 0, sc: 100, al: 1 }, { cx: 0, cy: 0, sc: 100, al: 1 }],  foc = null, k = 0, pf = null, hov = null, hs = null, W, H, dpr, T = 0, Rb, Rf, FX, FY, ctr = [], G = [], pkey = '';
if (document.fonts && document.fonts.load) ['700 20px "SF Pro"', '400 14px "SF Compact"', '700 14px "SF Compact"', '300 34px "SF Compact"'].forEach(f => document.fonts.load(f));
const cv = document.getElementById('c'), x = cv.getContext('2d'), tip = document.getElementById('tip'), panel = document.getElementById('panel'), back = document.getElementById('back');
let carPos = 0, carTgt = 0, lastCar = false, lastCi = -1, carInit = false, carTm = 0; // móvil: carrusel horizontal de sectores (uno por pantalla)
const car = document.createElement('div'), cdots = document.createElement('div'); car.id = 'car'; cdots.id = 'cdots'; car.innerHTML = '<div class="sl"></div>'.repeat(NS + 2); /* [copia del último, sectores…, copia del primero] → carrusel infinito */ cdots.innerHTML = '<i></i>'.repeat(NS); document.body.append(car, cdots);
let carLast = -1, carWT = 0, legWas = false;
let carRPos = 0, carRTgt = 0, lastCarR = false, lastCiR = -1, carRInit = false, carRTm = 0, carRLast = -1, carRWT = 0; // móvil: carrusel horizontal de las dos ciudades (una por pantalla)
const carR = document.createElement('div'), cdotsR = document.createElement('div'); carR.id = 'carR'; cdotsR.id = 'cdotsR'; carR.innerHTML = '<div class="sl"></div>'.repeat(4); cdotsR.innerHTML = '<i></i><i></i>'; document.body.append(carR, cdotsR);
const carRWrap = () => { const sl = carR.scrollLeft; if (Math.abs(sl - carRLast) > .5) { carRLast = sl; clearTimeout(carRWT); carRWT = setTimeout(carRWrap, 120); return; }
  const d = sl < W * .5 ? 2 : sl > 2.5 * W ? -2 : 0; if (!d) return; carRPos += d; carRTgt += d; carR.style.scrollSnapType = 'none'; carR.style.scrollBehavior = 'auto'; carR.scrollLeft = sl + d * W; carRLast = carR.scrollLeft; setTimeout(() => { carR.style.scrollSnapType = ''; carR.style.scrollBehavior = ''; }, 60); };
carR.addEventListener('scroll', () => { carRTgt = carR.scrollLeft / W - 1; clearTimeout(carRTm); carRTm = setTimeout(carRWrap, 140); }, { passive: true });
carR.addEventListener('click', e => cv.dispatchEvent(new MouseEvent('click', { clientX: e.clientX, clientY: e.clientY, bubbles: true })));
const carWrap = () => { const sl = car.scrollLeft; if (Math.abs(sl - carLast) > .5) { carLast = sl; clearTimeout(carWT); carWT = setTimeout(carWrap, 120); return; } /* solo en reposo: evita saltar en plena inercia */
  const d = sl < W * .5 ? NS : sl > (NS + .5) * W ? -NS : 0; if (!d) return; carPos += d; carTgt += d; car.style.scrollSnapType = 'none'; car.style.scrollBehavior = 'auto'; car.scrollLeft = sl + d * W; carLast = car.scrollLeft; setTimeout(() => { car.style.scrollSnapType = ''; car.style.scrollBehavior = ''; }, 60); };
car.addEventListener('scroll', () => { carTgt = car.scrollLeft / W - 1; clearTimeout(carTm); carTm = setTimeout(carWrap, 140); }, { passive: true });
car.addEventListener('click', e => cv.dispatchEvent(new MouseEvent('click', { clientX: e.clientX, clientY: e.clientY, bubbles: true })));
const lerp = (a, b, t) => a + (b - a) * t, cl = (v, a, b) => Math.max(a, Math.min(b, v));
const iso = () => want !== null || wantR !== null; // vista aislada: un sector o una ciudad
const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const agr = a => { const t = cl((a + 1) / 3, 0, 1); return t < .5 ? mix([210, 10, 46], [226, 172, 44], t * 2) : mix([226, 172, 44], [0, 103, 91], (t - .5) * 2); };
const hex = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };
const mean = (a, f) => a.length ? a.reduce((s, v) => s + f(v), 0) / a.length : 0;
const agrSec = s => mean(E.filter(e => e[0] === s), e => e[1]);
const AGW = v => v < -.5 ? 'incomoda' : v < .5 ? 'da igual' : v < 1.5 ? 'gusta un poco' : 'gusta', AGX = v => v < -.5 ? 'les incomoda' : v < .5 ? 'les da igual' : v < 1.5 ? 'les gusta un poco' : 'les gusta', nEnc = n => `${n} ${n === 1 ? 'encuesta' : 'encuestas'}`, agL2 = s => hasAg(s) ? 'según encuestas: ' + AGX(agrSec(s)) : 'sin encuestas', agL = agL2, dbL = s => dbAvg(s) == null ? 'sin dB medido' : dbAvg(s).toFixed(1) + ' dB promedio';
let srcF = null; // filtro por fuente (se activa tocando un color de la leyenda)
let nightOn = false; const on = f => (f.night ? nightOn && f.s >= 4 : nightOn && f.s >= 4 ? false : f.ap || f.m >= FILTERS[flt][0] && f.m <= FILTERS[flt][1]) && (!srcF || f.c === srcF), FM = F.filter(f => !f.ap), FB = FM.filter(f => f.s < 4), tmx = f => f.ap ? (f.night ? 'noche · modelo' : 'día · modelo') : f.t, apOnly = s => { const q = real(F.filter(f => f.s === s)); return q.length > 0 && q.every(f => f.ap); };
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; // movimiento reducido
// una misma medición puede tener varias fuentes (BP-17 a 19): sus dB y flujos se cuentan una sola vez
const uniq = fs => { const seen = new Set(); return fs.filter(f => { const k = f.nd ? [f.s, f.t, 'nd'].join('|') : [f.s, f.t, f.mn, f.pr, f.mx].join('|'); if (seen.has(k)) return false; seen.add(k); return true; }); };
const dbAvg = s => { const q = real(uniq(F.filter(f => f.s === s && !f.night))); return q.length ? mean(q, f => f.pr) : null; };
const angM = m => -Math.PI / 2 + cl((m - 580) / 570, 0, 1) * Math.PI * 1.9;
const rad = (d, R) => R * (.2 + .8 * (cl(d, 20, 95) - 20) / 75);
const wid = f => .13 + .04 * f.fv;

// flujos: personas = puntos lentos · vehículos = estelas rápidas (cantidad y velocidad ∝ nivel de flujo)
const FL = NSX.map(() => ({ p: Array.from({ length: 130 }, () => ({ a: 0, u: Math.random(), fr: Math.random(), sg: Math.random() < .5 ? 1 : -1, ph: Math.random() * 6.28, sm: .3 + Math.random() * 1.5, t: Math.random() * 3, pause: 0, tu: Math.random(), sz: 2.2 + Math.random() * 2.6 })), v: Array.from({ length: 30 }, (_, i) => ({ a: 0, u: Math.random(), fr: Math.random(), sg: i % 2 ? 1 : -1, ph: Math.random() * 6.28, sm: .5 + Math.random() * 1.1, t: Math.random() * 3, tf: Math.random() })) }));
const DIR = [.35, -.5, 0, 1.2, -.9, .7], LV = ['', 'Bajo', 'Medio', 'Alto'];
const lvl = s => { const fs = uniq(F.filter(f => f.s === s && !f.ap && on(f))); return pf && pf.s === s ? [pf.fp, pf.fv] : [mean(fs, f => f.fp) || 1, mean(fs, f => f.fv) || 1]; };
const FRDB = NSX.map(s => ['am', 'pm', 'pk'].map(k => { const q = real(uniq(F.filter(f => f.s === s && !f.ap && f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1]))); return q.length ? mean(q, f => f.pr) : null; }));
const lvn = v => LV[cl(Math.round(v), 1, 3)];
const cen = (g, f) => { const a = angM(f.m); return [g.cx + Math.cos(a) * g.R * .45, g.cy + Math.sin(a) * g.R * .45, g.R * (.16 + .34 * cl((f.pr - 50) / 30, 0, 1))]; };
const bar = (lab, v, hi, lo = 45, hi2 = 90) => `<div${hi ? ' class="hi"' : ''}>${lab}<span class="tr"><i style="width:${v == null ? 0 : cl((v - lo) / (hi2 - lo), 0, 1) * 100}%"${v == null ? '' : ` data-w="${(cl((v - lo) / (hi2 - lo), 0, 1) * 100).toFixed(1)}"`}></i></span><b${v == null ? '' : ` class="u" data-n="${v.toFixed(0)}"`}>${v == null ? '–' : v.toFixed(0)}</b></div>`;
function horasHtml(s) { // patrón horario del sector (dB promedio, mediciones únicas)
  const ss = Array.isArray(s) ? s : [s], mine = uniq(F.filter(f => ss.includes(f.s))), fr = [['Mañana', 'am'], ['Tarde', 'pm'], ['Hora punta', 'pk']].map(([n, k]) => { const q = real(mine.filter(f => !f.ap && f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1])); return bar(n, q.length ? mean(q, f => f.pr) : null, false); }).join('');
  return `<div class="pf"><h5>Cuánto ruido hay según la hora del día (promedio, en dB)</h5>${fr}${real(mine).length ? '' : '<small class="nd">Sin dB medido en este lugar: el relieve de la malla usa la intensidad percibida.</small>'}</div>`;
}
function compHtml(s) { return `<div class="pf cmpf"><h5>Comparación entre sectores (dB promedio)</h5>${SECT.map((n, i) => bar(n, dbAvg(i), i === s)).join('')}</div>`; }
function flowHtml(s) { const [p, v] = lvl(s); return flowH(p, v); }
function flowH(p, v) { return `<div class="fl"><div>Gente a pie<span class="tr"><i style="width:${p / 3 * 100}%" data-w="${(p / 3 * 100).toFixed(1)}"></i></span><b>${lvn(p)}</b></div><div class="v">Vehículos<span class="tr"><i style="width:${v / 3 * 100}%" data-w="${(v / 3 * 100).toFixed(1)}"></i></span><b>${lvn(v)}</b></div></div>`; }

function panelGeo() { // medidas reales de la tarjeta de «Cada lugar, a cada hora» (ya equilibradas por fitBlk), para replicarlas en el sector expandido
  if (W <= 1100) return null; const blk = document.querySelector('#sref .step .blk'), card = blk && blk.querySelector('.card'); if (!blk || !card) return null;
  const cs = getComputedStyle(blk.parentNode), w = blk.offsetWidth, ch = card.offsetHeight; if (!w || !ch) return null; const tr = blk.style.transform || '', m = /scale\(([\d.]+)\)/.exec(tr), sc = m ? +m[1] : 1;
  return { w, ch, right: parseFloat(cs.paddingRight) || 22, top: parseFloat(cs.paddingTop) || 70, sc, tr: tr || 'none' };
}
function fitPanel() { const g = iso() ? panelGeo() : null, st = panel.style; if (!g) { ['--pw', '--pch', '--pright', '--ptop', '--ptr'].forEach(k => st.removeProperty(k)); return; }
  st.setProperty('--pw', g.w + 'px'); st.setProperty('--pch', g.ch + 'px'); st.setProperty('--pright', g.right + 'px'); st.setProperty('--ptop', g.top + 'px'); st.setProperty('--ptr', g.tr); }
function size() {
  W = innerWidth; H = innerHeight; const mob = W < 760;
  dpr = Math.min(devicePixelRatio || 1, mob ? 1.5 : 2);
  cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  layout();
}
function layout() { // las figuras se reacomodan en sincronía con el pill/leyenda «Cómo leer»
  const mob = W < 760;
  const ansB0 = (document.getElementById('ans') || {getBoundingClientRect: () => ({bottom: 0})}).getBoundingClientRect().bottom, ansB = document.body.classList.contains('legopen') && window.ANS_B0 ? window.ANS_B0 : (window.ANS_B0 = ansB0), top0 = W < 760 ? 160 : W < 1100 ? 64 : iso() ? 124 : (leg.classList.contains('open') && H >= 820) ? 72 + leg.offsetHeight + 14 + (window.ANS_EXTRA || 0) : Math.max(72 + 38 + 14 + (window.ANS_EXTRA || 0), (innerWidth >= 1100 ? 0 : Math.round(ansB) + 22)), LB = mob ? 106 : H < 760 ? 150 : 176, gh = H - (mob ? 124 : 100) - top0, gw = W - (mob ? 28 : 76), x0 = mob ? 14 : 22;
  const minCw = mob ? 170 : 190; let best = null; // columnas: todas en fila, 3 o 2; el ancho de celda debe alojar la etiqueta
  (mob ? [2] : [NS, 3, 2]).forEach(c => { const nr = Math.ceil(NS / c); if (c > 2 && gw / c < minCw) return; const r = Math.min(gw / c / 2.05, (gh / nr - LB) / 2.2); if (!best || r > best.r) best = { c, nr, r }; });
  if (!best) { const nr = Math.ceil(NS / 2); best = { c: 2, nr, r: Math.min(gw / 2 / 2.05, (gh / nr - LB) / 2.2) }; }
  Rb = best.r; LW = gw / best.c; const bh = 2.2 * Rb + LB, off = (gh / best.nr - bh) / 2;
  ctr = NSX.map(i => { const rw = Math.floor(i / best.c), inRow = Math.min(best.c, NS - rw * best.c), cx = i % best.c + (best.c - inRow) / 2; return [x0 + gw * (cx + .5) / best.c, top0 + (gh / best.nr) * rw + off + 8 + Rb * 1.08]; });
  if (mob) { const ghc = H - 150 - top0, LBc = 184; Rb = Math.max(70, Math.min(gw / 2.1, (ghc - LBc) / 2.1)); LW = gw; const cyc = top0 + 8 + Rb * 1.08 + Math.max(0, (ghc - LBc - 2.2 * Rb) / 2); ctr = NSX.map(i => [W / 2 + i * W, cyc]); car.style.top = top0 + 'px'; car.style.height = Math.max(0, ghc) + 'px'; cdots.style.top = Math.round(Math.max(top0 + 6, cyc - Rb * 1.15 - 22)) + 'px'; }
  const tab = W < 1100; CMX = tab ? W / 2 : W * .27; CMY = tab ? H * .37 : H * .70; CMR = tab ? Math.min(W * .26, H * .115) : Math.min(W * .15, H * .23); CMY0 = CMY; CMR0 = CMR;
  CPX = mob ? [W * .27, W * .73] : tab ? [W * .27, W * .73] : [W * .145, W * .41]; CPY = tab ? H * .385 : H * .72; CPR = tab ? Math.min(W * .27, H * .115) : Math.min(W * .165, H * .3);
  CX0 = x0 + gw / 2; CY0 = top0 + gh / 2 + (mob ? -8 : 0); S0 = W >= 760 && W < 1100 && H > W ? Math.min(gw * .18, gh * .3) : Math.min(gw * (mob ? (H < 700 ? .25 : .3) : .15), gh * (mob ? (H < 720 ? .27 : .38) : .36));
  if (mob) { // móvil: figura arriba, panel como hoja inferior (la mitad inferior de la pantalla)
    const pt = Math.round(H * .5), t1 = 100, A = pt - t1 - 6;
    Rf = Math.max(60, Math.min(W * .36, (A - 90) / 2.2)); FX = W / 2; FY = t1 + (A - 90 - 2.2 * Rf) / 2 + 1.06 * Rf;
    document.documentElement.style.setProperty('--pt', pt + 'px');
  } else {
    const fl = W < 900 ? 20 : 300, fr = W < 900 ? W - 20 : W - 440 - 22 - 30, fw = fr - fl; Rf = Math.max(80, Math.min((gh - 84) / 2.2, fw / 2.3));
    FX = fl + fw / 2; FY = top0 + 8 + Rf * 1.08 + (gh - 84 - 2.2 * Rf) / 2;
    const pg = iso() ? panelGeo() : null; // sector expandido (escritorio): el modelo crece un poco y se centra en el espacio libre fuera de la tarjeta (x) y en el alto útil (y)
    if (pg) { const cl0 = W - pg.right - pg.w * pg.sc; Rf = Math.max(80, Math.min(H * .32, (H - 260) / 2.12, (cl0 - 90) / 2.3)); FX = cl0 / 2; FY = (90 + H - 92) / 2 - .06 * Rf - 39; }
  }
  if (W >= 1100) S0 = Math.min(S0, H * .245); // proporción figura/alto como en escritorio estándar
  { KR = mob ? .58 : W < 1100 ? .5 : .6; const LBr = mob ? 160 : 215, r = Math.min(mob ? gw / 2.15 : gw / 2 / 2.05, (gh - LBr) / 2.2); RgR = Math.max(50, Math.min(r, mob ? 1e4 : S0 * 1.35)); if (mob) RgR = Math.max(50, Math.min(RgR, (H - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barh')) || 90) - 78 - 186 - top0) / 2.1)); const rcy = top0 + 8 + RgR * 1.08 + Math.max(0, (gh - LBr - 2.2 * RgR) / 2); let rcy2 = rcy; if (mob) { const dt = H - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barh')) || 90) - 78; rcy2 = Math.max(top0 + RgR * 1.05, Math.min(rcy, dt - 8 - RgR * 1.12 - 182)); } RC = mob ? [[W / 2, rcy2], [W / 2 + W, rcy2]] : [[x0 + gw * .25, rcy2], [x0 + gw * .75, rcy2]]; if (mob) { carR.style.top = top0 + 'px'; carR.style.height = Math.max(0, H - 150 - top0) + 'px'; cdotsR.style.top = Math.round(Math.max(top0 + 6, rcy2 - RgR * 1.15 - 22)) + 'px'; } } // fase intermedia: dos ciudades lado a lado
  FP = Math.max(560, Math.max(S0, Rb * .48, Rf * .48, RgR * KR) * 3.3); fitPanel(); // la focal crece con la escala: en pantallas grandes la malla ya no se sale de cuadro
}

const PAIR = () => (window.MAREA && MAREA.pair) || [0, 1];
const AGS = NSX.map(s => [-1, 0, 1, 2].map(v => E.filter(e => e[0] === s && e[1] === v).length)), AGC = ['#D20A2E', '#a39f8a', '#5E9C8F', '#00675B'];
function geoms() {
  G = NSX.map(s => {
    const kk = foc === s ? k : 0; let cx = lerp(W < 760 ? W / 2 + (s - carPos - NS * Math.round((s - carPos) / NS)) * W : ctr[s][0], FX, kk), cy = lerp(ctr[s][1], FY, kk), R = lerp(Rb, Rf, kk), al = foc === null || foc === s ? 1 : 1 - k;
    if (cA > .001) { const q = kc[s], pi = PAIR().indexOf(s), tm = pi >= 0 ? cm : 0; cx = lerp(cx, lerp(CMX, CPX[pi] || CMX, tm), q); cy = lerp(cy, lerp(CMY - (W < 760 ? mo * H * .095 : 0), CPY, tm), q); R = lerp(R, lerp(CMR * (W < 760 ? 1 - mo * .5 : 1), CPR, tm), q); al *= lerp(1 - cA, 1, q); }
    return { cx, cy, R, al, kk };
  });
}

function geomsR() { // fase de dos ciudades: al aislar una, su malla crece y se centra como en un sector expandido
  GR = [0, 1].map(i => { const kk = focR === i ? kR : 0; const bx = W < 760 ? W / 2 + (i - carRPos - 2 * Math.round((i - carRPos) / 2)) * W : RC[i][0]; return { cx: lerp(bx, FX, kk), cy: lerp(RC[i][1], FY, kk), sc: lerp(RgR * KR, Rf * .48, kk), al: focR === null || focR === i ? 1 : 1 - kR }; });
}

// ===== Marea de resonancias: malla orgánica (tubo deformado por ruido Perlin) =====
// Malla: largo = hora (09:40 → 18:50) · alrededor = fuente de sonido · relieve = dB · color = lugar · puntos = fichas
const TAU = Math.PI * 2, NZ = 30, NA = 28, NV = (NZ + 1) * (NA + 1), LZ = 3.2; let FP = 560;
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const PERM = (() => { const p = [], r = mulberry(7); for (let i = 0; i < 256; i++) p[i] = i; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p.concat(p); })();
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const grd = (h, a, b, c) => { const u = h < 8 ? a : b, v = h < 4 ? b : (h === 12 || h === 14 ? a : c); return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
function pn(a, b, c) {
  const X = Math.floor(a) & 255, Y = Math.floor(b) & 255, Z = Math.floor(c) & 255; a -= Math.floor(a); b -= Math.floor(b); c -= Math.floor(c);
  const u = fade(a), v = fade(b), w = fade(c), A = PERM[X] + Y, AA = PERM[A] + Z, AB = PERM[A + 1] + Z, B = PERM[X + 1] + Y, BA = PERM[B] + Z, BB = PERM[B + 1] + Z;
  return .5 + .5 * lerp(lerp(lerp(grd(PERM[AA], a, b, c), grd(PERM[BA], a - 1, b, c), u), lerp(grd(PERM[AB], a, b - 1, c), grd(PERM[BB], a - 1, b - 1, c), u), v),
    lerp(lerp(grd(PERM[AA + 1], a, b, c - 1), grd(PERM[BA + 1], a - 1, b, c - 1), u), lerp(grd(PERM[AB + 1], a, b - 1, c - 1), grd(PERM[BB + 1], a - 1, b - 1, c - 1), u), v), w);
}
const CI = { V: 0, H: 1, C: 2, M: 3, N: 4 }, CK = ['V', 'H', 'C', 'M', 'N'], CRGB = CK.map(q => rgbOf(COL[q]).join(','));
F.forEach((f, i) => {
  const jit = (((i * 37) % 11) - 5) / 5 * .05;
  f.u = cl((f.m - 580) / 570, 0, 1);                          // posición a lo largo de la malla = hora
  f.fl = (((CI[f.c] + .5) / 5 + jit) % 1 + 1) % 1;            // posición alrededor = fuente (carril)
  f.fgR = (rI(f.s) + f.fl) / rN(f.s);                         // idem en la fase de dos ciudades
  f.fg = (f.s + f.fl) / NS;                                    // idem en la marea total (cada lugar ocupa un cuarto)
  f.sg = .035 + .075 * cl((f.mx - f.mn) / 60, 0, 1);          // ancho de la zona iluminada = rango dB
  f.amp = Math.max(-.08, (f.pr - 48) / 35 * .55);             // relieve = dB promedio
  if (f.night) { f.ampN = f.amp; f.amp = 0; }                  // referencia nocturna: su relieve solo entra en el paso «Noche» (ver nt)
  f.hf = ((i * 53) % 17) / 17;
});
const dfr = (a, b) => { const d = Math.abs(a - b) % 1; return d > .5 ? 1 - d : d; };
const gws = (f, fr, u, g, sg) => { const a = dfr(fr, g), b = u - f.u; return Math.exp(-(a * a / (2 * sg * sg) + b * b / (2 * .04 * .04))); };
const MS = NSX.map(s => {
  const m = { nt: 0, bBD: new Float32Array(NV), bBN: new Float32Array(NV), bSD: new Float32Array(NV), bSN: new Float32Array(NV), bR: new Float32Array(NV), bRD: new Float32Array(NV), bRN: new Float32Array(NV), ER: new Float32Array(NV), SX: new Float32Array(NV), SY: new Float32Array(NV), LW: new Float32Array(NV), LC: new Uint8Array(NV), hv: new Float32Array(NV), EV: new Float32Array(NV), bB: new Float32Array(NV), bS: new Float32Array(NV), ttS: 0 };
  const own = F.filter(f => f.s === s);
  own.forEach(f => { f.litB = []; f.litS = []; f.litR = []; });
  for (let i = 0; i <= NZ; i++) for (let j = 0; j <= NA; j++) {
    const id = i * (NA + 1) + j, u = i / NZ, frB = (s + j / NA) / NS, frS = j / NA, frR = (rI(s) + j / NA) / rN(s), nR = rN(s);
    m.hv[id] = pn(i * .21 + s * 5, j * .21, 3.3);
    F.forEach(f => { const w = f.amp * gws(f, frB, u, f.fg, f.sg / NS); if (f.night) m.bBN[id] += f.ampN * gws(f, frB, u, f.fg, f.sg / NS); else if (f.ap) m.bBD[id] += w; else m.bB[id] += w; });
    F.forEach(f => { if (rOf(f.s) !== rOf(s)) return; const gr = gws(f, frR, u, f.fgR, f.sg / nR); if (f.night) m.bRN[id] += f.ampN * gr; else if (f.ap) m.bRD[id] += f.amp * gr; else m.bR[id] += f.amp * gr; });
    own.forEach(f => { const wr = gws(f, frR, u, f.fgR, f.sg / nR); if (wr > .07) f.litR.push(id, wr); });
    own.forEach(f => { const w = f.amp * gws(f, frS, u, f.fl, f.sg); if (f.night) m.bSN[id] += f.ampN * gws(f, frS, u, f.fl, f.sg); else if (f.ap) m.bSD[id] += w; else m.bS[id] += w; const wb = gws(f, frB, u, f.fg, f.sg / NS), ws = gws(f, frS, u, f.fl, f.sg); if (wb > .07) f.litB.push(id, wb); if (ws > .07) f.litS.push(id, ws); });
  }
  return m;
});
F.forEach(f => { f.bAB = 0; f.bAS = 0; f.bAR = 0; F.forEach(g => { if (g.ap) return; f.bAB += g.amp * gws(g, f.fg, f.u, g.fg, g.sg / NS); if (rOf(g.s) === rOf(f.s)) f.bAR += g.amp * gws(g, f.fgR, f.u, g.fgR, g.sg / rN(g.s)); if (g.s === f.s) f.bAS += g.amp * gws(g, f.fl, f.u, g.fl, g.sg); }); });

let cY = 1, sY = 0, cX = 1, sX = 0, RX_ = 0, RY_ = 0, RZ_ = 0, oy = 0, ox = 0;
const rot = (a, b, c, S) => { const x1 = a * cY + c * sY, z1 = -a * sY + c * cY, y2 = b * cX - z1 * sX, z2 = b * sX + z1 * cX; RX_ = x1 * S; RY_ = y2 * S; RZ_ = z2 * S; };
const rad0 = (th, u, tt, off) => .30 + .85 * pn(Math.cos(th) * 1.3 + off, Math.sin(th) * 1.3 + off, u * 2.2 - tt);
const evOf = (ee0, h) => ee0 <= 0 ? 0 : ee0 >= 1 ? 1 : cl(ee0 * 1.6 - .6 * h, 0, 1); // el paso de marea total a sectores se disuelve por zonas

function updMesh(s, ee0, er0) {
  const m = MS[s], g = G[s], ag = cl(1 - (agrSec(s) + 1) / 3, 0, 1), rm = RM ? .2 : 1, ttS = T * rm * (.16 + .5 * ag), ttB = T * rm * .3, S1 = g.R * .48, SR = GR[rOf(s)].sc, rg = rOf(s), nR = rN(s); m.ttS = ttS;
  for (let i = 0; i <= NZ; i++) {
    const u = i / NZ, zz = (u - .5) * LZ;
    for (let j = 0; j <= NA; j++) {
      const id = i * (NA + 1) + j, ev = evOf(ee0, m.hv[id]), er = evOf(er0, m.hv[id]); let bx = 0, by = 0, bz = 0, rx = 0, ry = 0, rz = 0, qx = 0, qy = 0, qz = 0;
      if (ev < 1 && er < 1) { const th = (s + j / NA) / NS * TAU, r = Math.max(.16, rad0(th, u, ttB, 11.3) + m.bB[id] + m.bBD[id] * (1 - m.nt) + m.bBN[id] * m.nt); rot(r * Math.cos(th), r * Math.sin(th), zz, S0); bx = RX_; by = RY_; bz = RZ_; }
      if (ev < 1 && er > 0) { const th = (rI(s) + j / NA) / nR * TAU, r = Math.max(.16, rad0(th, u, ttB, 11.3 + rg * 5.9) + m.bR[id] + m.bRD[id] * (1 - m.nt) + m.bRN[id] * m.nt); rot(r * Math.cos(th), r * Math.sin(th), zz, SR); rx = RX_; ry = RY_; rz = RZ_; }
      if (ev > 0) { const th = j / NA * TAU, r = Math.max(.16, rad0(th, u, ttS, s * 3.7) + m.bS[id] + m.bSD[id] * (1 - m.nt) + m.bSN[id] * m.nt); rot(r * Math.cos(th), r * Math.sin(th), zz, S1); qx = RX_; qy = RY_; qz = RZ_; }
      const px = lerp(bx, rx, er), py = lerp(by, ry, er), pz = lerp(bz, rz, er), cx1 = lerp(CX0, GR[rg].cx, er), cy1 = lerp(CY0, GR[rg].cy, er);
      const kf = FP / (FP + lerp(pz, qz, ev));
      m.SX[id] = lerp(cx1, g.cx, ev) + lerp(px, qx, ev) * kf; m.SY[id] = lerp(cy1, g.cy, ev) + lerp(py, qy, ev) * kf; m.EV[id] = ev; m.ER[id] = er;
    }
  }
}
function put(m, id, w, f, ph, mul) { const i = (id / (NA + 1)) | 0, pl = .4 + .6 * Math.pow(.5 + .5 * Math.sin(ph - i / NZ * 9), 2), v = w * pl * mul; if (v > m.LW[id]) { m.LW[id] = v; m.LC[id] = CI[f.c]; } }
function lightMesh(s) { // cada ficha ilumina parte de la malla; cada tramo tiene un solo color (el de la ficha más fuerte)
  const m = MS[s], rm = RM ? .2 : 1; m.LW.fill(0); m.nt += ((nightOn && s >= 4 ? 1 : 0) - m.nt) * .08;
  F.forEach(f => {
    if (f.s !== s || !on(f)) return;
    const h = hov === f || pf === f, mul = (pf && pf !== f ? .22 : 1) * (h ? 1.6 : 1), ph = T * rm * (1 + f.pr / 45);
    for (let q = 0; q < f.litB.length; q += 2) { const id = f.litB[q], w = f.litB[q + 1] * (1 - m.EV[id]) * (1 - m.ER[id]); if (w > .05) put(m, id, w, f, ph, mul); }
    for (let q = 0; q < f.litR.length; q += 2) { const id = f.litR[q], w = f.litR[q + 1] * (1 - m.EV[id]) * m.ER[id]; if (w > .05) put(m, id, w, f, ph, mul); }
    for (let q = 0; q < f.litS.length; q += 2) { const id = f.litS[q], w = f.litS[q + 1] * m.EV[id]; if (w > .05) put(m, id, w, f, ph, mul); }
  });
}
function drawMesh(s, al, e1) {
  const m = MS[s], c = rgbOf(COL[DOM[s]]).join(','), n1 = NA + 1;
  x.globalCompositeOperation = 'source-over'; x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 1;
  x.strokeStyle = `rgba(${c},${.42 * al})`; x.beginPath();
  for (let i = 0; i <= NZ; i++) { const o = i * n1; x.moveTo(m.SX[o], m.SY[o]); for (let j = 1; j <= NA; j++) x.lineTo(m.SX[o + j], m.SY[o + j]); }
  x.stroke();
  if (e1 > .5) { x.strokeStyle = `rgba(${c},${.42 * al * cl((e1 - .5) / .4, 0, 1)})`; x.beginPath(); for (let i = 0; i <= NZ; i++) { const o = i * n1; x.moveTo(m.SX[o + NA], m.SY[o + NA]); x.lineTo(m.SX[o], m.SY[o]); } x.stroke(); }
  x.strokeStyle = `rgba(${c},${.26 * al})`; x.beginPath();
  for (let j = 0; j < NA; j++) { x.moveTo(m.SX[j], m.SY[j]); for (let i = 1; i <= NZ; i++) x.lineTo(m.SX[i * n1 + j], m.SY[i * n1 + j]); }
  x.stroke();
  for (let i = 0; i <= NZ; i++) for (let j = 0; j <= NA; j++) { // tramos iluminados: halo, color y núcleo claro (efecto luminoso sobre fondo claro)
    const id = i * n1 + j, w = m.LW[id]; if (w < .1) continue;
    const wv = Math.min(1, w), lw = W < 760 ? (w > 1.05 ? 2.1 : 1.3) : (w > 1.05 ? 3 : 1.9), cc = CRGB[m.LC[id]];
    x.beginPath();
    if (j < NA) { x.moveTo(m.SX[id], m.SY[id]); x.lineTo(m.SX[id + 1], m.SY[id + 1]); }
    if (i < NZ) { x.moveTo(m.SX[id], m.SY[id]); x.lineTo(m.SX[id + n1], m.SY[id + n1]); }
    x.lineWidth = lw * 4.4; x.strokeStyle = `rgba(${cc},${.14 * wv * al})`; x.stroke();
    x.lineWidth = lw; x.strokeStyle = `rgba(${cc},${wv * al})`; x.stroke();
    x.lineWidth = lw * .38; x.strokeStyle = `rgba(255,255,255,${.6 * wv * al})`; x.stroke();
  }
}
const DOTS = [];
function calcDots(ee0, er0) {
  DOTS.length = 0;
  F.forEach(f => {
    const g = G[f.s], al = g.al * Aglob * GR[rOf(f.s)].al; if (al < .05 || !on(f)) return;
    const ev = evOf(ee0, f.hf), er = evOf(er0, f.hf), zz = (f.u - .5) * LZ, ag = cl(1 - (agrSec(f.s) + 1) / 3, 0, 1), rm = RM ? .2 : 1, rg = rOf(f.s); let bx = 0, by = 0, bz = 0, rx = 0, ry = 0, rz = 0, qx = 0, qy = 0, qz = 0;
    if (ev < 1 && er < 1) { const th = f.fg * TAU, r = Math.max(.16, rad0(th, f.u, T * rm * .3, 11.3) + f.bAB); rot(r * Math.cos(th), r * Math.sin(th), zz, S0); bx = RX_; by = RY_; bz = RZ_; }
    if (ev < 1 && er > 0) { const th = f.fgR * TAU, r = Math.max(.16, rad0(th, f.u, T * rm * .3, 11.3 + rg * 5.9) + f.bAR); rot(r * Math.cos(th), r * Math.sin(th), zz, GR[rg].sc); rx = RX_; ry = RY_; rz = RZ_; }
    if (ev > 0) { const th = f.fl * TAU, r = Math.max(.16, rad0(th, f.u, T * rm * (.16 + .5 * ag), f.s * 3.7) + f.bAS); rot(r * Math.cos(th), r * Math.sin(th), zz, g.R * .48); qx = RX_; qy = RY_; qz = RZ_; }
    const px = lerp(bx, rx, er), py = lerp(by, ry, er), pz = lerp(bz, rz, er), cx1 = lerp(CX0, GR[rg].cx, er), cy1 = lerp(CY0, GR[rg].cy, er), kf = FP / (FP + lerp(pz, qz, ev));
    DOTS.push({ f, x: lerp(cx1, g.cx, ev) + lerp(px, qx, ev) * kf, y: lerp(cy1, g.cy, ev) + lerp(py, qy, ev) * kf, al });
  });
}
const lite = (c, t) => c.map(v => Math.round(v + (255 - v) * t)), dark = (c, t) => c.map(v => Math.round(v * (1 - t)));
const CRGBA = CK.map(q => rgbOf(COL[q]));
const fbk = fcard;
const qCol = s => 'rgb(' + dark(rgbOf(COL[DOM[s]]), .32).join(',') + ')'; // la cita toma el color de la fuente que predomina, oscurecido para leerse
const fiBlock = o => o ? `<div class="fi2">${o.map(([k, t]) => `<div><b>${k}</b><span>${t}</span></div>`).join('')}</div>` : '';
const AGP = ['se sienten incómodas', 'sienten que da igual', 'les gusta un poco', 'les gusta']; // texto llano del agrado: sin escalas ni ceros
const agCap = (ags, n) => { const ps = ags.map((c, k) => c ? `<b style="color:${AGC[k]}">${c}</b> ${AGP[k]}` : '').filter(Boolean), t = ps.length > 1 ? ps.slice(0, -1).join(', ') + ' y ' + ps[ps.length - 1] : ps[0]; return `<small>De ${n} ${n === 1 ? 'persona encuestada' : 'personas encuestadas'}: ${t}.</small>`; };
const factLine = (peak, p, v, extra = '') => peak == null ? 'Sin dB medido en este lugar' : `Lo más fuerte que se midió: <b><span data-n="${peak}">${peak}</span> dB</b>${extra}`;

function bead(px, py, r, rgb, a, h) {
  const c = rgb.join(','), lt = lite(rgb, .55).join(','), dk = dark(rgb, .4).join(','), mob = W < 760;
  let g = x.createRadialGradient(px + r * .25, py + r * .9, 0, px + r * .25, py + r * .9, r * 2.2);             // sombra coloreada, como en el vidrio sobre superficie
  g.addColorStop(0, `rgba(${c},${.3 * a})`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.beginPath(); x.arc(px + r * .25, py + r * .9, r * 2.2, 0, TAU); x.fill();
  g = x.createRadialGradient(px - r * .3, py - r * .35, r * .1, px, py, r);                                      // cuerpo translúcido: al superponerse se oscurece (lente)
  g.addColorStop(0, `rgba(${lt},${.62 * a})`); g.addColorStop(.6, `rgba(${c},${.58 * a})`); g.addColorStop(1, `rgba(${dk},${.78 * a})`); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
  x.lineWidth = mob ? .8 : 1.1; x.strokeStyle = `rgba(${dk},${.35 * a})`; x.beginPath(); x.arc(px, py, r * .8, 0, TAU); x.stroke();     // contorno interior de refracción
  g = x.createLinearGradient(px - r, py - r, px + r, py + r);                                                    // borde: luz arriba-izquierda, color oscuro abajo-derecha
  g.addColorStop(0, `rgba(255,255,255,${.95 * a})`); g.addColorStop(.45, `rgba(255,255,255,${.1 * a})`); g.addColorStop(1, `rgba(${dk},${.7 * a})`);
  x.strokeStyle = g; x.lineWidth = mob ? 1 : 1.5; x.beginPath(); x.arc(px, py, r - .5, 0, TAU); x.stroke();
  x.fillStyle = `rgba(255,255,255,${.7 * a})`; x.beginPath(); x.ellipse(px - r * .36, py - r * .42, r * .26, r * .13, -.65, 0, TAU); x.fill();
  if (h) { x.strokeStyle = `rgba(${c},${.55 * a})`; x.lineWidth = 1.2; x.beginPath(); x.arc(px, py, r * 1.55, 0, TAU); x.stroke(); }
}
function drawDots() {
  const mob = W < 760; x.globalCompositeOperation = 'source-over';
  DOTS.forEach(d => { const f = d.f, h = hov === f || pf === f; bead(d.x, d.y, (mob ? 4.4 : 6) * (h ? 1.6 : 1), CRGBA[CI[f.c]], d.al * (pf && pf !== f ? .25 : 1), h); });
}
const ptOn = (s, u, fr) => { // punto de la malla (u: largo, fr: vuelta 0-1) por interpolación bilineal de los vértices proyectados
  const m = MS[s], fi = cl(u, 0, 1) * NZ, fj = (((fr % 1) + 1) % 1) * NA, i = Math.min(NZ - 1, Math.floor(fi)), j = Math.min(NA - 1, Math.floor(fj)), a = fi - i, b = fj - j, o = i * (NA + 1) + j, o2 = o + NA + 1;
  return [lerp(lerp(m.SX[o], m.SX[o + 1], b), lerp(m.SX[o2], m.SX[o2 + 1], b), a), lerp(lerp(m.SY[o], m.SY[o + 1], b), lerp(m.SY[o2], m.SY[o2 + 1], b), a)];
};
function flows(s, dt, al) {
  const [lp, lv] = lvl(s), tp = (lp - 1) / 2, tv = (lv - 1) / 2, nP = Math.round(lerp(10, 130, tp)), nV = Math.round(lerp(2, 30, tv)), ag = cl(1 - (agrSec(s) + 1) / 3, 0, 1);
  x.globalCompositeOperation = 'source-over'; x.lineCap = 'round'; x.lineJoin = 'round';
  FL[s].p.forEach((q, i) => {
    q.a += ((i < nP ? 1 : 0) - q.a) * .08; if (q.a < .03) { q.u = Math.random(); q.fr = Math.random(); return; }
    q.t -= dt; if (q.t <= 0) { q.t = .8 + Math.random() * (4 - 2.5 * ag); if (Math.random() < .35) q.sg = -q.sg; q.pause = Math.random() < .3 * (1 - ag * .5) ? 1 + Math.random() * 2.5 : 0; q.tu = Math.random(); }
    q.pause = Math.max(0, q.pause - dt);
    const spd = q.pause > 0 ? .01 : lerp(.02, .1, tp) * q.sm * (1 + ag * .9 * Math.sin(T * 2.7 + q.ph));
    q.fr = (q.fr + spd * dt * q.sg + 1) % 1; q.u = cl(q.u + (q.tu - q.u) * dt * (.15 + ag * .6) + Math.sin(T * 1.3 + q.ph) * dt * ag * .08, .01, .99);
    const p = ptOn(s, q.u, q.fr), j = ag * 6;
    x.fillStyle = `rgba(70,78,62,${(.34 + .3 * Math.sin(T * 2 + q.ph)) * q.a * al})`; x.beginPath(); x.arc(p[0] + Math.cos(T * 2.1 + q.ph) * j, p[1] + Math.sin(T * 1.7 + q.ph * 2) * j, q.sz * (W < 760 ? .6 : .82), 0, TAU); x.fill();
  });
  x.lineWidth = W < 760 ? 2 : 3;
  FL[s].v.forEach((q, i) => {
    q.a += ((i < nV ? 1 : 0) - q.a) * .08; if (q.a < .03) return;
    q.t -= dt; if (q.t <= 0) { q.t = 1 + Math.random() * 3; q.tf = Math.random(); if (Math.random() < .25) q.sg = -q.sg; }
    const brake = .35 + .65 * Math.abs(Math.sin(T * (.5 + q.sm * .5) + q.ph)), spd = lerp(.07, .35, tv) * q.sm * brake * (1 + ag * .6 * Math.sin(T * 4 + q.ph)), Lu = Math.min(.3, spd * .3 + .04);
    q.u += spd * dt * q.sg; if (q.u > 1) q.u -= 1; if (q.u < 0) q.u += 1; q.fr += (q.tf - q.fr) * dt * .4;
    x.strokeStyle = `rgba(59,66,52,${.85 * q.a * al})`; x.beginPath();
    for (let j = 0; j <= 4; j++) { const p = ptOn(s, cl(q.u - q.sg * Lu * j / 4, 0, 1), q.fr); j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }
    x.stroke();
  });
}

const REG = [{ n: 'Valparaíso', ss: [0, 1, 2, 3] }, { n: 'Buenos Aires', ss: [4, 5] }];
REG.forEach(R => { const q = uniq(F.filter(f => R.ss.includes(f.s) && !f.ap && !f.night)), qr = real(q), cnt = {}; q.forEach(f => cnt[f.c] = (cnt[f.c] || 0) + 1);
  R.nm = q.length; R.db = qr.length ? mean(qr, f => f.pr) : null; R.fr = ['am', 'pm', 'pk'].map(k => { const z = qr.filter(f => f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1]); return z.length ? mean(z, f => f.pr) : null; });
  let b = 'M', v = 0; ['M', 'V', 'C', 'H', 'N'].forEach(c => { if ((cnt[c] || 0) > v) { v = cnt[c]; b = c; } }); R.dom = b;
  const es = E.filter(e => R.ss.includes(e[0])); R.ag = es.length ? mean(es, e => e[1]) : null; R.ne = es.length;
  R.p = mean(q.filter(f => f.fp != null), f => f.fp) || 1; R.v = mean(q.filter(f => f.fv != null), f => f.fv) || 1; });
function regLab(i, a) { // bajada de cada ciudad: mismos datos y composición que la de cada lugar, promediando sus mediciones
  const R = REG[i], cx = GR[i].cx, mob = W < 760, c = rgbOf(COL[R.dom]), y = GR[i].cy + RgR * (mob ? 1.12 : 1.22) + (mob ? 26 : 22), cellW = mob ? W - 28 : W * .5 - 38, sc = mob ? Math.min(1, cellW / 176) : Math.min(1, cellW / 250);
  x.save(); x.textAlign = 'center'; if (sc < 1) { x.translate(cx, y); x.scale(sc, sc); x.translate(-cx, -y); }
  const rz = fact() ? fst(fsel(R.ss, flt, srcF)) : null, rdb = rz ? rz.db : R.db, rfr = srcF ? ['am', 'pm', 'pk'].map(k => fst(fsel(R.ss, k, srcF)).db) : R.fr, nd = rdb == null, dv = nd ? 0 : rdb * cl(a * 1.15, 0, 1), o1 = 36, bw = Math.min(mob ? 190 : 150, cellW / sc - 12), by = y + o1 + 8, py = mob ? 0 : 40;
  const rr = (px, qy, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(px, qy, w, h, r); else x.rect(px, qy, w, h); x.fill(); };
  x.globalAlpha = a; x.fillStyle = '#3b4234'; x.font = `700 ${mob ? 19 : 20}px "SF Pro",sans-serif`; x.fillText(R.n.toUpperCase(), cx, y);
  { const nf = `300 ${mob ? 34 : 32}px "SF Compact",sans-serif`, uf = '13px "SF Compact",sans-serif', ns = dv.toFixed(1), un = ' dB promedio'; x.font = nf; const w1 = x.measureText(ns).width; x.font = uf; const w2 = x.measureText(un).width, x0 = cx - (w1 + w2) / 2; x.textAlign = 'left';
    x.font = nf; x.fillStyle = `rgb(${c})`; x.fillText(ns, x0, y + o1 + (mob ? 2 : 4)); x.font = uf; x.fillStyle = '#8F9984'; x.fillText(un, x0 + w1, y + o1 + (mob ? 2 : 4)); x.textAlign = 'center'; }
  const bh = 7, by2 = by + 3; x.globalAlpha = a * .16; x.fillStyle = '#5E6655'; rr(cx - bw / 2, by2, bw, bh, bh / 2); x.globalAlpha = a; x.fillStyle = `rgb(${c})`; rr(cx - bw / 2, by2, Math.max(bh, bw * cl((dv - 40) / 55, 0, 1)), bh, bh / 2);
  if (!mob) { const names = ['Mañana', 'Tarde', 'H. punta'], ks = ['am', 'pm', 'pk'], base = by + 46; rfr.forEach((v, j) => { const cxp = cx + (j - 1) * 46, hh = v == null ? 3 : Math.max(3, cl((v - 55) / 25, 0, 1) * 24 + 3); x.globalAlpha = a * (v == null ? .16 : (flt === 'all' || flt === ks[j] ? .9 : .35)); x.fillStyle = v == null ? '#5E6655' : `rgb(${c})`; rr(cxp - 9, base - hh, 18, hh, 3); x.globalAlpha = a; x.fillStyle = '#8F9984'; x.font = '10px "SF Compact",sans-serif'; x.fillText(names[j], cxp, base + 12); }); x.globalAlpha = a; }
  x.font = '15px "SF Compact",sans-serif'; x.fillStyle = `rgb(${c})`; x.fillText((mob ? '' : 'Predomina: ') + SH[R.dom], cx, by + (mob ? 38 : 34) + py);
  x.fillText(R.ag == null ? 'sin encuestas' : mob ? AGX(R.ag) : `según encuestas: ${AGX(R.ag)}`, cx, by + (mob ? 58 : 50) + py); x.fillStyle = '#3b4234';
  if (!mob) x.fillText(`Personas: ${lvn(R.p)} · Vehículos: ${lvn(R.v)}`, cx, by + 68 + py);
  x.fillStyle = '#8F9984'; x.font = '13px "SF Compact",sans-serif'; x.fillText(rz ? `${rz.n} de ${R.nm} mediciones con este filtro` : `${R.nm} mediciones${R.ne ? ' · ' + R.ne + ' encuestas' : ''}`, cx, by + (mob ? 58 : 68) + py + (mob ? 20 : 22));
  x.restore(); x.globalAlpha = 1;
}
function regBig(i, a) { // ciudad aislada: mismo rótulo que un sector expandido (nombre + predominio + flujos); el detalle va en la tarjeta
  const R = REG[i], g = GR[i], mob = W < 760, c = rgbOf(COL[R.dom]), y = g.cy + Rf * 1.12 + (mob ? 24 : 32);
  x.save(); x.textAlign = 'center'; x.globalAlpha = a; x.fillStyle = '#3b4234'; x.font = `700 ${mob ? 20 : 28}px "SF Pro",sans-serif`; x.fillText(R.n.toUpperCase(), g.cx, y);
  x.font = `${mob ? 13 : 16}px "SF Compact",sans-serif`; x.fillStyle = `rgb(${c})`; x.fillText('Predomina: ' + SH[R.dom] + ' · ' + (R.ag == null ? 'sin encuestas' : mob ? AGX(R.ag) : 'según encuestas: ' + AGX(R.ag)), g.cx, y + (mob ? 18 : 24));
  x.fillStyle = '#3b4234'; x.fillText(`Personas: ${lvn(R.p)} · Vehículos: ${lvn(R.v)}`, g.cx, y + (mob ? 35 : 46)); x.restore(); x.globalAlpha = 1;
}
let sndT = 0, lastBlip = null, lastFoc = false, lastT = 0, curDt = 0, lastLh = 0, lastHt = '', lastDeep = false, lastTide = true;
function frame(ms) {
  T = ms / 1000; const dt = Math.min(.05, T - lastT); lastT = T;
  const lh = leg.offsetHeight; if (W >= 1100 && Math.abs(lh - lastLh) > 1) { lastLh = lh; layout(); document.documentElement.style.setProperty('--lb', (72 + lh + 14) + 'px'); }
  k += ((want === null ? 0 : 1) - k) * .09; kR += ((wantR === null ? 0 : 1) - kR) * .09; if (wantR === null && kR < .003) { kR = 0; focR = null; } else if (wantR !== null) focR = wantR;
  if (want === null && k < .003) { k = 0; foc = null; } else if (want !== null) foc = want;
  // scroll → marea total (arriba) → sectores → ambiente (contraste y estadísticas)
  const vh = innerHeight, sy0 = window.scrollY, hero = document.body.classList.contains('heroing') || document.body.classList.contains('about');
  const stEl = document.querySelectorAll('.steps .step'), chEl = document.querySelector('.finds') || document.querySelector('.charts2'), csE = document.querySelector('.cstage'); let cT = 0, cS = -1, cmpT = 0;
  const fdE = document.querySelector('.finds'), stpE = document.querySelector('.steps'), rmp = e => cl((vh * .95 - e.getBoundingClientRect().top) / (.5 * vh), 0, 1);
  amb = hero || iso() ? 0 : chEl ? Math.max(fdE && stpE ? rmp(fdE) * (1 - cl((vh * .42 - stpE.getBoundingClientRect().top) / (vh * .3), 0, 1)) : 0, (document.querySelector('.charts2') ? rmp(document.querySelector('.charts2')) : 0)) : cl((sy0 - 1.0 * vh) / (.6 * vh), 0, 1);
  if (csE && !hero && !iso()) { const f0 = (stEl[0] || csE).getBoundingClientRect(), l0 = csE.getBoundingClientRect(); cT = cl((vh * .42 - f0.top) / (vh * .3), 0, 1) * cl((l0.bottom - vh * .45) / (vh * .3), 0, 1); // sin tarjetas por lugar: el acople arranca con la comparación A/B
    let best = 1e9; stEl.forEach((el, q) => { const r = el.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - vh / 2); if (d < best) { best = d; cS = q; } }); if (!stEl.length || csE.getBoundingClientRect().top < vh * .5) cmpT = 1; }
  { const ob = W < 760 && cS >= 0 && !cmpT && stEl[cS] && stEl[cS].querySelector('.blk.open') ? 1 : 0; mo += (ob - mo) * (1 - Math.exp(-dt * 6)); }
  cA += (cT - cA) * (1 - Math.exp(-dt * 7)); cm += (cmpT - cm) * (1 - Math.exp(-dt * 5)); for (let s = 0; s < NS; s++) kc[s] += ((cT > .02 && (cmpT ? PAIR().includes(s) : s === cS) ? 1 : 0) - kc[s]) * (1 - Math.exp(-dt * 4));
  if (window.SND && SND.active) { sndT += dt; if (sndT > .2) { sndT = 0; SND.update(want !== null ? [[want, 0]] : lastCar ? [[lastCi, 0]] : lastCarR ? REG[lastCiR].ss.map((q, j, a0) => [q, (j / Math.max(1, a0.length - 1) * 2 - 1) * .5]) : wantR !== null ? REG[wantR].ss.map((q, j, a0) => [q, (j / Math.max(1, a0.length - 1) * 2 - 1) * .5]) : cmpT && cT > .02 ? [[PAIR()[0], -.7], [PAIR()[1], .7]] : cT > .02 && cS >= 0 ? [[cS, 0]] : NSX.map(s => [s, (s / (NS - 1) * 2 - 1) * .8]), hero ? 0 : 1 - amb); } } // sonido por fuentes (opcional)
  const sm3 = t => t * t * (3 - 2 * t), eRT = iso() ? 1 : hero ? 0 : sm3(cl(sy0 / (.75 * vh), 0, 1)), eT = want !== null ? 1 : wantR !== null ? 0 : hero ? 0 : sm3(cl((sy0 - 1.05 * vh) / (.8 * vh), 0, 1)); // tres tramos de scroll: marea total → dos ciudades → seis lugares
  eR += (eRT - eR) * (1 - Math.exp(-dt * 5)); if (Math.abs(eRT - eR) < .002) eR = eRT;
  eS += (eT - eS) * (1 - Math.exp(-dt * 5)); if (Math.abs(eT - eS) < .002) eS = eT;
  { const on = W < 760 && want === null && eS > .85 && cA < .05 && amb < .05 && !hero; if (on !== lastCar) { lastCar = on; car.classList.toggle('on', on); cdots.classList.toggle('on', on); }
    { const cv2 = cA > .5 && cm > .5 && !hero; if (cv2 !== cmpvOn) { cmpvOn = cv2; document.body.classList.toggle('cmpv', cv2); if (cv2) { cmLegSync(); legWas2 = leg.classList.contains('open'); legSet(false); } else { legSet(legWas2 && W >= 1100); leg.style.removeProperty('left'); leg.style.removeProperty('top'); leg.style.removeProperty('right'); } }
      if (cv2) { const cr = document.querySelector('.cmp').getBoundingClientRect(), sh = H < 700 && W < 1100; leg.style.setProperty('right', 'auto', 'important'); leg.style.setProperty('left', (sh ? W - 14 - 122 : W >= 1100 ? cr.left : 14) + 'px', 'important'); leg.style.setProperty('top', (sh ? cr.top - 6 : cr.bottom - 44) + 'px', 'important'); } }
    { const onR = W < 760 && want === null && wantR === null && eR > .85 && eS < .3 && cA < .05 && amb < .05 && !hero; if (onR !== lastCarR) { lastCarR = onR; carR.classList.toggle('on', onR); cdotsR.classList.toggle('on', onR); }
      carRPos += (carRTgt - carRPos) * (1 - Math.exp(-dt * 14)); if (!carRInit && carR.scrollWidth > W * 1.5) { carR.scrollLeft = W; carRInit = true; } const cj = ((Math.round(carRTgt) % 2) + 2) % 2; if (cj !== lastCiR) { lastCiR = cj; [...cdotsR.children].forEach((d, i) => d.classList.toggle('on', i === cj)); } }
    carPos += (carTgt - carPos) * (1 - Math.exp(-dt * 14)); if (!carInit && car.scrollWidth > W * 1.5) { car.scrollLeft = W; carInit = true; } const ci = ((Math.round(carTgt) % NS) + NS) % NS; if (ci !== lastCi) { lastCi = ci; [...cdots.children].forEach((d, i) => d.classList.toggle('on', i === ci)); } }
  ee = eS * (1 - amb); er = eR * (1 - amb); Aglob = document.body.classList.contains('about') ? .6 : lerp(1, .27, amb);
  const fo = iso(); if (fo !== lastFoc) { lastFoc = fo; document.body.classList.toggle('foc', fo); }
  const deep = amb > .06 || cA > .03, tide = eS < .5; if (deep !== lastDeep) { lastDeep = deep; document.body.classList.toggle('deep', deep); } if (tide !== lastTide) { lastTide = tide; document.body.classList.toggle('tide', tide); }
  const rm = RM ? .2 : 1, ry = Math.sin(T * rm * .17) * .62 + oy, rx = -.28 + Math.sin(T * rm * .11 + 1) * .14 + ox; // se favorecen las vistas de las bases del tubo cY = Math.cos(ry); sY = Math.sin(ry); cX = Math.cos(rx); sX = Math.sin(rx);
  CMY = CMY0; CMR = CMR0; // la posición/tamaño base se restablece cada cuadro: la comparación ya no deja el modelo desplazado al volver a Lugares
  if (W >= 760 && W < 1100 && cA > .01 && cS >= 0) { const bk = stEl[cS] && stEl[cS].querySelector('.blk'); if (bk) { const t0 = 150, b0 = bk.getBoundingClientRect().top - 8, h0 = b0 - t0; if (h0 > 80) { CMR = cl(h0 / 2.5, 40, Math.min(W * .26, 230)); CMY = (t0 + b0) / 2; } } } // tableta: el modelo se centra en el hueco entre la cabecera y la tarjeta
  if (W >= 1100 && cm > .01) { const cp = document.querySelector('.cmp'), bk = document.querySelector('.cstage .blk'); if (cp && bk) { const mL = cp.getBoundingClientRect().left, rg = bk.getBoundingClientRect().left - 36, rr = Math.min(.72 * CPR, (rg - mL) / 4.3); if (rg - mL > 300) { CPR = rr / .72; CPX = [mL + rr, rg - rr]; } } } // comparación escritorio: los dos modelos respetan el margen del título (izquierda) y dejan aire antes de la tarjeta
  if (W >= 1100 && cm > .01) { const cp = document.querySelector('.cmp'); if (cp) { const t0 = cp.getBoundingClientRect().bottom + 14, b0 = H - 24, h0 = b0 - t0; if (h0 > 200) { const rr = .72 * CPR; CPY = cl(H * .53, t0 + rr * 1.12, Math.max(t0 + rr * 1.12, b0 - rr * 1.12 - 56)); CMY = CPY; } } } // comparación: mallas centradas verticalmente en el espacio libre
  if (W >= 1100 && cA > .01) { const cp = document.querySelector('.cmp'); if (cp) { const t0 = cp.getBoundingClientRect().bottom + 14, b0 = H - 24, h0 = b0 - t0; if (h0 > 60) { const r = Math.max(34, Math.min(Math.min(W * .165, H * .25), h0 / 2.2)); CMR = r; CMY = (t0 + b0) / 2; } } } // escritorio de poca altura: la figura baja de la leyenda
  if (W < 1100 && cm > .01) { const bk = document.querySelector('.cstage .blk'), cp = document.querySelector('.cmp'); // comparación en pantallas chicas: los dos modelos ocupan el hueco entre el título y la tarjeta
    if (bk && cp) { const t0 = Math.max(cp.getBoundingClientRect().bottom + 6, 96), b0 = bk.getBoundingClientRect().top - 8, h0 = b0 - t0; if (h0 > 80) { CPR = cl(h0 / (W < 760 ? (H < 700 ? 2.5 : 2.15) : H < 700 ? 2.85 : 2.4), 36, W >= 760 ? Math.min(W * .29, 265) : Math.min(W * (W < 760 ? .4 : .3), W < 760 ? 190 : 150)); CPY = (t0 + b0) / 2 - 4; } } } // CMY/CMR (lugares) no se tocan: al volver desde Comparar el modelo ya no pasa por la posición de la comparación
  geoms(); geomsR(); x.globalCompositeOperation = 'source-over'; x.fillStyle = '#DCDDD3'; x.fillRect(0, 0, W, H);
  curDt = dt * rm;
  for (let s = 0; s < NS; s++) { updMesh(s, ee, er); lightMesh(s); }
  for (let s = 0; s < NS; s++) { const al = G[s].al * Aglob * GR[rOf(s)].al; if (al > .01 && !(W < 760 && ee > .9 && Math.abs(G[s].cx - W / 2) > W * 1.2)) { drawMesh(s, al, evOf(ee, .5)); flows(s, curDt, al); } }
  calcDots(ee, er); drawDots();
  x.globalCompositeOperation = 'source-over'; x.textAlign = 'center';
  // anillo de agrado (encuestas) en los lugares acoplados; en la comparación, además A/B, nombre y agrado
  { const mobq = W < 760; G.forEach((g, s) => { const q = kc[s] * cA; if (q < .04) return; const ags = AGS[s], tot = ags.reduce((p, c) => p + c, 0) || 1, r0 = g.R * .72; let a0 = -Math.PI / 2;
    x.save(); x.setLineDash([2, 5]); x.lineWidth = mobq ? 1.1 : 1.5; x.strokeStyle = '#5E6655'; x.fillStyle = '#5E6655'; x.font = `${mobq ? 8 : 10}px "SF Compact",sans-serif`; x.textAlign = 'left'; // anillos finos: relieve de referencia en dB
    if (!real(F.filter(f => f.s === s)).length) { /* sin dB: sin anillos de referencia */ } else [55, 65, 75, 85].forEach(d => { const rr = g.R * (.35 + .00754 * (d - 48)); x.globalAlpha = q * .42; x.beginPath(); x.arc(g.cx, g.cy, rr, 0, TAU); x.stroke(); x.globalAlpha = q * .6; x.fillText(d === 85 ? '85 dB' : d, g.cx + rr * .7071 + 2, g.cy - rr * .7071 - 1); }); x.restore();
    x.lineWidth = mobq ? 3.6 : 5; x.lineCap = 'butt'; { const sw = 1 - Math.pow(1 - cl((q - .04) / .55, 0, 1), 3); let cum = 0; ags.forEach((c, i) => { if (!c) return; const f0 = cum / tot, f1 = (cum + c) / tot, e1 = Math.min(f1, sw); cum += c; if (e1 <= f0 + .002) return; x.globalAlpha = q * .92; x.strokeStyle = AGC[i]; x.beginPath(); x.arc(g.cx, g.cy, r0, a0 + TAU * f0 + .035, a0 + TAU * e1 - (e1 === f1 ? .035 : 0)); x.stroke(); }); } // el anillo de agrado se dibuja al acoplarse
    const pi = PAIR().indexOf(s), qc = pi >= 0 ? cm * kc[s] * cA : 0;
    if (qc > .25) { const c = rgbOf(COL[DOM[s]]); x.globalAlpha = qc; x.fillStyle = '#3b4234'; x.font = `700 ${mobq ? 13 : 18}px "SF Pro",sans-serif`; x.fillText(SECT[s].toUpperCase(), g.cx, g.cy + r0 + (mobq ? 20 : 30));
      x.font = `${mobq ? 11 : 14}px "SF Compact",sans-serif`; x.fillStyle = '#5E6655'; x.fillText(hasAg(s) ? (mobq ? `${AGX(agrSec(s))} · ${tot} resp.` : `según ${tot} encuestas: ${AGX(agrSec(s))}`) : 'sin encuestas de agrado', g.cx, g.cy + r0 + (mobq ? 34 : 50));
      x.font = `800 ${mobq ? 15 : 22}px "SF Pro",sans-serif`; x.fillStyle = `rgb(${c})`; x.fillText('AB'[pi], g.cx, g.cy - r0 - (mobq ? 8 : 12)); }
    x.globalAlpha = 1; }); }
  const lab = cl((eS - .6) / .35, 0, 1) * (1 - amb) * (1 - cl(cA * 4, 0, 1));
  const labT = (document.body.classList.contains('legopen') || (W >= 1100 && (document.getElementById('ans') || {classList: {contains: () => false}}).classList.contains('open'))) ? 0 : 1; window.labK = (window.labK == null ? labT : window.labK) + (labT - (window.labK == null ? labT : window.labK)) * .14; const labS = window.labK * window.labK * (3 - 2 * window.labK);
  if (lab * labS > .02 && !iso() && W >= 760) { const mob = W < 760, ar = (document.getElementById('ans') || {getBoundingClientRect: () => ({bottom: 0})}).getBoundingClientRect(), ab = ar.bottom, yt = Math.max(ab + 16, Math.min(Math.max(ab + 26, 0), Math.min(...G.map(g => g.cy - g.R)) - (mob ? 26 : 20))); x.globalAlpha = lab * labS * .9; x.fillStyle = '#5E6655'; const cx0 = W >= 1100 ? W / 2 : (ar.left + ar.right) / 2, lgO = document.getElementById('leg'), lr0 = 0, long = 'Cada anillo es un lugar · el color dice qué suena más · la barra y el número, qué tan fuerte · las columnas, cómo cambia en el día'; x.font = `${mob ? 12 : 16}px "SF Compact",sans-serif`; const sh = mob || x.measureText(long).width > 2 * Math.min(cx0 - lr0, W - 90 - cx0); x.fillText(sh ? 'Cada anillo es un lugar · color: qué suena · barra: qué tan fuerte' : long, cx0, yt + (1 - labS) * 12); x.globalAlpha = 1; }
  const rk = NSX.filter(s => fdb(s) != null && !apOnly(s)).sort((a, b) => fdb(b) - fdb(a)), loud = rk[0], quiet = rk.length > 1 ? rk[rk.length - 1] : -1;
  if (lab > .05) G.forEach((g, s) => {
    if (g.al < .05) return; const c = rgbOf(COL[DOM[s]]), big = g.kk > .5, mob = W < 760, [p, v] = lvl(s), y = g.cy + g.R * 1.12 + (big ? (mob ? 24 : 32) : (mob ? 26 : 22));
    const sc = big || mob ? 1 : Math.min(1, (LW - 14) / 250); x.save(); if (sc < 1) { x.translate(g.cx, y); x.scale(sc, sc); x.translate(-g.cx, -y); }
    x.globalAlpha = g.al * lab; x.fillStyle = '#3b4234'; x.font = `700 ${big ? (mob ? 20 : 28) : (mob ? 19 : 20)}px "SF Pro",sans-serif`; x.fillText(SECT[s].toUpperCase(), g.cx, y);
    x.font = `${big ? (mob ? 13 : 16) : 14}px "SF Compact",sans-serif`; x.fillStyle = `rgb(${c})`;
    const dbl = dbAvg(s) == null ? dbL(s) : (dbAvg(s) * cl(lab * 1.15, 0, 1)).toFixed(1) + (apOnly(s) ? ' dB modelo' : ' dB promedio');
    if (!big) { const nd = fdb(s) == null, dv = nd ? 0 : fdb(s) * cl(lab * 1.15, 0, 1), o1 = 36, bw = mob ? 190 : 150, by = y + o1 + 8; // intensidad legible: número grande + barra con la misma escala en todos los lugares
      const rr = (px, py, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(px, py, w, h, r); else x.rect(px, py, w, h); x.fill(); };
      if (nd) { x.fillStyle = '#8F9984'; x.font = `15px "SF Compact",sans-serif`; x.fillText(fact() ? 'sin dB con este filtro' : 'sin dB medido', g.cx, y + o1); }
      else { const nf = `300 ${mob ? 34 : 32}px "SF Compact",sans-serif`, uf = `13px "SF Compact",sans-serif`, ns = dv.toFixed(1), un = apOnly(s) ? ' dB · modelo APrA' : ' dB promedio'; x.font = nf; const w1 = x.measureText(ns).width; x.font = uf; const w2 = x.measureText(un).width, x0 = g.cx - (w1 + w2) / 2; x.textAlign = 'left';
        x.font = nf; x.fillStyle = `rgb(${c})`; x.fillText(ns, x0, y + o1 + (mob ? 2 : 4)); x.font = uf; x.fillStyle = '#8F9984'; x.fillText(un, x0 + w1, y + o1 + (mob ? 2 : 4)); x.textAlign = 'center'; }
      const bh = 7, by2 = by + 3; x.globalAlpha = g.al * lab * .16; x.fillStyle = '#5E6655'; rr(g.cx - bw / 2, by2, bw, bh, bh / 2);
      if (!nd) { x.globalAlpha = g.al * lab; x.fillStyle = `rgb(${c})`; rr(g.cx - bw / 2, by2, Math.max(bh, bw * cl((dv - 40) / 55, 0, 1)), bh, bh / 2); } x.globalAlpha = g.al * lab;
      if (s === loud || s === quiet) { x.save(); x.globalAlpha = g.al * lab; x.fillStyle = `rgb(${c})`; x.font = `700 12px "SF Compact",sans-serif`; if ('letterSpacing' in x) x.letterSpacing = '1.5px'; x.textAlign = 'center'; x.fillText(s === loud ? 'MÁS RUIDOSO' : 'MÁS TRANQUILO', g.cx, mob ? by + 76 : y - 26); x.restore(); }
      if (!mob) { const names = ['Mañana', 'Tarde', 'H. punta'], ks = ['am', 'pm', 'pk'], base = by + 46; (srcF ? ['am', 'pm', 'pk'].map(k => fst(fsel([s], k, srcF)).db) : FRDB[NSX.indexOf(s)]).forEach((v, i) => { const cxp = g.cx + (i - 1) * 46, hh = v == null ? 3 : Math.max(3, cl((v - 55) / 25, 0, 1) * 24 + 3); x.globalAlpha = g.al * lab * (v == null ? .16 : (flt === 'all' || flt === ks[i] ? .9 : .35)); x.fillStyle = v == null ? '#5E6655' : `rgb(${c})`; rr(cxp - 9, base - hh, 18, hh, 3); x.globalAlpha = g.al * lab; x.fillStyle = '#8F9984'; x.font = '10px "SF Compact",sans-serif'; x.fillText(names[i], cxp, base + 12); }); x.globalAlpha = g.al * lab; }
      const py = mob ? 0 : 40;
      x.font = '15px "SF Compact",sans-serif'; x.fillStyle = `rgb(${c})`; x.fillText((mob ? '' : 'Predomina: ') + SH[DOM[s]], g.cx, by + (mob ? 38 : 34) + py); x.fillText(mob ? (hasAg(s) ? AGX(agrSec(s)) : 'sin encuestas') : agL2(s), g.cx, by + (mob ? 58 : 50) + py); x.fillStyle = '#3b4234';
      if (mob) { /* personas y vehículos: en la tarjeta del sector */ } else { x.fillText(`Personas: ${lvn(p)} · Vehículos: ${lvn(v)}`, g.cx, by + 68 + py); if (fact()) { const z = fst(fsel([s], flt, srcF)); x.fillStyle = '#8F9984'; x.font = '13px "SF Compact",sans-serif'; x.fillText(`${z.n} ${z.n === 1 ? 'medición' : 'mediciones'} con este filtro`, g.cx, by + 90 + py); } } }
    else { x.fillText('Predomina: ' + SH[DOM[s]] + ' · ' + (mob ? (hasAg(s) ? AGX(agrSec(s)) : 'sin encuestas') : agL(s)), g.cx, y + (mob ? 18 : 24)); x.fillStyle = '#3b4234'; x.fillText(`Personas: ${lvn(p)} · Vehículos: ${lvn(v)}`, g.cx, y + (mob ? 35 : 46)); }
    x.restore(); x.globalAlpha = 1;
  });
  { const labR = cl((eR - .6) / .35, 0, 1) * (1 - cl(eS / .4, 0, 1)) * (1 - amb) * (1 - cl(cA * 4, 0, 1)); if (labR > .05 && want === null) { [0, 1].forEach(i => regLab(i, labR * (focR === null ? 1 : focR === i ? cl(1 - kR * 4, 0, 1) : 1 - kR))); if (focR !== null && kR > .5) regBig(focR, cl((kR - .5) * 2, 0, 1)); } }
  const stg = eS > .5 ? 2 : eR > .5 ? 1 : 0, ht = iso() ? '' : (stg === 0 ? 'Todas las mediciones · toca un punto' : stg === 1 ? (W < 760 ? 'Desliza para ver cada ciudad · toca para aislar' : 'Dos ciudades · clic para aislar') : 'Clic en un sector para expandirlo · teclas 1–' + NS); if (ht !== lastHt) { lastHt = ht; hint.textContent = ht; }
  const dw = document.getElementById('down'), dl = stg === 0 ? 'Separar las dos ciudades ↓' : stg === 1 ? 'Desplegar sectores ↓' : 'Ver hallazgos ↓'; if (dw.textContent !== dl) dw.textContent = dl;
  requestAnimationFrame(frame);
}

const SNM = { V: 'vehicular', H: 'humano', C: 'comercial', M: 'portuario', N: 'natural' }, LOW = { V: 'lo vehicular', H: 'lo humano', C: 'lo comercial', M: 'lo portuario', N: 'lo natural' };
const FBN = { am: ['Mañana', '09:40–12:36'], pm: ['Tarde', '12:37–17:29'], pk: ['Hora punta', '17:30–18:50'] };
const fsel = (ss, ff, sf) => uniq(F.filter(f => ss.includes(f.s) && !f.ap && !f.night && (ff === 'all' || f.m >= FILTERS[ff][0] && f.m <= FILTERS[ff][1]) && (!sf || f.c === sf)));
const fst = a => { const r = real(a); return { n: a.length, db: r.length ? mean(r, f => f.pr) : null }; };
const fact = () => flt !== 'all' || !!srcF; // hay filtro de hora o de fuente activo
const fdb = s => fact() ? fst(fsel([s], flt, srcF)).db : dbAvg(s); // dB promedio del lugar con el filtro activo
const qCol2 = c => 'rgb(' + dark(rgbOf(COL[c]), .32).join(',') + ')';
function fcard(v) { // bloque dentro de la tarjeta: explica en palabras qué cambia con el filtro activo (hora y/o fuente)
  if (!fact()) return '';
  const sc = v.k === 'city' ? REG[v.i].ss : [v.i], nm = v.k === 'city' ? REG[v.i].n : SECT[v.i], tt = [flt !== 'all' ? `${FBN[flt][0].toLowerCase()} (${FBN[flt][1]} h)` : '', srcF ? `sonido ${SNM[srcF]}` : ''].filter(Boolean).join(' · ');
  const sub = fsel(sc, flt, srcF), base = fsel(sc, 'all', null), A = fst(sub), B = fst(base), rows = [], pl = n => n === 1 ? 'medición' : 'mediciones';
  if (!sub.length) rows.push(['En breve', `Con este filtro no hay mediciones en ${nm}.`]);
  else {
    const d = A.db != null && B.db != null ? A.db - B.db : null, w = d == null ? '' : d >= 3 ? 'bastante más fuerte' : d >= 1 ? 'algo más fuerte' : d <= -3 ? 'bastante más tranquilo' : d <= -1 ? 'algo más tranquilo' : 'casi igual';
    rows.push(['En breve', A.db == null ? `Hay ${A.n} ${pl(A.n)} con este filtro, pero ninguna con dB medido.` : d == null ? `${A.db.toFixed(0)} dB en promedio.` : w === 'casi igual' ? `${nm} suena casi igual que en el resto de las mediciones: ${A.db.toFixed(0)} dB.` : `${nm} suena ${w} en esta selección: ${A.db.toFixed(0)} dB, contra ${B.db.toFixed(0)} dB sin el filtro.`]);
    if (A.db != null) rows.push(['Qué significa', `${A.db.toFixed(0)} dB es parecido a ${DBW(A.db)}. Los decibeles (dB) miden el ruido: más dB, más ruido.`]);
    rows.push(['En qué se basa', `Se calcula con ${A.n} de las ${B.n} ${pl(B.n)} del lugar${A.n < 3 ? '. Son pocas: sirve como pista, no como conclusión' : ''}.`]);
    if (v.k === 'city') { const rk = sc.map(q => [q, fst(fsel([q], flt, srcF)).db]).filter(a => a[1] != null).sort((p, q) => q[1] - p[1]); rows.push(['Dónde', rk.length > 1 ? `Suena más en ${SECT[rk[0][0]]} (${rk[0][1].toFixed(0)} dB) y menos en ${SECT[rk[rk.length - 1][0]]} (${rk[rk.length - 1][1].toFixed(0)} dB).` : rk.length ? `Solo hay mediciones en ${SECT[rk[0][0]]}.` : 'Sin dB medido en los lugares de la ciudad.']); }
    else if (srcF && flt === 'all') rows.push(['A lo largo del día', ['am', 'pm', 'pk'].map(k => { const z = fst(fsel(sc, k, srcF)); return `${FBN[k][0].toLowerCase()} ${z.db != null ? z.db.toFixed(0) + ' dB' : 'sin datos'}`; }).join(' · ') + '.']);
    else if (srcF) { const t = fsel(sc, flt, null).length; rows.push(['Peso de esta fuente', `Es el ${Math.round(A.n / Math.max(1, t) * 100)}% de lo medido en esa franja (${A.n} de ${t}).`]); }
    else { const c = {}; sub.forEach(f => c[f.c] = (c[f.c] || 0) + 1); const top = Object.keys(c).sort((p, q) => c[q] - c[p])[0]; rows.push(['Lo que más se escucha', `${LOW[top][0].toUpperCase() + LOW[top].slice(1)} (${c[top]} de ${sub.length} ${pl(sub.length)}).`]); }
  }
  return `<div class="fbk2"><b${srcF ? ` style="color:${qCol2(srcF)}"` : ''}>Mirando solo: ${tt}</b><div class="fi2">${rows.map(([k, t]) => `<div><b>${k}</b><span>${t}</span></div>`).join('')}</div></div>`;
}

const hint = document.getElementById('hint'), psub = document.getElementById('psub') || document.createElement('div');
function hintPos() { if (innerWidth > 900) { const r = document.getElementById('cts').getBoundingClientRect(); if (r.width) { hint.style.left = Math.round(r.right + 12) + 'px'; } } else hint.style.left = ''; }
addEventListener('resize', () => setTimeout(() => { if (iso()) { layout(); fitPanel(); } }, 160)); addEventListener('resize', hintPos); setInterval(hintPos, 400);
const detOf = () => pf ? `<div class="det" style="border-left-color:${COL[pf.c]}"><b>${pf.id} · ${tmx(pf)}${pf.ap ? '' : ' h'}</b>${pf.src}<br>${pf.nd ? 'sin dB medido · intensidad percibida ' + FICHAS[F.indexOf(pf)][10] + '/5' : pf.mn + '–' + pf.mx + ' dB · prom. ' + pf.pr}<br>${pf.ap ? '' : `Flujo peatonal ${pf.fp}/3 · vehicular ${pf.fv}/3<br>`}<span style="color:${COL[pf.c]}">${CAT[pf.c]}</span><br><i>${pf.ph}</i>${pf.ap ? `<br><span class="org"><b>Procedencia:</b> ${APRA}. Modelo de simulación validado con mediciones; no es una medición del equipo. Rango de la banda, no mínimo y máximo registrados. Cruce propio con los polígonos del mapa (CSV ${pf.night ? 'nocturno' : 'diurno'} 2018) en unos 150 m alrededor del lugar.</span>` : ''}</div>` : '';
function cityHtml(i) { // ciudad aislada: promedia las mediciones de sus lugares con la misma composición que la tarjeta de un sector
  const R = REG[i], ss = R.ss, D = W > 1100, fs = uniq(F.filter(f => ss.includes(f.s) && on(f))), nB = fs.filter(f => !f.ap).length, rf = real(fs), dbm = rf.length ? mean(rf, f => f.pr) : null, lo = rf.filter(f => f.mx < 100), mx100 = rf.filter(f => f.mx >= 100), mxv = lo.length ? Math.max(...lo.map(f => f.mx)) : null,
    hex = COL[R.dom], es = E.filter(e => ss.includes(e[0])), a = R.ag, ags = [-1, 0, 1, 2].map(v => es.filter(e => e[1] === v).length), db = es.filter(e => e[2]), AGN = ['Incomoda', 'Da igual', 'Gusta un poco', 'Gusta'], P = v => cl((v - 40) / 55, 0, 1) * 100,
    fpm = mean(fs.filter(f => !f.ap), f => f.fp) || 1, fvm = mean(fs.filter(f => !f.ap), f => f.fv) || 1, FNM = { all: ['Todo el día', '09:40–18:50'], am: ['Mañana', '09:40–12:36'], pm: ['Tarde', '12:37–17:29'], pk: ['Hora punta', '17:30–18:50'] }[flt] || ['Todo el día', '09:40–18:50'];
  const rk = ss.filter(q => dbAvg(q) != null).sort((p, q) => dbAvg(q) - dbAvg(p)), nm = R.nm, nDom = uniq(F.filter(f => ss.includes(f.s) && !f.ap && !f.night)).filter(f => f.c === R.dom).length;
  const hd = `<div class="bh"><h3>${R.n}</h3><div class="sub">${ss.length} lugares · ${nB} ${nB === 1 ? 'medición visible' : 'mediciones visibles'}</div></div>`,
    bigH = `<div class="big" style="color:${hex}">${dbm == null ? '<span class="nd">sin dB</span>' : `<span data-n="${dbm.toFixed(1)}" data-dec="1">${dbm.toFixed(1)}</span>`}<small>${dbm == null ? 'sin medir' : 'dB promedio de la ciudad'}</small></div>`,
    dbsH = dbm == null ? '' : `<div class="dbs"><div class="dtr"><i data-w="${P(dbm).toFixed(1)}" style="background:${hex}"></i></div><small>≈ ${DBW(dbm)}</small></div>`,
    chipsH = `<div class="chips"><span style="color:${hex}">● Predomina: ${SH[R.dom]}</span>${es.length ? `<span style="color:rgb(${agr(a)})">Según ${nEnc(es.length)}: ${AGX(a)}</span>` : '<span>sin encuestas de agrado</span>'}</div>`,
    fnowH = `<div class="fnow"><b class="fn">${FNM[0]}</b><span class="fh">${FNM[1]} h</span><span class="fv">${dbm == null ? 'sin dB' : `<i data-n="${dbm.toFixed(0)}">${dbm.toFixed(0)}</i> dB`} · <span data-n="${nB}">${nB}</span> ${nB === 1 ? 'medición' : 'mediciones'}</span></div>`,
    agBar = es.length ? `<h6 class="sl">Qué opina la gente</h6><div class="agb" data-reveal>${ags.map((c, k) => c ? `<span style="flex:${c};background:${AGC[k]}">${c}</span>` : '').join('')}</div>${agCap(ags, es.length)}` : '',
    factH = `<div class="fact">${factLine(mxv, fpm, fvm, mx100.length ? ` <em class="ex">(sin contar ${mx100.length} ruido${mx100.length > 1 ? 's' : ''} aislado${mx100.length > 1 ? 's' : ''} de ${Math.round(Math.max(...mx100.map(f => f.mx)))} dB)</em>` : '')}</div>`,
    dbeH = db.length ? `<small class="dbe">En ${db.length} ${db.length === 1 ? 'encuesta' : 'encuestas'} la gente también anotó el ruido: ${mean(db, e => e[2]).toFixed(0)} dB en promedio.</small>` : '',
    fiH = fiBlock([['Lo que más se escucha', `${LOW[R.dom][0].toUpperCase() + LOW[R.dom].slice(1)} (${nDom} de ${nm} mediciones).`], rk.length > 1 ? ['Dónde suena más y menos', `El lugar más ruidoso es ${SECT[rk[0]]} (${dbAvg(rk[0]).toFixed(0)} dB) y el más tranquilo, ${SECT[rk[rk.length - 1]]} (${dbAvg(rk[rk.length - 1]).toFixed(0)} dB).`] : null, ['Cómo se vive', R.ne ? `${R.ne} personas respondieron la encuesta; en promedio, el lugar ${AGW(R.ag) === 'incomoda' ? 'les incomoda' : AGW(R.ag) === 'da igual' ? 'les da igual' : AGW(R.ag) === 'gusta' ? 'les gusta' : 'les gusta un poco'}.` : 'En esta ciudad no hay encuestas de agrado.']].filter(Boolean)),
    listH = `<div class="pf"><h5>Mediciones hechas en terreno</h5><p class="pfs">La barra muestra de cuánto a cuánto varió el ruido.</p></div><div class="list">` + F.map((f, q) => ss.includes(f.s) && (on(f) || f.night && (!srcF || f.c === srcF)) ? `<button class="it${pf === f ? ' on' : ''}" data-i="${q}"><span style="background:${COL[f.c]}"></span>${f.id} · ${tmx(f)} · ${SECT[f.s]}<em>${f.src}</em><div class="rg${f.nd ? ' nd' : ''}${f.ap ? ' ap' : ''}">${f.nd ? '' : `<i style="left:${P(f.mn)}%;width:${Math.max(3, P(f.mx) - P(f.mn))}%;background:${COL[f.c]}"></i><u style="left:${P(f.pr)}%"></u>`}</div><b>${f.nd ? 'sin dB' : f.ap ? f.mn + '–' + f.mx + ' dB' : f.pr + ' dB'}</b></button>` : '').join('') + '</div>',
    cmpH = `<div class="pf cmpf"><h5>Comparación entre los lugares de la ciudad (dB promedio)</h5>${ss.map(q => bar(SECT[q], dbAvg(q), false)).join('')}</div><div class="pf cmpf"><h5>Comparación entre ciudades (dB promedio)</h5>${REG.map((r, q) => bar(r.n, r.db, q === i)).join('')}</div>`;
  if (D) return `<div class="pd">${hd}<article class="card sc pcard">${bigH}${dbsH}${chipsH}${fnowH}${fbk({ k: 'city', i })}<div class="ag${es.length ? '' : ' na'}">${agBar}</div><h6 class="sl">Lo que se oyó</h6>${factH}${fiH}${flowH(fpm, fvm)}${horasHtml(ss)}${dbeH}${detOf()}${listH}${cmpH}</article></div>`;
  return `<div class="sc pn">${hd}${bigH}${dbsH}${chipsH}${fbk({ k: 'city', i })}${es.length ? `<div class="ag">${agBar}</div>` : ''}<h6 class="sl">Lo que se oyó</h6>${factH}${flowH(fpm, fvm)}${horasHtml(ss)}${dbeH}${fiH}${detOf()}${listH}${cmpH}</div>`;
}
function render() {
  panel.style.display = iso() ? 'block' : 'none'; psub.style.display = 'none'; hint.style.display = iso() ? 'none' : 'block';
  const s = want !== null ? want : hs, key = [want, wantR, flt, srcF, pf && pf.id, s].join();
  if (key === pkey || !iso()) return; pkey = key; const sc = panel.scrollTop;
  if (wantR !== null) { panel.className = 'big'; panel.innerHTML = cityHtml(wantR); panel.scrollTop = sc; if (window.VITA) VITA.scan(panel); return; }
  if (s === null) { panel.className = ''; panel.innerHTML = '<h2>Explora los seis sectores</h2>'; psub.textContent = 'Pasa el cursor sobre un sector y haz clic para expandirlo y aislarlo; luego elige una medición.'; if (panel.style.display !== 'none') { psub.style.display = 'block'; psub.style.bottom = (22 + panel.offsetHeight + 10) + 'px'; } return; }
  const fs = uniq(F.filter(f => f.s === s && on(f))), es = E.filter(e => e[0] === s), a = agrSec(s), db = es.filter(e => e[2]), mood = AGW(a);
  const AGN = ['Incomoda', 'Da igual', 'Gusta un poco', 'Gusta'], rf = real(fs), dbm = rf.length ? mean(rf, f => f.pr) : null, mx100 = rf.filter(f => f.mx >= 100), mxv = rf.length ? Math.max(...rf.filter(f => f.mx < 100).map(f => f.mx)) : null, hex = COL[DOM[s]], ags = AGS[s], fpm = mean(fs.filter(f => !f.ap), f => f.fp), fvm = mean(fs.filter(f => !f.ap), f => f.fv), aO = apOnly(s), P = v => cl((v - 40) / 55, 0, 1) * 100;
  const D = W > 1100, nB = fs.filter(f => !f.ap).length, FNM = { all: ['Todo el día', '09:40–18:50'], am: ['Mañana', '09:40–12:36'], pm: ['Tarde', '12:37–17:29'], pk: ['Hora punta', '17:30–18:50'] }[flt] || ['Todo el día', '09:40–18:50'];
  const hd = `<div class="bh"><h3>${SECT[s]}</h3><div class="sub">${SUB[s]} · ${nB} ${nB === 1 ? 'medición visible' : 'mediciones visibles'}${aO ? ' · dB de referencia oficial' : ''}</div></div>`,
    bigH = `<div class="big" style="color:${hex}">${dbm == null ? '<span class="nd">sin dB</span>' : `<span data-n="${dbm.toFixed(1)}" data-dec="1">${dbm.toFixed(1)}</span>`}<small>${dbm == null ? 'sin medir · relieve por intensidad percibida' : aO ? 'dB · modelo APrA 2018, no medido en terreno' : 'dB promedio'}</small></div>`,
    dbsH = dbm == null ? '' : `<div class="dbs"><div class="dtr"><i data-w="${P(dbm).toFixed(1)}" style="background:${hex}"></i></div><small>≈ ${DBW(dbm)}</small></div>`,
    chipsH = `<div class="chips"><span style="color:${hex}">● Predomina: ${SH[DOM[s]]}</span>${es.length ? `<span style="color:rgb(${agr(a)})">Según ${nEnc(es.length)}: ${AGX(a)}</span>` : '<span>sin encuestas</span>'}</div>`,
    fnowH = `<div class="fnow"><b class="fn">${FNM[0]}</b><span class="fh">${FNM[1]} h</span><span class="fv">${dbm == null ? 'sin dB' : `<i data-n="${dbm.toFixed(0)}">${dbm.toFixed(0)}</i> dB`} · <span data-n="${nB}">${nB}</span> ${nB === 1 ? 'medición' : 'mediciones'}</span></div>`,
    agBar = es.length ? `<h6 class="sl">Qué opina la gente</h6><div class="agb" data-reveal>${ags.map((c, k) => c ? `<span style="flex:${c};background:${AGC[k]}">${c}</span>` : '').join('')}</div>${agCap(ags, es.length)}` : '',
    factH = `<div class="fact">${aO ? `Banda modelada de día ${rf[0].mn}–${rf[0].mx} dB` : factLine(mxv, fpm, fvm, mx100.length ? ` <em class="ex">(sin contar ${mx100.length} ruido${mx100.length > 1 ? 's' : ''} aislado${mx100.length > 1 ? 's' : ''} de ${Math.round(Math.max(...mx100.map(f => f.mx)))} dB)</em>` : '')}</div>`,
    dbeH = db.length ? `<small class="dbe">En ${db.length} ${db.length === 1 ? 'encuesta' : 'encuestas'} la gente también anotó el ruido: ${mean(db, e => e[2]).toFixed(0)} dB en promedio.</small>` : '',
    detH = detOf(),
    listH = `<div class="pf"><h5>Mediciones hechas en terreno</h5><p class="pfs">La barra muestra de cuánto a cuánto varió el ruido.</p></div><div class="list">` + F.map((f, i) => f.s === s && (on(f) || f.night && (!srcF || f.c === srcF)) ? `<button class="it${pf === f ? ' on' : ''}" data-i="${i}"><span style="background:${COL[f.c]}"></span>${f.id} · ${tmx(f)}<em>${f.src}</em><div class="rg${f.nd ? ' nd' : ''}${f.ap ? ' ap' : ''}">${f.nd ? '' : `<i style="left:${P(f.mn)}%;width:${Math.max(3, P(f.mx) - P(f.mn))}%;background:${COL[f.c]}"></i><u style="left:${P(f.pr)}%"></u>`}</div><b>${f.nd ? 'sin dB' : f.ap ? f.mn + '–' + f.mx + ' dB' : f.pr + ' dB'}</b></button>` : '').join('') + '</div>',
    quoteH = `<q style="color:${qCol(s)}">${QUOTE[s]}</q>`, fiH = fiBlock(window.FIX && FIX[s]);
  let h;
  if (D) { // escritorio: misma tarjeta que «Cada lugar, a cada hora» (título fuera, vidrio, scroll interno) + registro de mediciones y comparativo al final
    h = `<div class="pd">${hd}<article class="card sc pcard">${bigH}${dbsH}${chipsH}${fnowH}${fbk({ k: 'sector', i: s })}<div class="ag${es.length ? '' : ' na'}">${agBar}${quoteH}</div><h6 class="sl">Lo que se oyó</h6>${factH}${fiH}${flowHtml(s)}${horasHtml(s)}${dbeH}${detH}${listH}${compHtml(s)}</article></div>`;
  } else {
    h = `<div class="sc pn">${hd}${bigH}${dbsH}${chipsH}${fbk({ k: 'sector', i: s })}${es.length ? `<div class="ag">${agBar}</div>` : ''}<h6 class="sl">Lo que se oyó</h6>${factH}`;
    h += flowHtml(s) + horasHtml(s);
    h += dbeH + `<div class="ag">${quoteH}</div>`;
    if (want === null) h += '<small class="hint">Clic para expandir este sector</small>';
    else h += detH + listH;
    h += compHtml(s) + '</div>';
  }
  panel.className = want !== null ? 'big' : ''; panel.innerHTML = h; panel.scrollTop = sc; if (window.VITA) VITA.scan(panel);
}

let dragM = null, dragged = false;
cv.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) dragM = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, mv: 0 }; });
addEventListener('pointermove', e => { if (!dragM) return; const dx = e.clientX - dragM.x, dy = e.clientY - dragM.y; dragM.mv = Math.max(dragM.mv, Math.hypot(e.clientX - dragM.sx, e.clientY - dragM.sy)); dragM.x = e.clientX; dragM.y = e.clientY; if (dragM.mv > 10) { oy += dx * .006; ox = cl(ox + dy * .006, -1.1, 1.1); } });
addEventListener('pointerup', () => { if (dragM && dragM.mv > 10) { dragged = true; setTimeout(() => dragged = false, 60); } dragM = null; });
function pick(e) {
  const mx = e.clientX, my = e.clientY; hs = null; hov = null; hsR = null;
  if (amb < .2) {
    let best = Math.pow(W < 760 ? 24 : 17, 2);
    DOTS.forEach(d => { const q = (d.x - mx) * (d.x - mx) + (d.y - my) * (d.y - my); if (d.al > .3 && q < best) { best = q; hov = d.f; } });
    if (eS > .85) G.forEach((g, s) => { if (g.al < .5) return; const inFig = Math.hypot(mx - g.cx, my - g.cy) < g.R * 1.25 || (want === null && Math.abs(mx - g.cx) < Math.max(g.R * 1.1, W < 760 ? 60 : 90) && my > g.cy - g.R * 1.1 && my < g.cy + g.R * 1.12), inLbl = want === null && Math.abs(mx - g.cx) < Math.min(LW / 2, Math.max(g.R, W < 760 ? 70 : 110)) && my > g.cy + g.R * .95 && my < g.cy + g.R * 1.12 + 92; if ((inFig && (want === null || k > .5)) || inLbl) hs = s; });
  }
  if (amb < .2 && !iso() && eR > .85 && eS < .3) [0, 1].forEach(i => { const g = GR[i]; if (Math.hypot(mx - g.cx, my - g.cy) < RgR * 1.1 || (Math.abs(mx - g.cx) < Math.min(RgR, 130) && my > g.cy + RgR * .95 && my < g.cy + RgR * 1.22 + 130)) hsR = i; });
  if (hov) { tip.innerHTML = `<b>${hov.id} · ${tmx(hov)}${hov.ap ? '' : ' h'}</b>${hov.src}<br>${hov.ap ? 'modelo APrA 2018 · ' : ''}${hov.nd ? 'sin dB medido · intensidad ' + FICHAS[F.indexOf(hov)][10] + '/5' : hov.mn + '–' + hov.mx + ' dB · prom ' + hov.pr}<br><span style="color:${COL[hov.c]}">${CAT[hov.c]}</span><br><i>${hov.ph}</i>`; tip.style.display = 'block'; tip.style.left = Math.max(8, Math.min(mx + 16, W - 280)) + 'px'; tip.style.top = (W < 760 ? Math.max(60, my - 130) : my + 16) + 'px'; }
  else tip.style.display = 'none';
  if (hov !== lastBlip) { lastBlip = hov; if (hov && window.SND) SND.blip(hov.c, hov.pr); }
  cv.style.cursor = hs !== null || hsR !== null || hov ? 'pointer' : (dragM ? 'grabbing' : 'grab'); render();
}
function focusR(i) { if (want !== null || (i !== null && (eR < .85 || eS > .3))) return; if (innerWidth >= 1100) { if (i !== null) { if (wantR === null) legWas = leg.classList.contains('open'); legSet(false); } else if (wantR !== null) legSet(legWas); } wantR = i; layout(); pf = null; back.textContent = '← Volver a las dos ciudades'; back.style.display = i === null ? 'none' : 'block'; document.body.classList.toggle('lock', i !== null); pkey = ''; render(); }
function focus(s) { if (s !== null && eS < .85) return; back.textContent = '← Volver a los seis sectores'; if (innerWidth >= 1100) { if (s !== null) { if (want === null) legWas = leg.classList.contains('open'); legSet(false); } else legSet(legWas); } /* escritorio: la leyenda se pliega al expandir y vuelve a su estado previo */ want = s; layout(); pf = null; back.style.display = s === null ? 'none' : 'block'; document.body.classList.toggle('lock', s !== null); pkey = ''; render(); }

cv.addEventListener('mousemove', pick);
cv.addEventListener('click', e => {
  if (dragged) return; pick(e);
  if (want !== null) { if (hov) { pf = pf === hov ? null : hov; render(); } }
  else if (wantR !== null) { if (hov && rOf(hov.s) === wantR) { pf = pf === hov ? null : hov; render(); } }
  else if (hsR !== null) { const h0 = hov; focusR(hsR); if (wantR !== null && h0 && rOf(h0.s) === wantR) { pf = h0; render(); } }
  else if (eS < .5) { if (hov) pf = pf === hov ? null : hov; else pf = null; }
  else if (hs !== null) { const h0 = hov; focus(hs); if (want !== null && h0 && h0.s === hs) { pf = h0; render(); } }
});
document.getElementById('down').onclick = () => { const vh = innerHeight; scrollTo({ top: eS < .5 ? (eR < .5 ? vh * .9 : vh * 1.92) : document.querySelector('.finds').getBoundingClientRect().top + scrollY - 40, behavior: RM ? 'auto' : 'smooth' }); };
panel.addEventListener('click', e => { const b = e.target.closest('.it'); if (b) { const f = F[+b.dataset.i]; pf = pf === f ? null : f; render(); } });
back.onclick = () => wantR !== null ? focusR(null) : focus(null);
addEventListener('keydown', e => { if (e.key === 'Escape') wantR !== null ? focusR(null) : focus(null); if (/^[12]$/.test(e.key) && want === null && eR > .85 && eS < .3 && !document.body.classList.contains('heroing')) focusR(+e.key - 1); });
document.querySelectorAll('#ctl button').forEach(b => b.onclick = () => { flt = b.dataset.f; document.querySelectorAll('#ctl button').forEach(o => o.classList.toggle('on', o === b)); document.querySelector('#ctl .lbl').innerHTML = '<span><b>Hora del día</b>' + (flt === 'all' ? '' : ' · ' + b.textContent) + '</span>'; document.getElementById('ctl').classList.remove('open'); b.blur(); render(); });

window.MAREA = { pair: [0, 1], get want() { return want; }, get wantR() { return wantR; }, focusR(i) { focusR(i); }, get srcF() { return srcF; }, setSrc(c) { setSrc(c); }, focus(s) { focus(s); }, get flt() { return flt; }, get night() { return nightOn; }, setNight(v) { if (nightOn === v) return; nightOn = v; render(); }, setFlt(f) { if (flt === f) return; flt = f; const b = document.querySelector(`#ctl button[data-f="${f}"]`); document.querySelectorAll('#ctl button').forEach(o => o.classList.toggle('on', o === b)); if (b) document.querySelector('#ctl .lbl').innerHTML = '<span><b>Hora del día</b>' + (flt === 'all' ? '' : ' · ' + b.textContent) + '</span>'; render(); } }; // la comparativa avanza la franja horaria con el scroll
document.getElementById('go').onclick = () => { document.getElementById('hero').classList.add('off'); document.body.classList.remove('heroing'); };
// escala de referencia: traduce dB a algo cotidiano (aproximada)
const DBW = v => v < 50 ? 'oficina o biblioteca tranquila' : v < 60 ? 'conversación suave' : v < 70 ? 'conversación fuerte o calle tranquila' : v < 80 ? 'calle con tráfico constante' : v < 90 ? 'tráfico intenso o maquinaria' : 'bocina o maquinaria muy fuerte';
const DB_REF = [[45, 'biblioteca'], [62, 'conversación'], [77, 'tráfico'], [90, 'maquinaria']], dbPos = v => cl((v - 40) / 55, 0, 1) * 100;
window.DBW = DBW; window.dbPos = dbPos;
document.querySelector('#leg .lgb').innerHTML = `<div class="l3">
  <div class="ls"><b>1</b><div><h4>El color es qué suena</h4><p>Fuente que predomina. Toca un color para filtrar.</p><ul class="dots">${Object.keys(COL).map(k => `<li data-c="${k}" tabindex="0"><i style="background:${COL[k]}"></i>${SH[k]}</li>`).join('')}</ul></div></div>
  <div class="ls"><b>2</b><div><h4>El relieve es qué tan fuerte</h4><p>Donde la malla sube y el punto brilla, hay más decibeles (dB).</p><div class="dbs ref"><div class="dtr"><i style="width:100%"></i></div><div class="dtk">${DB_REF.map(([v, n]) => `<span style="left:${dbPos(v)}%">${n}</span>`).join('')}</div></div></div></div>
  <div class="ls"><b>3</b><div><h4>El recorrido es la hora</h4><p>El largo de la malla va de las 09:40 a las 18:50. Puntos lentos: personas; estelas rápidas: vehículos.</p></div></div></div>
  <button class="lmore" aria-expanded="false">Ver detalle ▾</button>
  <div class="lcols lx">
  <div class="lc"><h4>Malla · un lugar</h4><ul><li><b>Color:</b> fuente que predomina</li><li><b>Largo:</b> hora, de 09:40 a 18:50</li><li><b>Relieve:</b> sube donde el sonido es más fuerte</li><li><b>Movimiento errático:</b> menor agrado percibido</li></ul></div>
  <div class="lc"><h4>Medición · un punto</h4><ul><li><b>Punto:</b> color de su fuente</li><li><b>Zona iluminada:</b> ancho = rango dB mín → máx</li><li><b>Relieve bajo el punto:</b> dB promedio</li></ul></div>
  <div class="lc"><h4>Flujos · recorren la malla</h4><ul><li><b>● Puntos lentos:</b> personas</li><li><b>━ Estelas rápidas:</b> vehículos</li><li><b>Más cantidad y velocidad:</b> más flujo</li></ul></div></div>`;
document.querySelector('#leg .lmore').onclick = e => { const o = !leg.classList.contains('more'); leg.classList.toggle('more', o); e.currentTarget.setAttribute('aria-expanded', o); e.currentTarget.textContent = o ? 'Ocultar detalle ▴' : 'Ver detalle ▾'; legMeasure(); };
// «Cómo leer»: pill que se transforma en el contenedor de la leyenda (escritorio: abierta por defecto; móvil: cerrada)
function setSrc(c) { // filtro por fuente de sonido: leyenda y pill «Fuente» comparten el mismo estado
  srcF = c || null; pkey = '';
  document.querySelectorAll('#leg li[data-c]').forEach(o => { o.classList.toggle('act', o.dataset.c === srcF); o.classList.toggle('dim', !!srcF && o.dataset.c !== srcF); });
  document.querySelectorAll('#cts button').forEach(o => o.classList.toggle('on', (o.dataset.c || null) === srcF));
  document.querySelector('#cts .lbl').innerHTML = '<span><b>Fuente</b>' + (srcF ? ' · ' + SH[srcF] : '') + '</span>'; document.getElementById('cts').classList.remove('open'); render();
}
document.querySelector('#leg .lgb').addEventListener('click', e => { const li = e.target.closest('li[data-c]'); if (li) setSrc(srcF === li.dataset.c ? null : li.dataset.c); });
document.querySelectorAll('#cts button[data-c]').forEach(b => { b.insertAdjacentHTML('afterbegin', `<i style="background:${COL[b.dataset.c]}"></i>`); });
document.querySelectorAll('#cts button').forEach(b => b.onclick = () => { setSrc(b.dataset.c); b.blur(); });
document.querySelector('#leg .lgb').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.target.click(); } });
const leg = document.getElementById('leg'), lgin = leg.querySelector('.lgin'), lgt = document.getElementById('lgbtn');
{ const sp = document.querySelector('#ans .a span'), Q = real(uniq(F.filter(f => !f.ap && !f.night && f.s < 4))), fm = v => v.toFixed(1).replace('.', ','), rk2 = NSX.filter(s => s < 4 && dbAvg(s) != null).sort((a, b) => dbAvg(b) - dbAvg(a)), am = Q.filter(f => f.m < 757), pk = Q.filter(f => f.m >= 1050);
  if (sp && rk2.length > 1 && am.length && pk.length) { const a = rk2[0], z = rk2[rk2.length - 1]; sp.innerHTML = `${SECT[a]} es el más ruidoso (${fm(dbAvg(a))} dB) y ${SECT[z]} el más tranquilo (${fm(dbAvg(z))} dB); el promedio sube de ${Math.round(mean(am, f => f.pr))} dB en la mañana a ${Math.round(mean(pk, f => f.pr))} dB en la hora punta.`; } }
{ const ans = document.getElementById('ans'), place = () => { const q = ans && ans.querySelector('.q'); if (!ans || !q) return; ans.style.maxWidth = ''; ans.style.top = ''; q.style.whiteSpace = ''; const ex = window.ANS_EXTRA || 0; window.ANS_EXTRA = 0; if (innerWidth <= 1100) { ans.style.left = ''; ans.style.transform = ''; if (ex) layout(); return; } const lr = leg.getBoundingClientRect().right, open = leg.offsetHeight > 150, avail = innerWidth - 90 - (lr + 28); let aw = ans.offsetWidth, c = innerWidth / 2; if (false && aw > avail && open && avail < 640) { ans.style.top = (leg.getBoundingClientRect().bottom + 12) + 'px'; window.ANS_EXTRA = ans.offsetHeight + 40; } else { if (aw > avail) { ans.style.maxWidth = avail + 'px'; q.style.whiteSpace = 'normal'; aw = ans.offsetWidth; } c = Math.min(Math.max(innerWidth / 2, lr + 28 + aw / 2), innerWidth - 90 - aw / 2); } ans.style.left = c + 'px'; ans.style.transform = 'translateX(-50%)'; if ((window.ANS_EXTRA || 0) !== ex) layout(); }; if (ans) { place(); addEventListener('resize', place); if (window.ResizeObserver) new ResizeObserver(place).observe(leg); } }
function legMeasure() {
  const oh = Math.min(lgin.offsetHeight, innerHeight - 150);
  leg.style.setProperty('--oh', oh + 'px'); document.documentElement.style.setProperty('--lb', (72 + Math.min(lgin.offsetHeight, 260) + 14) + 'px');
}
let legMode = innerWidth >= 1100; leg.classList.toggle('open', false); lgt.setAttribute('aria-expanded', false);
let cmpvOn = false, cmgW = null, legWas2 = false;
function cmLegSync() { if (!window.CMLEG) return; if (!cmgW) { cmgW = document.createElement('div'); cmgW.className = 'l3 cmg'; leg.querySelector('.lgb').appendChild(cmgW); } cmgW.innerHTML = window.CMLEG(); legMeasure(); }
window.cmLegSync = cmLegSync;
const legSet = v => { legMeasure(); leg.classList.toggle('open', v); document.documentElement.style.setProperty('--lb', (72 + (v ? Math.min(lgin.offsetHeight, 260) : 38) + 14) + 'px'); document.body.classList.toggle('legopen', v); setTimeout(() => size(), 60); setTimeout(() => size(), 700); lgt.setAttribute('aria-expanded', v); };
lgt.onclick = () => legSet(!leg.classList.contains('open'));
cv.addEventListener('click', () => { if (innerWidth < 1100) legSet(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && innerWidth < 1100) legSet(false); });
addEventListener('resize', () => { legMeasure(); const m = innerWidth >= 1100; if (m !== legMode) { legMode = m; legSet(m); } });
legMeasure(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { legMeasure(); size(); });
cv.tabIndex = 0; cv.setAttribute('aria-label', 'Modelo visual de seis sectores. Teclas 1 a 6: expandir un sector. Escape: volver.');
addEventListener('keydown', e => { if (/^[1-9]$/.test(e.key) && +e.key <= NS && !document.body.classList.contains('heroing')) focus(+e.key - 1); });
addEventListener('resize', size); size(); render(); requestAnimationFrame(frame);

/* escritorio: Hora del día y Fuente van anclados en posición absoluta (medida en reposo); al desplegarse, el vecino solo se atenúa y nunca es empujado */
{ const bar = document.getElementById('bar'), A = document.getElementById('ctl'), B = document.getElementById('cts'); let lt = 0;
  const hov = () => A.matches(':hover,:focus-within') || B.matches(':hover,:focus-within');
  const place = () => { if (!bar || !A || !B) return; [A, B].forEach(e => { e.style.position = ''; e.style.left = ''; e.style.bottom = ''; }); bar.style.height = ''; bar.style.width = '';
    if (innerWidth < 760 || !matchMedia('(hover:hover)').matches) return;
    const br = bar.getBoundingClientRect(), ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect(); if (!ra.width) return;
    const la = ra.left - br.left, lb = rb.left - br.left, h = Math.max(ra.height, rb.height); bar.style.height = h + 'px'; bar.style.width = Math.max(la + ra.width, lb + rb.width) + 'px';
    A.style.cssText += `;position:absolute;left:${la}px;bottom:0`; B.style.cssText += `;position:absolute;left:${lb}px;bottom:0`; };
  const later = d => { clearTimeout(lt); lt = setTimeout(() => { if (hov()) later(300); else place(); }, d); };
  [A, B].forEach(e => { e.addEventListener('mouseleave', () => later(900)); e.addEventListener('focusout', () => later(900)); e.addEventListener('click', () => later(900)); });
  addEventListener('resize', () => later(120)); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => later(50)); later(400); setTimeout(() => later(0), 1800); }

/* pregunta y respuesta: contenedor plegable a la derecha, mismo comportamiento elástico que «Cómo leer» */
{ const ans = document.getElementById('ans'), qt = document.getElementById('qt'), ain = ans && ans.querySelector('.ain'); let manual = false;
  const meas = () => { if (!ans) return; ans.style.setProperty('--ah', (38 + Math.ceil(ain.offsetHeight)) + 'px'); window.ANS_H = ans.classList.contains('open') ? 38 + ain.offsetHeight : 38; };
  const setQ = (v, byUser) => { if (!ans || ans.classList.contains('open') === v) return; if (byUser) manual = true; meas(); ans.classList.toggle('open', v); qt.setAttribute('aria-expanded', v); window.ANS_H = v ? 38 + ain.offsetHeight : 38; setTimeout(() => size(), 60); setTimeout(() => size(), 700); };
  if (ans) { if (innerWidth >= 1100) ans.classList.add('open'); meas(); qt.onclick = () => setQ(!ans.classList.contains('open'), true);
    addEventListener('scroll', () => { if (manual || innerWidth < 1100) return; setQ(scrollY < innerHeight * .8, false); }, { passive: true });
    addEventListener('resize', () => { meas(); size(); }); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { meas(); size(); }); setTimeout(meas, 300); }
}

// altura de la barra inferior → variable CSS (móvil: el botón de sectores sube sobre Fuente/Hora cuando se despliegan)
{ const bar = document.getElementById('bar'); if (bar) { const set = () => document.documentElement.style.setProperty('--barh', Math.round(bar.getBoundingClientRect().height) + 'px'); set(); if (window.ResizeObserver) new ResizeObserver(set).observe(bar); addEventListener('resize', set); } }

// selectores «Hora del día» y «Fuente»: todas las opciones miden lo mismo (la de la opción más ancha), para que la gota tenga un ancho único
(() => { const set = () => ['ctl', 'cts'].forEach(id => { const c = document.getElementById(id); if (!c) return; let m = 0; c.querySelectorAll('.mb').forEach(b => { const o = b.style.fontWeight; b.style.fontWeight = '600'; m = Math.max(m, b.scrollWidth); b.style.fontWeight = o; }); if (m) c.style.setProperty('--mbw', Math.ceil(m + 2) + 'px'); });
  set(); addEventListener('load', set); addEventListener('resize', set); if (document.fonts && document.fonts.ready) document.fonts.ready.then(set); })();
// selectores con gota (.tg): todas las opciones del mismo ancho = el de la opción más ancha de ese selector
(() => { let busy = 0; const eq = () => { if (busy) return; document.querySelectorAll('.tg:not(.st)').forEach(t => { t.style.setProperty('grid-auto-columns', 'max-content'); let m = 0; t.querySelectorAll('button').forEach(b => { m = Math.max(m, b.getBoundingClientRect().width); }); t.style.removeProperty('grid-auto-columns'); if (m) t.style.setProperty('--tgw', Math.ceil(m) + 'px'); });
    busy = 1; dispatchEvent(new Event('resize')); busy = 0; };
  addEventListener('load', () => setTimeout(eq, 0)); addEventListener('resize', () => { if (!busy) eq(); }); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(eq, 0)); })();
// v200 · selectores morph (Fuente / Hora del día): tamaños por estado, gota viajera, hover de escritorio
(() => { const mq = matchMedia('(max-width:760px)'), cs = [];
  const place = (c, anim) => { const g = c.querySelector('.gt'), on = c.querySelector('.mb.on'); if (!g || !on) return; const a = anim && c.classList.contains('open'); g.classList.toggle('nt', !a); g.style.left = on.offsetLeft + 'px'; g.style.top = on.offsetTop + 'px'; g.style.width = on.offsetWidth + 'px'; g.style.height = on.offsetHeight + 'px'; };
  const apply = (c, instant) => { const mbs = [...c.querySelectorAll('.mb')], n = mbs.length, mob = mq.matches; if (!n) return;
    if (instant) c.classList.add('nt'); c.style.setProperty('--cell', 'max-content'); c.style.setProperty('--cols', n);
    let m = 0; mbs.forEach(b => { const o = b.style.fontWeight; b.style.fontWeight = '600'; m = Math.max(m, b.scrollWidth); b.style.fontWeight = o; });
    const need = Math.ceil(m) + (mob ? 16 : 32), avail = innerWidth - (mob ? 28 : 44) - 8; let rows = 1, cols = n; while (rows < n && cols * need > avail) { rows++; cols = Math.ceil(n / rows); }
    c.style.setProperty('--cols', cols); c.style.setProperty('--cell', need + 'px'); c.style.setProperty('--rad', rows > 1 ? '26px' : '99px');
    const ow = cols * need + 8, oh = rows * mbs[0].offsetHeight + 8, l = c.querySelector('.lbl'), L = getComputedStyle(l), rg = document.createRange(); rg.selectNodeContents(l); const r = rg.getBoundingClientRect();
    const cw = Math.ceil(r.width + parseFloat(L.paddingLeft) + parseFloat(L.paddingRight) + 2), ch = Math.ceil(r.height + parseFloat(L.paddingTop) + parseFloat(L.paddingBottom) + 2), open = c.classList.contains('open');
    c.style.width = (open ? ow : cw) + 'px'; c.style.height = (open ? oh : ch) + 'px'; c.style.setProperty('--rad', open && rows > 1 ? '26px' : '99px'); place(c, false);
    void c.offsetWidth; if (instant) requestAnimationFrame(() => requestAnimationFrame(() => c.classList.remove('nt'))); };
  ['ctl', 'cts'].forEach(id => { const c = document.getElementById(id); if (!c) return; cs.push(c); if (!c.querySelector('.gt')) c.appendChild(Object.assign(document.createElement('i'), { className: 'gt' })); c.querySelectorAll('.mb').forEach((b, i) => b.style.setProperty('--i', i));
    c._o = c.classList.contains('open'); c._on = c.querySelector('.mb.on'); new MutationObserver(ms => { let a = 0, p = 0; ms.forEach(m => { if (m.type === 'childList') { if (m.target !== c) a = 1; } else if (m.target === c) { if (c.classList.contains('open') !== c._o) { c._o = !c._o; a = 1; } } else if (m.target.classList.contains('mb') && c.querySelector('.mb.on') !== c._on) { c._on = c.querySelector('.mb.on'); p = 1; } });
      if (a) { const open = c.classList.contains('open'); if (!open && c._h) { requestAnimationFrame(() => c._h && c.classList.add('open')); return; } apply(c, false); if (open) requestAnimationFrame(() => place(c, true)); } else if (p) place(c, true); }).observe(c, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
    if (matchMedia('(hover:hover)').matches) { c.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !mq.matches) { c._h = 1; c.classList.add('open'); } }); c.addEventListener('pointerleave', e => { c._h = 0; if (e.pointerType === 'mouse' && !mq.matches) c.classList.remove('open'); }); } });
  const all = () => cs.forEach(c => apply(c, true)); all(); addEventListener('load', all); addEventListener('resize', all); mq.addEventListener && mq.addEventListener('change', all); if (document.fonts && document.fonts.ready) document.fonts.ready.then(all); })();
