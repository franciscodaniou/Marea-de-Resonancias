/* Variación sonora · Barrio Puerto — arte de datos generativo (Canvas 2D)
   Codificación:
   · nodo = sector · rayo = ficha de terreno (ángulo = hora del día, largo = dB mín→máx, punto = dB prom)
   · partículas por rayo: oscilan entre dB mín y máx; velocidad ∝ dB prom; dispersión ∝ flujo vehicular;
     cantidad ∝ flujo peatonal · color = tipo de fuente (V/H/M/N)
   · metabola (silueta líquida) = perfil de dB promedio según la hora
   · halo = agrado percibido en encuestas (coral → ámbar → turquesa) */

const COL = { V: '#D20A2E', H: '#E2AC2C', C: '#6150A2', M: '#1A5E89', N: '#00675B' }; // paleta sobre fondo salvia
const CAT = { V: 'Vehicular', H: 'Humana (voces, música)', C: 'Comercial (locales, captadores)', M: 'Mecánica / portuaria', N: 'Natural' };
const rgbOf = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const SH = { V: 'Vehicular', H: 'Humana', C: 'Comercial', M: 'Portuaria', N: 'Natural' };
const F = FICHAS.map((r, i) => { const nd = r[2] == null, gp = nd ? 48 + ((r[10] || 3) - 1) / 4 * 35 : r[3]; // nd = sin dB medido: el relieve usa la intensidad percibida (1–5), nunca se muestra como dB
  return { id: r[11] ? r[11] + '·' + (i - FICHAS.findIndex(q => q[11] === r[11]) + 1) : 'BP-' + String(i + 1).padStart(2, '0'), t: r[0], m: +r[0].slice(0, 2) * 60 + +r[0].slice(3), s: r[1], nd,
  mn: nd ? gp - 5 : r[2], pr: gp, mx: nd ? gp + 5 : r[4], fp: r[5], fv: r[6], c: r[7], src: r[8], ph: r[9] }; });
const NSX = Array.from({ length: NS }, (_, i) => i), real = fs => fs.filter(f => !f.nd), hasAg = s => E.some(e => e[0] === s);
const DOM = NSX.map(s => { if (PRED[s]) return PRED[s]; const n = {}; F.filter(f => f.s === s).forEach(f => n[f.c] = (n[f.c] || 0) + 1); let b = 'M', v = 0; ['M', 'V', 'C', 'H', 'N'].forEach(c => { if ((n[c] || 0) > v) { v = n[c]; b = c; } }); return b; });
const E = ENCUESTAS;

let mo = 0, LW = 200, CMX = 0, CMY = 0, CMR = 100, cA = 0, cm = 0, CPX = [0, 0], CPY = 0, CPR = 80; const kc = Array(NS).fill(0); // comparativa: la malla acompaña al texto
let CX0 = 0, CY0 = 0, S0 = 100, eS = 0, amb = 0, ee = 0, Aglob = 1; // centro y escala de la marea total; progreso de escena
const FILTERS = { all: [0, 1e4], am: [0, 756], pm: [757, 1049], pk: [1050, 1e4] };
let flt = 'all', want = null, foc = null, k = 0, pf = null, hov = null, hs = null, W, H, dpr, T = 0, Rb, Rf, FX, FY, ctr = [], G = [], pkey = '';
const cv = document.getElementById('c'), x = cv.getContext('2d'), tip = document.getElementById('tip'), panel = document.getElementById('panel'), back = document.getElementById('back');
const lerp = (a, b, t) => a + (b - a) * t, cl = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const agr = a => { const t = cl((a + 1) / 3, 0, 1); return t < .5 ? mix([210, 10, 46], [226, 172, 44], t * 2) : mix([226, 172, 44], [0, 103, 91], (t - .5) * 2); };
const hex = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };
const mean = (a, f) => a.length ? a.reduce((s, v) => s + f(v), 0) / a.length : 0;
const agrSec = s => mean(E.filter(e => e[0] === s), e => e[1]);
const AGW = v => v < -.5 ? 'incomoda' : v < .5 ? 'da igual' : v < 1.5 ? 'gusta un poco' : 'gusta', agL2 = s => hasAg(s) ? 'agrado ' + agrSec(s).toFixed(2) + ' · ' + AGW(agrSec(s)) : 'sin encuestas', agL = s => hasAg(s) ? 'agrado ' + agrSec(s).toFixed(2) : 'sin encuestas', dbL = s => dbAvg(s) == null ? 'sin dB medido' : dbAvg(s).toFixed(1) + ' dB promedio';
let srcF = null; // filtro por fuente (se activa tocando un color de la leyenda)
const on = f => f.m >= FILTERS[flt][0] && f.m <= FILTERS[flt][1] && (!srcF || f.c === srcF);
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; // movimiento reducido
// una misma medición puede tener varias fuentes (BP-17 a 19): sus dB y flujos se cuentan una sola vez
const uniq = fs => { const seen = new Set(); return fs.filter(f => { const k = f.nd ? [f.s, f.t, 'nd'].join('|') : [f.s, f.t, f.mn, f.pr, f.mx].join('|'); if (seen.has(k)) return false; seen.add(k); return true; }); };
const dbAvg = s => { const q = real(uniq(F.filter(f => f.s === s))); return q.length ? mean(q, f => f.pr) : null; };
const angM = m => -Math.PI / 2 + cl((m - 580) / 570, 0, 1) * Math.PI * 1.9;
const rad = (d, R) => R * (.2 + .8 * (cl(d, 20, 95) - 20) / 75);
const wid = f => .13 + .04 * f.fv;

// flujos: personas = puntos lentos · vehículos = estelas rápidas (cantidad y velocidad ∝ nivel de flujo)
const FL = NSX.map(() => ({ p: Array.from({ length: 130 }, () => ({ a: 0, u: Math.random(), fr: Math.random(), sg: Math.random() < .5 ? 1 : -1, ph: Math.random() * 6.28, sm: .3 + Math.random() * 1.5, t: Math.random() * 3, pause: 0, tu: Math.random(), sz: 2.2 + Math.random() * 2.6 })), v: Array.from({ length: 30 }, (_, i) => ({ a: 0, u: Math.random(), fr: Math.random(), sg: i % 2 ? 1 : -1, ph: Math.random() * 6.28, sm: .5 + Math.random() * 1.1, t: Math.random() * 3, tf: Math.random() })) }));
const DIR = [.35, -.5, 0, 1.2, -.9, .7], LV = ['', 'Bajo', 'Medio', 'Alto'];
const lvl = s => { const fs = uniq(F.filter(f => f.s === s && on(f))); return pf && pf.s === s ? [pf.fp, pf.fv] : [mean(fs, f => f.fp) || 1, mean(fs, f => f.fv) || 1]; };
const FRDB = NSX.map(s => ['am', 'pm', 'pk'].map(k => { const q = real(uniq(F.filter(f => f.s === s && f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1]))); return q.length ? mean(q, f => f.pr) : null; }));
const lvn = v => LV[cl(Math.round(v), 1, 3)];
const cen = (g, f) => { const a = angM(f.m); return [g.cx + Math.cos(a) * g.R * .45, g.cy + Math.sin(a) * g.R * .45, g.R * (.16 + .34 * cl((f.pr - 50) / 30, 0, 1))]; };
const bar = (lab, v, hi, lo = 45, hi2 = 90) => `<div${hi ? ' class="hi"' : ''}>${lab}<span class="tr"><i style="width:${v == null ? 0 : cl((v - lo) / (hi2 - lo), 0, 1) * 100}%"${v == null ? '' : ` data-w="${(cl((v - lo) / (hi2 - lo), 0, 1) * 100).toFixed(1)}"`}></i></span><b${v == null ? '' : ` data-n="${v.toFixed(0)}"`}>${v == null ? '–' : v.toFixed(0)}</b></div>`;
function perfilHtml(s) { // patrón horario del sector y comparación entre sectores (dB promedio, mediciones únicas)
  const mine = uniq(F.filter(f => f.s === s)), fr = [['Mañana', 'am'], ['Tarde', 'pm'], ['Hora punta', 'pk']].map(([n, k]) => { const q = real(mine.filter(f => f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1])); return bar(n, q.length ? mean(q, f => f.pr) : null, false); }).join('');
  return `<div class="pf"><h5>dB promedio según la hora del día</h5>${fr}<h5>Comparación entre sectores</h5>${SECT.map((n, i) => bar(n, dbAvg(i), i === s)).join('')}${real(mine).length ? '' : '<small class="nd">Sin dB medido en este lugar: el relieve de la malla usa la intensidad percibida.</small>'}</div>`;
}
function flowHtml(s) { const [p, v] = lvl(s); return `<div class="fl"><div>Personas<span class="tr"><i style="width:${p / 3 * 100}%" data-w="${(p / 3 * 100).toFixed(1)}"></i></span><b>${lvn(p)}</b></div><div class="v">Vehículos<span class="tr"><i style="width:${v / 3 * 100}%" data-w="${(v / 3 * 100).toFixed(1)}"></i></span><b>${lvn(v)}</b></div></div>`; }

function size() {
  W = innerWidth; H = innerHeight; const mob = W < 760;
  dpr = Math.min(devicePixelRatio || 1, mob ? 1.5 : 2);
  cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  layout();
}
function layout() { // las figuras se reacomodan en sincronía con el pill/leyenda «Cómo leer»
  const mob = W < 760;
  const ansB = (document.getElementById('ans') || {getBoundingClientRect: () => ({bottom: 0})}).getBoundingClientRect().bottom, top0 = W < 760 ? Math.max(108, Math.round(ansB) + 8) : W < 1100 ? 64 : 72 + leg.offsetHeight + 14, LB = mob ? 106 : 176, gh = H - (mob ? 124 : 100) - top0, gw = W - (mob ? 28 : 76), x0 = mob ? 14 : 22;
  const minCw = mob ? 170 : 190; let best = null; // columnas: todas en fila, 3 o 2; el ancho de celda debe alojar la etiqueta
  (mob ? [2] : [NS, 3, 2]).forEach(c => { const nr = Math.ceil(NS / c); if (c > 2 && gw / c < minCw) return; const r = Math.min(gw / c / 2.05, (gh / nr - LB) / 2.2); if (!best || r > best.r) best = { c, nr, r }; });
  if (!best) { const nr = Math.ceil(NS / 2); best = { c: 2, nr, r: Math.min(gw / 2 / 2.05, (gh / nr - LB) / 2.2) }; }
  Rb = best.r; LW = gw / best.c; const bh = 2.2 * Rb + LB, off = (gh / best.nr - bh) / 2;
  ctr = NSX.map(i => { const rw = Math.floor(i / best.c), inRow = Math.min(best.c, NS - rw * best.c), cx = i % best.c + (best.c - inRow) / 2; return [x0 + gw * (cx + .5) / best.c, top0 + (gh / best.nr) * rw + off + 8 + Rb * 1.08]; });
  CMX = mob ? W / 2 : W * .27; CMY = mob ? H * .37 : H * .70; CMR = mob ? Math.min(W * .26, H * .115) : Math.min(W * .15, H * .23);
  CPX = mob ? [W * .27, W * .73] : [W * .15, W * .4]; CPY = mob ? H * .385 : H * .72; CPR = mob ? Math.min(W * .27, H * .115) : Math.min(W * .13, H * .24);
  CX0 = x0 + gw / 2; CY0 = top0 + gh / 2 + (mob ? -8 : 0); S0 = Math.min(gw * (mob ? .24 : .15), gh * (mob ? .3 : .36));
  if (mob) { // móvil: figura arriba, panel como hoja inferior (la mitad inferior de la pantalla)
    const pt = Math.round(H * .5), t1 = 100, A = pt - t1 - 6;
    Rf = Math.max(60, Math.min(W * .36, (A - 90) / 2.2)); FX = W / 2; FY = t1 + (A - 90 - 2.2 * Rf) / 2 + 1.06 * Rf;
    document.documentElement.style.setProperty('--pt', pt + 'px');
  } else {
    const fw = W < 900 ? W - 40 : W - 480; Rf = Math.max(80, Math.min((gh - 100) / 2.3, fw / 2.3));
    FX = W < 900 ? W / 2 : 22 + fw / 2; FY = top0 + 8 + Rf * 1.08 + (gh - 84 - 2.2 * Rf) / 2;
  }
}

const PAIR = () => (window.MAREA && MAREA.pair) || [0, 1];
const AGS = NSX.map(s => [-1, 0, 1, 2].map(v => E.filter(e => e[0] === s && e[1] === v).length)), AGC = ['#D20A2E', '#a39f8a', '#5E9C8F', '#00675B'];
function geoms() {
  G = NSX.map(s => {
    const kk = foc === s ? k : 0; let cx = lerp(ctr[s][0], FX, kk), cy = lerp(ctr[s][1], FY, kk), R = lerp(Rb, Rf, kk), al = foc === null || foc === s ? 1 : 1 - k;
    if (cA > .001) { const q = kc[s], pi = PAIR().indexOf(s), tm = pi >= 0 ? cm : 0; cx = lerp(cx, lerp(CMX, CPX[pi] || CMX, tm), q); cy = lerp(cy, lerp(CMY - (W < 760 ? mo * H * .095 : 0), CPY, tm), q); R = lerp(R, lerp(CMR * (W < 760 ? 1 - mo * .5 : 1), CPR, tm), q); al *= lerp(1 - cA, 1, q); }
    return { cx, cy, R, al, kk };
  });
}

// ===== Marea de resonancias: malla orgánica (tubo deformado por ruido Perlin) =====
// Malla: largo = hora (09:40 → 18:50) · alrededor = fuente de sonido · relieve = dB · color = lugar · puntos = fichas
const TAU = Math.PI * 2, NZ = 30, NA = 28, NV = (NZ + 1) * (NA + 1), LZ = 3.2, FP = 560;
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
  f.fg = (f.s + f.fl) / NS;                                    // idem en la marea total (cada lugar ocupa un cuarto)
  f.sg = .035 + .075 * cl((f.mx - f.mn) / 60, 0, 1);          // ancho de la zona iluminada = rango dB
  f.amp = Math.max(-.08, (f.pr - 48) / 35 * .55);             // relieve = dB promedio
  f.hf = ((i * 53) % 17) / 17;
});
const dfr = (a, b) => { const d = Math.abs(a - b) % 1; return d > .5 ? 1 - d : d; };
const gws = (f, fr, u, g, sg) => { const a = dfr(fr, g), b = u - f.u; return Math.exp(-(a * a / (2 * sg * sg) + b * b / (2 * .04 * .04))); };
const MS = NSX.map(s => {
  const m = { SX: new Float32Array(NV), SY: new Float32Array(NV), LW: new Float32Array(NV), LC: new Uint8Array(NV), hv: new Float32Array(NV), EV: new Float32Array(NV), bB: new Float32Array(NV), bS: new Float32Array(NV), ttS: 0 };
  const own = F.filter(f => f.s === s);
  own.forEach(f => { f.litB = []; f.litS = []; });
  for (let i = 0; i <= NZ; i++) for (let j = 0; j <= NA; j++) {
    const id = i * (NA + 1) + j, u = i / NZ, frB = (s + j / NA) / NS, frS = j / NA;
    m.hv[id] = pn(i * .21 + s * 5, j * .21, 3.3);
    F.forEach(f => { m.bB[id] += f.amp * gws(f, frB, u, f.fg, f.sg / NS); });
    own.forEach(f => { m.bS[id] += f.amp * gws(f, frS, u, f.fl, f.sg); const wb = gws(f, frB, u, f.fg, f.sg / NS), ws = gws(f, frS, u, f.fl, f.sg); if (wb > .07) f.litB.push(id, wb); if (ws > .07) f.litS.push(id, ws); });
  }
  return m;
});
F.forEach(f => { f.bAB = 0; f.bAS = 0; F.forEach(g => { f.bAB += g.amp * gws(g, f.fg, f.u, g.fg, g.sg / NS); if (g.s === f.s) f.bAS += g.amp * gws(g, f.fl, f.u, g.fl, g.sg); }); });

let cY = 1, sY = 0, cX = 1, sX = 0, RX_ = 0, RY_ = 0, RZ_ = 0, oy = 0, ox = 0;
const rot = (a, b, c, S) => { const x1 = a * cY + c * sY, z1 = -a * sY + c * cY, y2 = b * cX - z1 * sX, z2 = b * sX + z1 * cX; RX_ = x1 * S; RY_ = y2 * S; RZ_ = z2 * S; };
const rad0 = (th, u, tt, off) => .30 + .85 * pn(Math.cos(th) * 1.3 + off, Math.sin(th) * 1.3 + off, u * 2.2 - tt);
const evOf = (ee0, h) => ee0 <= 0 ? 0 : ee0 >= 1 ? 1 : cl(ee0 * 1.6 - .6 * h, 0, 1); // el paso de marea total a sectores se disuelve por zonas

function updMesh(s, ee0) {
  const m = MS[s], g = G[s], ag = cl(1 - (agrSec(s) + 1) / 3, 0, 1), rm = RM ? .2 : 1, ttS = T * rm * (.16 + .5 * ag), ttB = T * rm * .3, S1 = g.R * .48; m.ttS = ttS;
  for (let i = 0; i <= NZ; i++) {
    const u = i / NZ, zz = (u - .5) * LZ;
    for (let j = 0; j <= NA; j++) {
      const id = i * (NA + 1) + j, ev = evOf(ee0, m.hv[id]); let bx = 0, by = 0, bz = 0, qx = 0, qy = 0, qz = 0;
      if (ev < 1) { const th = (s + j / NA) / NS * TAU, r = Math.max(.16, rad0(th, u, ttB, 11.3) + m.bB[id]); rot(r * Math.cos(th), r * Math.sin(th), zz, S0); bx = RX_; by = RY_; bz = RZ_; }
      if (ev > 0) { const th = j / NA * TAU, r = Math.max(.16, rad0(th, u, ttS, s * 3.7) + m.bS[id]); rot(r * Math.cos(th), r * Math.sin(th), zz, S1); qx = RX_; qy = RY_; qz = RZ_; }
      const kf = FP / (FP + lerp(bz, qz, ev));
      m.SX[id] = lerp(CX0, g.cx, ev) + lerp(bx, qx, ev) * kf; m.SY[id] = lerp(CY0, g.cy, ev) + lerp(by, qy, ev) * kf; m.EV[id] = ev;
    }
  }
}
function put(m, id, w, f, ph, mul) { const i = (id / (NA + 1)) | 0, pl = .4 + .6 * Math.pow(.5 + .5 * Math.sin(ph - i / NZ * 9), 2), v = w * pl * mul; if (v > m.LW[id]) { m.LW[id] = v; m.LC[id] = CI[f.c]; } }
function lightMesh(s) { // cada ficha ilumina parte de la malla; cada tramo tiene un solo color (el de la ficha más fuerte)
  const m = MS[s], rm = RM ? .2 : 1; m.LW.fill(0);
  F.forEach(f => {
    if (f.s !== s || !on(f)) return;
    const h = hov === f || pf === f, mul = (pf && pf !== f ? .22 : 1) * (h ? 1.6 : 1), ph = T * rm * (1 + f.pr / 45);
    for (let q = 0; q < f.litB.length; q += 2) { const id = f.litB[q], w = f.litB[q + 1] * (1 - m.EV[id]); if (w > .05) put(m, id, w, f, ph, mul); }
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
function calcDots(ee0) {
  DOTS.length = 0;
  F.forEach(f => {
    const g = G[f.s], al = g.al * Aglob; if (al < .05 || !on(f)) return;
    const ev = evOf(ee0, f.hf), zz = (f.u - .5) * LZ, ag = cl(1 - (agrSec(f.s) + 1) / 3, 0, 1), rm = RM ? .2 : 1; let bx = 0, by = 0, bz = 0, qx = 0, qy = 0, qz = 0;
    if (ev < 1) { const th = f.fg * TAU, r = Math.max(.16, rad0(th, f.u, T * rm * .3, 11.3) + f.bAB); rot(r * Math.cos(th), r * Math.sin(th), zz, S0); bx = RX_; by = RY_; bz = RZ_; }
    if (ev > 0) { const th = f.fl * TAU, r = Math.max(.16, rad0(th, f.u, T * rm * (.16 + .5 * ag), f.s * 3.7) + f.bAS); rot(r * Math.cos(th), r * Math.sin(th), zz, g.R * .48); qx = RX_; qy = RY_; qz = RZ_; }
    const kf = FP / (FP + lerp(bz, qz, ev));
    DOTS.push({ f, x: lerp(CX0, g.cx, ev) + lerp(bx, qx, ev) * kf, y: lerp(CY0, g.cy, ev) + lerp(by, qy, ev) * kf, al });
  });
}
const lite = (c, t) => c.map(v => Math.round(v + (255 - v) * t)), dark = (c, t) => c.map(v => Math.round(v * (1 - t)));
const CRGBA = CK.map(q => rgbOf(COL[q]));
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

let sndT = 0, lastBlip = null, lastFoc = false, lastT = 0, curDt = 0, lastLh = 0, lastHt = '', lastDeep = false, lastTide = true;
function frame(ms) {
  T = ms / 1000; const dt = Math.min(.05, T - lastT); lastT = T;
  const lh = leg.offsetHeight; if (W >= 1100 && Math.abs(lh - lastLh) > 1) { lastLh = lh; layout(); document.documentElement.style.setProperty('--lb', (72 + lh + 14) + 'px'); }
  k += ((want === null ? 0 : 1) - k) * .09;
  if (want === null && k < .003) { k = 0; foc = null; } else if (want !== null) foc = want;
  // scroll → marea total (arriba) → sectores → ambiente (contraste y estadísticas)
  const vh = innerHeight, sy0 = window.scrollY, hero = document.body.classList.contains('heroing') || document.body.classList.contains('about');
  const stEl = document.querySelectorAll('.step'), chEl = document.querySelector('.finds') || document.querySelector('.charts2'), csE = document.querySelector('.cstage'); let cT = 0, cS = -1, cmpT = 0;
  const fdE = document.querySelector('.finds'), stpE = document.querySelector('.steps'), rmp = e => cl((vh * .95 - e.getBoundingClientRect().top) / (.5 * vh), 0, 1);
  amb = hero || want !== null ? 0 : chEl ? Math.max(fdE && stpE ? rmp(fdE) * (1 - cl((vh * .12 - stpE.getBoundingClientRect().top) / (vh * .2), 0, 1)) : 0, rmp(document.querySelector('.charts2') || chEl)) : cl((sy0 - 1.0 * vh) / (.6 * vh), 0, 1);
  if (stEl.length && !hero && want === null) { const f0 = stEl[0].getBoundingClientRect(), l0 = (csE || stEl[stEl.length - 1]).getBoundingClientRect(); cT = cl((vh * .12 - f0.top) / (vh * .2), 0, 1) * cl((l0.bottom - vh * .45) / (vh * .3), 0, 1);
    let best = 1e9; stEl.forEach((el, q) => { const r = el.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - vh / 2); if (d < best) { best = d; cS = q; } }); if (csE && csE.getBoundingClientRect().top < vh * .5) cmpT = 1; }
  { const ob = W < 760 && cS >= 0 && !cmpT && stEl[cS].querySelector('.blk.open') ? 1 : 0; mo += (ob - mo) * (1 - Math.exp(-dt * 6)); }
  cA += (cT - cA) * (1 - Math.exp(-dt * 5)); cm += (cmpT - cm) * (1 - Math.exp(-dt * 5)); for (let s = 0; s < NS; s++) kc[s] += ((cT > .02 && (cmpT ? PAIR().includes(s) : s === cS) ? 1 : 0) - kc[s]) * (1 - Math.exp(-dt * 4));
  if (window.SND && SND.active) { sndT += dt; if (sndT > .2) { sndT = 0; SND.update(want !== null ? [[want, 0]] : cmpT && cT > .02 ? [[PAIR()[0], -.7], [PAIR()[1], .7]] : cT > .02 && cS >= 0 ? [[cS, 0]] : NSX.map(s => [s, (s / (NS - 1) * 2 - 1) * .8]), hero ? 0 : 1 - amb); } } // sonido por fuentes (opcional)
  const tt0 = cl(sy0 / (.9 * vh), 0, 1), eT = want !== null ? 1 : hero ? 0 : tt0 * tt0 * (3 - 2 * tt0);
  eS += (eT - eS) * (1 - Math.exp(-dt * 5)); if (Math.abs(eT - eS) < .002) eS = eT;
  ee = eS * (1 - amb); Aglob = document.body.classList.contains('about') ? .6 : lerp(1, .27, amb);
  const fo = want !== null; if (fo !== lastFoc) { lastFoc = fo; document.body.classList.toggle('foc', fo); }
  const deep = amb > .06 || cA > .03, tide = eS < .5; if (deep !== lastDeep) { lastDeep = deep; document.body.classList.toggle('deep', deep); } if (tide !== lastTide) { lastTide = tide; document.body.classList.toggle('tide', tide); }
  const rm = RM ? .2 : 1, ry = Math.sin(T * rm * .17) * .62 + oy, rx = -.28 + Math.sin(T * rm * .11 + 1) * .14 + ox; // se favorecen las vistas de las bases del tubo cY = Math.cos(ry); sY = Math.sin(ry); cX = Math.cos(rx); sX = Math.sin(rx);
  geoms(); x.globalCompositeOperation = 'source-over'; x.fillStyle = '#DCDDD3'; x.fillRect(0, 0, W, H);
  curDt = dt * rm;
  for (let s = 0; s < NS; s++) { updMesh(s, ee); lightMesh(s); }
  for (let s = 0; s < NS; s++) { const al = G[s].al * Aglob; if (al > .01) { drawMesh(s, al, evOf(ee, .5)); flows(s, curDt, al); } }
  calcDots(ee); drawDots();
  x.globalCompositeOperation = 'source-over'; x.textAlign = 'center';
  // anillo de agrado (encuestas) en los lugares acoplados; en la comparación, además A/B, nombre y agrado
  { const mobq = W < 760; G.forEach((g, s) => { const q = kc[s] * cA; if (q < .04) return; const ags = AGS[s], tot = ags.reduce((p, c) => p + c, 0) || 1, r0 = g.R * .72; let a0 = -Math.PI / 2;
    x.save(); x.setLineDash([2, 5]); x.lineWidth = .8; x.strokeStyle = '#5E6655'; x.fillStyle = '#5E6655'; x.font = `${mobq ? 8 : 10}px Helvetica,Arial`; x.textAlign = 'left'; // anillos finos: relieve de referencia en dB
    if (!real(F.filter(f => f.s === s)).length) { /* sin dB: sin anillos de referencia */ } else [55, 65, 75, 85].forEach(d => { const rr = g.R * (.35 + .00754 * (d - 48)); x.globalAlpha = q * .3; x.beginPath(); x.arc(g.cx, g.cy, rr, 0, TAU); x.stroke(); x.globalAlpha = q * .6; x.fillText(d === 85 ? '85 dB' : d, g.cx + rr * .7071 + 2, g.cy - rr * .7071 - 1); }); x.restore();
    x.lineWidth = mobq ? 1.2 : 1.5; x.lineCap = 'butt'; { const sw = 1 - Math.pow(1 - cl((q - .04) / .55, 0, 1), 3); let cum = 0; ags.forEach((c, i) => { if (!c) return; const f0 = cum / tot, f1 = (cum + c) / tot, e1 = Math.min(f1, sw); cum += c; if (e1 <= f0 + .002) return; x.globalAlpha = q * .8; x.strokeStyle = AGC[i]; x.beginPath(); x.arc(g.cx, g.cy, r0, a0 + TAU * f0 + .035, a0 + TAU * e1 - (e1 === f1 ? .035 : 0)); x.stroke(); }); } // el anillo de agrado se dibuja al acoplarse
    const pi = PAIR().indexOf(s), qc = pi >= 0 ? cm * kc[s] * cA : 0;
    if (qc > .25) { const c = rgbOf(COL[DOM[s]]); x.globalAlpha = qc; x.fillStyle = '#3b4234'; x.font = `700 ${mobq ? 13 : 18}px Helvetica,Arial`; x.fillText(SECT[s].toUpperCase(), g.cx, g.cy + r0 + (mobq ? 20 : 30));
      x.font = `${mobq ? 11 : 14}px Helvetica,Arial`; x.fillStyle = '#5E6655'; x.fillText(hasAg(s) ? `agrado percibido ${agrSec(s).toFixed(2)} · ${tot} respuestas` : 'sin encuestas de agrado', g.cx, g.cy + r0 + (mobq ? 34 : 50));
      x.font = `800 ${mobq ? 15 : 22}px Helvetica,Arial`; x.fillStyle = `rgb(${c})`; x.fillText('AB'[pi], g.cx, g.cy - r0 - (mobq ? 8 : 12)); }
    x.globalAlpha = 1; }); }
  const lab = cl((eS - .6) / .35, 0, 1) * (1 - amb) * (1 - cl(cA * 4, 0, 1));
  if (lab > .05 && want === null && W >= 760) { const mob = W < 760, ab = document.getElementById('ans').getBoundingClientRect().bottom, yt = Math.min(Math.max(ab + 26, 0), Math.min(...G.map(g => g.cy - g.R)) - (mob ? 26 : 20)); x.globalAlpha = lab * .9; x.fillStyle = '#5E6655'; x.font = `${mob ? 12 : 16}px Helvetica,Arial`; x.fillText(mob ? 'Un anillo = un lugar · color = qué suena · barra = qué tan fuerte' : 'Un anillo es un lugar · el color es qué suena · la barra es qué tan fuerte (dB) · las columnas, cómo cambia en el día', W / 2, yt); x.globalAlpha = 1; }
  const rk = NSX.filter(s => dbAvg(s) != null).sort((a, b) => dbAvg(b) - dbAvg(a)), loud = rk[0], quiet = rk.length > 1 ? rk[rk.length - 1] : -1;
  if (lab > .05) G.forEach((g, s) => {
    if (g.al < .05) return; const c = rgbOf(COL[DOM[s]]), big = g.kk > .5, mob = W < 760, [p, v] = lvl(s), y = g.cy + g.R * 1.12 + (big ? (mob ? 24 : 32) : (mob ? 18 : 22));
    const sc = big || mob ? 1 : Math.min(1, (LW - 14) / 250); x.save(); if (sc < 1) { x.translate(g.cx, y); x.scale(sc, sc); x.translate(-g.cx, -y); }
    x.globalAlpha = g.al * lab; x.fillStyle = '#3b4234'; x.font = `700 ${big ? (mob ? 20 : 28) : (mob ? 14 : 20)}px Helvetica,Arial`; x.fillText(SECT[s].toUpperCase(), g.cx, y);
    x.font = `${big ? (mob ? 13 : 16) : (mob ? 11 : 14)}px Helvetica,Arial`; x.fillStyle = `rgb(${c})`;
    const dbl = dbAvg(s) == null ? dbL(s) : (dbAvg(s) * cl(lab * 1.15, 0, 1)).toFixed(1) + ' dB promedio';
    if (!big) { const nd = dbAvg(s) == null, dv = nd ? 0 : dbAvg(s) * cl(lab * 1.15, 0, 1), o1 = mob ? 24 : 36, bw = mob ? 96 : 150, by = y + o1 + 8; // intensidad legible: número grande + barra con la misma escala en todos los lugares
      const rr = (px, py, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(px, py, w, h, r); else x.rect(px, py, w, h); x.fill(); };
      if (nd) { x.fillStyle = '#8F9984'; x.font = `${mob ? 12 : 15}px Inter,Helvetica,Arial`; x.fillText('sin dB medido', g.cx, y + o1); }
      else { const nf = `300 ${mob ? 24 : 32}px Inter,Helvetica,Arial`, uf = `${mob ? 11 : 13}px Inter,Helvetica,Arial`, ns = dv.toFixed(1), un = ' dB promedio'; x.font = nf; const w1 = x.measureText(ns).width; x.font = uf; const w2 = x.measureText(un).width, x0 = g.cx - (w1 + w2) / 2; x.textAlign = 'left';
        x.font = nf; x.fillStyle = `rgb(${c})`; x.fillText(ns, x0, y + o1 + (mob ? 2 : 4)); x.font = uf; x.fillStyle = '#8F9984'; x.fillText(un, x0 + w1, y + o1 + (mob ? 2 : 4)); x.textAlign = 'center'; }
      const bh = 7, by2 = by + 3; x.globalAlpha = g.al * lab * .16; x.fillStyle = '#5E6655'; rr(g.cx - bw / 2, by2, bw, bh, bh / 2);
      if (!nd) { x.globalAlpha = g.al * lab; x.fillStyle = `rgb(${c})`; rr(g.cx - bw / 2, by2, Math.max(bh, bw * cl((dv - 40) / 55, 0, 1)), bh, bh / 2); } x.globalAlpha = g.al * lab;
      if (s === loud || s === quiet) { x.save(); x.globalAlpha = g.al * lab; x.fillStyle = `rgb(${c})`; x.font = `700 ${mob ? 10 : 12}px Inter,Helvetica,Arial`; if ('letterSpacing' in x) x.letterSpacing = '1.5px'; x.textAlign = 'center'; x.fillText(s === loud ? 'MÁS RUIDOSO' : 'MÁS TRANQUILO', g.cx, mob ? by + 58 : y - 26); x.restore(); }
      if (!mob) { const names = ['Mañana', 'Tarde', 'H. punta'], ks = ['am', 'pm', 'pk'], base = by + 46; FRDB[NSX.indexOf(s)].forEach((v, i) => { const cxp = g.cx + (i - 1) * 46, hh = v == null ? 3 : Math.max(3, cl((v - 55) / 25, 0, 1) * 24 + 3); x.globalAlpha = g.al * lab * (v == null ? .16 : (flt === 'all' || flt === ks[i] ? .9 : .35)); x.fillStyle = v == null ? '#5E6655' : `rgb(${c})`; rr(cxp - 9, base - hh, 18, hh, 3); x.globalAlpha = g.al * lab; x.fillStyle = '#8F9984'; x.font = '10px Inter,Helvetica,Arial'; x.fillText(names[i], cxp, base + 12); }); x.globalAlpha = g.al * lab; }
      const py = mob ? 0 : 40;
      x.font = `${mob ? 11 : 14}px Helvetica,Arial`; x.fillStyle = `rgb(${c})`; x.fillText((mob ? '' : 'Predomina: ') + SH[DOM[s]], g.cx, by + (mob ? 28 : 34) + py); x.fillText(agL2(s), g.cx, by + (mob ? 42 : 50) + py); x.fillStyle = '#3b4234';
      if (mob) { /* personas y vehículos: en la tarjeta del sector */ } else x.fillText(`Personas: ${lvn(p)} · Vehículos: ${lvn(v)}`, g.cx, by + 68 + py); }
    else { x.fillText('Predomina: ' + SH[DOM[s]] + ' · ' + agL(s), g.cx, y + (mob ? 18 : 24)); x.fillStyle = '#3b4234'; x.fillText(`Personas: ${lvn(p)} · Vehículos: ${lvn(v)}`, g.cx, y + (mob ? 35 : 46)); }
    x.restore(); x.globalAlpha = 1;
  });
  const ht = want !== null ? '' : (tide ? 'Todas las mediciones · toca un punto' : 'Clic en un sector para expandirlo · teclas 1–' + NS); if (ht !== lastHt) { lastHt = ht; hint.textContent = ht; }
  const dw = document.getElementById('down'), dl = tide ? 'Desplegar sectores ↓' : 'Ver lugar por lugar ↓'; if (dw.textContent !== dl) dw.textContent = dl;
  requestAnimationFrame(frame);
}

const hint = document.getElementById('hint'), psub = document.getElementById('psub');
function hintPos() { if (innerWidth > 900) { const r = document.getElementById('cts').getBoundingClientRect(); if (r.width) hint.style.left = Math.round(r.right + 12) + 'px'; } else hint.style.left = ''; }
addEventListener('resize', hintPos); setInterval(hintPos, 400);
function render() {
  panel.style.display = want !== null ? 'block' : 'none'; psub.style.display = 'none'; hint.style.display = want !== null ? 'none' : 'block';
  const s = want !== null ? want : hs, key = [want, flt, srcF, pf && pf.id, s].join();
  if (key === pkey || want === null) return; pkey = key; const sc = panel.scrollTop;
  if (s === null) { panel.className = ''; panel.innerHTML = '<h2>Explora los seis sectores</h2>'; psub.textContent = 'Pasa el cursor sobre un sector y haz clic para expandirlo y aislarlo; luego elige una medición.'; if (panel.style.display !== 'none') { psub.style.display = 'block'; psub.style.bottom = (22 + panel.offsetHeight + 10) + 'px'; } return; }
  const fs = uniq(F.filter(f => f.s === s && on(f))), es = E.filter(e => e[0] === s), a = agrSec(s), db = es.filter(e => e[2]), mood = AGW(a);
  const AGN = ['Incomoda', 'Da igual', 'Gusta un poco', 'Gusta'], rf = real(fs), dbm = rf.length ? mean(rf, f => f.pr) : null, mx100 = rf.filter(f => f.mx >= 100), mxv = rf.length ? Math.max(...rf.filter(f => f.mx < 100).map(f => f.mx)) : null, hex = COL[DOM[s]], ags = AGS[s], fpm = mean(fs, f => f.fp), fvm = mean(fs, f => f.fv), P = v => cl((v - 40) / 55, 0, 1) * 100;
  let h = `<div class="sc pn"><div class="bh"><h3>${SECT[s]}</h3><div class="sub">${SUB[s]} · ${fs.length} mediciones visibles</div></div>
    <div class="big" style="color:${hex}">${dbm == null ? '<span class="nd">sin dB</span>' : `<span data-n="${dbm.toFixed(1)}" data-dec="1">${dbm.toFixed(1)}</span>`}<small>${dbm == null ? 'sin medir · relieve por intensidad percibida' : 'dB promedio'}</small></div>
    ${dbm == null ? '' : `<div class="dbs"><div class="dtr"><i data-w="${P(dbm).toFixed(1)}" style="background:${hex}"></i></div><small>≈ ${DBW(dbm)}</small></div>`}
    <div class="chips"><span style="color:${hex}">● ${SH[DOM[s]]}</span>${es.length ? `<span style="color:rgb(${agr(a)})">agrado percibido <i style="font-style:normal" data-n="${a.toFixed(2)}" data-dec="2">${a.toFixed(2)}</i> · ${mood}</span>` : '<span>sin encuestas</span>'}</div>
    ${es.length ? `<div class="ag"><div class="agb" data-reveal>${ags.map((c, k) => c ? `<span style="flex:${c};background:${AGC[k]}">${c}</span>` : '').join('')}</div><small>agrado percibido (−1…2) · ${es.length} respuestas: ${ags.map((c, k) => `<b style="color:${AGC[k]}">${c}</b> ${AGN[k].toLowerCase()}`).join(' · ')}</small></div>` : ''}
    <div class="fact">${mxv == null ? 'Sin dB medido' : `dB máx. registrado <span data-n="${mxv}">${mxv}</span>${mx100.length ? ` <em class="ex">(sin ${mx100.length} pico${mx100.length > 1 ? 's' : ''} puntual${mx100.length > 1 ? 'es' : ''} de ${Math.max(...mx100.map(f => f.mx))} dB)</em>` : ''}`} · flujo peatonal <span data-n="${fpm.toFixed(1)}" data-dec="1">${fpm.toFixed(1)}</span> · vehicular <span data-n="${fvm.toFixed(1)}" data-dec="1">${fvm.toFixed(1)}</span> (1-3)</div>`;
  h += flowHtml(s) + perfilHtml(s);
  if (db.length) h += `<small class="dbe">dB medidos en encuestas: ${mean(db, e => e[2]).toFixed(1)} (n=${db.length})</small>`;
  h += `<div class="ag"><q>${QUOTE[s]}</q></div>`;
  if (want === null) h += '<small class="hint">Clic para expandir este sector</small>';
  else {
    if (pf) h += `<div class="det" style="border-left-color:${COL[pf.c]}"><b>${pf.id} · ${pf.t} h</b>${pf.src}<br>${pf.nd ? 'sin dB medido · intensidad percibida ' + FICHAS[F.indexOf(pf)][10] + '/5' : pf.mn + '–' + pf.mx + ' dB · prom. ' + pf.pr}<br>Flujo peatonal ${pf.fp}/3 · vehicular ${pf.fv}/3<br><span style="color:${COL[pf.c]}">${CAT[pf.c]}</span><br><i>${pf.ph}</i></div>`;
    h += `<div class="pf"><h5>Registro de mediciones · barra = rango dB mín→máx, marca = promedio</h5></div><div class="list">` + F.map((f, i) => f.s === s && on(f) ? `<button class="it${pf === f ? ' on' : ''}" data-i="${i}"><span style="background:${COL[f.c]}"></span>${f.id} · ${f.t}<em>${f.src}</em><div class="rg${f.nd ? ' nd' : ''}">${f.nd ? '' : `<i style="left:${P(f.mn)}%;width:${Math.max(3, P(f.mx) - P(f.mn))}%;background:${COL[f.c]}"></i><u style="left:${P(f.pr)}%"></u>`}</div><b>${f.nd ? 'sin dB' : f.pr + ' dB'}</b></button>` : '').join('') + '</div>';
  }
  h += '</div>';
  panel.className = want !== null ? 'big' : ''; panel.innerHTML = h; panel.scrollTop = sc; if (window.VITA) VITA.scan(panel);
}

let dragM = null, dragged = false;
cv.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) dragM = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, mv: 0 }; });
addEventListener('pointermove', e => { if (!dragM) return; const dx = e.clientX - dragM.x, dy = e.clientY - dragM.y; dragM.mv = Math.max(dragM.mv, Math.hypot(e.clientX - dragM.sx, e.clientY - dragM.sy)); dragM.x = e.clientX; dragM.y = e.clientY; if (dragM.mv > 10) { oy += dx * .006; ox = cl(ox + dy * .006, -1.1, 1.1); } });
addEventListener('pointerup', () => { if (dragM && dragM.mv > 10) { dragged = true; setTimeout(() => dragged = false, 60); } dragM = null; });
function pick(e) {
  const mx = e.clientX, my = e.clientY; hs = null; hov = null;
  if (amb < .2) {
    let best = Math.pow(W < 760 ? 24 : 17, 2);
    DOTS.forEach(d => { const q = (d.x - mx) * (d.x - mx) + (d.y - my) * (d.y - my); if (d.al > .3 && q < best) { best = q; hov = d.f; } });
    if (eS > .85) G.forEach((g, s) => { if (g.al < .5) return; const inFig = Math.hypot(mx - g.cx, my - g.cy) < g.R * 1.25 || (want === null && Math.abs(mx - g.cx) < Math.max(g.R * 1.1, W < 760 ? 60 : 90) && my > g.cy - g.R * 1.1 && my < g.cy + g.R * 1.12), inLbl = want === null && Math.abs(mx - g.cx) < Math.min(LW / 2, Math.max(g.R, W < 760 ? 70 : 110)) && my > g.cy + g.R * .95 && my < g.cy + g.R * 1.12 + 92; if ((inFig && (want === null || k > .5)) || inLbl) hs = s; });
  }
  if (hov) { tip.innerHTML = `<b>${hov.id} · ${hov.t} h</b>${hov.src}<br>${hov.nd ? 'sin dB medido · intensidad ' + FICHAS[F.indexOf(hov)][10] + '/5' : hov.mn + '–' + hov.mx + ' dB · prom ' + hov.pr}<br><span style="color:${COL[hov.c]}">${CAT[hov.c]}</span><br><i>${hov.ph}</i>`; tip.style.display = 'block'; tip.style.left = Math.max(8, Math.min(mx + 16, W - 280)) + 'px'; tip.style.top = (W < 760 ? Math.max(60, my - 130) : my + 16) + 'px'; }
  else tip.style.display = 'none';
  if (hov !== lastBlip) { lastBlip = hov; if (hov && window.SND) SND.blip(hov.c, hov.pr); }
  cv.style.cursor = hs !== null || hov ? 'pointer' : (dragM ? 'grabbing' : 'grab'); render();
}
function focus(s) { if (s !== null && eS < .85) return; if (innerWidth >= 1100) legSet(s === null); /* escritorio: la leyenda se pliega al expandir un sector */ want = s; pf = null; back.style.display = s === null ? 'none' : 'block'; document.body.classList.toggle('lock', s !== null); pkey = ''; render(); }

cv.addEventListener('mousemove', pick);
cv.addEventListener('click', e => {
  if (dragged) return; pick(e);
  if (want !== null) { if (hov) { pf = pf === hov ? null : hov; render(); } }
  else if (eS < .5) { if (hov) pf = pf === hov ? null : hov; else pf = null; }
  else if (hs !== null) { const h0 = hov; focus(hs); if (want !== null && h0 && h0.s === hs) { pf = h0; render(); } }
});
document.getElementById('down').onclick = () => { const vh = innerHeight; scrollTo({ top: eS < .5 ? vh : document.querySelector('.steps').getBoundingClientRect().top + scrollY - 70, behavior: RM ? 'auto' : 'smooth' }); };
panel.addEventListener('click', e => { const b = e.target.closest('.it'); if (b) { const f = F[+b.dataset.i]; pf = pf === f ? null : f; render(); } });
back.onclick = () => focus(null);
addEventListener('keydown', e => { if (e.key === 'Escape') focus(null); });
document.querySelectorAll('#ctl button').forEach(b => b.onclick = () => { flt = b.dataset.f; document.querySelectorAll('#ctl button').forEach(o => o.classList.toggle('on', o === b)); document.querySelector('#ctl .lbl').innerHTML = '<b>Hora del día</b> · ' + b.textContent; document.getElementById('ctl').classList.remove('open'); b.blur(); render(); });

window.MAREA = { pair: [0, 1], get want() { return want; }, get srcF() { return srcF; }, setSrc(c) { setSrc(c); }, focus(s) { focus(s); }, get flt() { return flt; }, setFlt(f) { if (flt === f) return; flt = f; const b = document.querySelector(`#ctl button[data-f="${f}"]`); document.querySelectorAll('#ctl button').forEach(o => o.classList.toggle('on', o === b)); if (b) document.querySelector('#ctl .lbl').innerHTML = '<b>Hora del día</b> · ' + b.textContent; render(); } }; // la comparativa avanza la franja horaria con el scroll
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
  document.querySelector('#cts .lbl').innerHTML = '<b>Fuente</b> · ' + (srcF ? SH[srcF] : 'Todas'); document.getElementById('cts').classList.remove('open'); render();
}
document.querySelector('#leg .lgb').addEventListener('click', e => { const li = e.target.closest('li[data-c]'); if (li) setSrc(srcF === li.dataset.c ? null : li.dataset.c); });
document.querySelectorAll('#cts button[data-c]').forEach(b => { b.insertAdjacentHTML('afterbegin', `<i style="background:${COL[b.dataset.c]}"></i>`); });
document.querySelectorAll('#cts button').forEach(b => b.onclick = () => { setSrc(b.dataset.c); b.blur(); });
document.querySelector('#leg .lgb').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.target.click(); } });
const leg = document.getElementById('leg'), lgin = leg.querySelector('.lgin'), lgt = document.getElementById('lgbtn');
function legMeasure() {
  const oh = Math.min(lgin.offsetHeight, innerHeight - 150);
  leg.style.setProperty('--oh', oh + 'px'); document.documentElement.style.setProperty('--lb', (72 + Math.min(lgin.offsetHeight, 260) + 14) + 'px');
}
let legMode = innerWidth >= 1100; leg.classList.toggle('open', false); lgt.setAttribute('aria-expanded', false);
const legSet = v => { legMeasure(); leg.classList.toggle('open', v); lgt.setAttribute('aria-expanded', v); };
lgt.onclick = () => legSet(!leg.classList.contains('open'));
cv.addEventListener('click', () => { if (innerWidth < 1100) legSet(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && innerWidth < 1100) legSet(false); });
addEventListener('resize', () => { legMeasure(); const m = innerWidth >= 1100; if (m !== legMode) { legMode = m; legSet(m); } });
legMeasure(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { legMeasure(); size(); });
cv.tabIndex = 0; cv.setAttribute('aria-label', 'Modelo visual de seis sectores. Teclas 1 a 6: expandir un sector. Escape: volver.');
addEventListener('keydown', e => { if (/^[1-9]$/.test(e.key) && +e.key <= NS && !document.body.classList.contains('heroing')) focus(+e.key - 1); });
addEventListener('resize', size); size(); render(); requestAnimationFrame(frame);
