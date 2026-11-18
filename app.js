/* Variación sonora · Barrio Puerto — arte de datos generativo (Canvas 2D)
   Codificación:
   · nodo = sector · rayo = ficha de terreno (ángulo = hora del día, largo = dB mín→máx, punto = dB prom)
   · partículas por rayo: oscilan entre dB mín y máx; velocidad ∝ dB prom; dispersión ∝ flujo vehicular;
     cantidad ∝ flujo peatonal · color = tipo de fuente (V/H/M/N)
   · metabola (silueta líquida) = perfil de dB promedio según la hora
   · halo = agrado percibido en encuestas (coral → ámbar → turquesa) */

const COL = { V: '#ff6b5e', H: '#f4c25b', C: '#e86bd0', M: '#8f9bff', N: '#4fd1c5' };
const CAT = { V: 'Vehicular', H: 'Humana (voces, música)', C: 'Comercial (locales, captadores)', M: 'Mecánica / portuaria', N: 'Natural' };
const rgbOf = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const SH = { V: 'Vehicular', H: 'Humana', C: 'Comercial', M: 'Portuaria', N: 'Natural' };
const F = FICHAS.map((r, i) => ({ id: 'BP-' + String(i + 1).padStart(2, '0'), t: r[0], m: +r[0].slice(0, 2) * 60 + +r[0].slice(3), s: r[1],
  mn: r[2], pr: r[3], mx: r[4], fp: r[5], fv: r[6], c: r[7], src: r[8], ph: r[9] }));
const DOM = [0, 1, 2, 3].map(s => { const n = {}; F.filter(f => f.s === s).forEach(f => n[f.c] = (n[f.c] || 0) + 1); let b = 'M', v = 0; ['M', 'V', 'C', 'H', 'N'].forEach(c => { if ((n[c] || 0) > v) { v = n[c]; b = c; } }); return b; });
const E = ENCUESTAS;

let CX0 = 0, CY0 = 0, S0 = 100, eS = 0, amb = 0, ee = 0, Aglob = 1; // centro y escala de la marea total; progreso de escena
const FILTERS = { all: [0, 1e4], am: [0, 756], pm: [757, 1049], pk: [1050, 1e4] };
let flt = 'all', want = null, foc = null, k = 0, pf = null, hov = null, hs = null, W, H, dpr, T = 0, Rb, Rf, FX, FY, ctr = [], G = [], pkey = '';
const cv = document.getElementById('c'), x = cv.getContext('2d'), tip = document.getElementById('tip'), panel = document.getElementById('panel'), back = document.getElementById('back');
const lerp = (a, b, t) => a + (b - a) * t, cl = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const agr = a => { const t = cl((a + 1) / 3, 0, 1); return t < .5 ? mix([255, 107, 94], [244, 194, 91], t * 2) : mix([244, 194, 91], [79, 209, 197], (t - .5) * 2); };
const hex = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };
const mean = (a, f) => a.length ? a.reduce((s, v) => s + f(v), 0) / a.length : 0;
const agrSec = s => mean(E.filter(e => e[0] === s), e => e[1]);
let srcF = null; // filtro por fuente (se activa tocando un color de la leyenda)
const on = f => f.m >= FILTERS[flt][0] && f.m <= FILTERS[flt][1] && (!srcF || f.c === srcF);
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; // movimiento reducido
// una misma medición puede tener varias fuentes (BP-17 a 19): sus dB y flujos se cuentan una sola vez
const uniq = fs => { const seen = new Set(); return fs.filter(f => { const k = [f.s, f.t, f.mn, f.pr, f.mx].join('|'); if (seen.has(k)) return false; seen.add(k); return true; }); };
const dbAvg = s => mean(uniq(F.filter(f => f.s === s)), f => f.pr);
const angM = m => -Math.PI / 2 + cl((m - 580) / 570, 0, 1) * Math.PI * 1.9;
const rad = (d, R) => R * (.2 + .8 * (cl(d, 20, 95) - 20) / 75);
const wid = f => .13 + .04 * f.fv;

// flujos: personas = puntos lentos · vehículos = estelas rápidas (cantidad y velocidad ∝ nivel de flujo)
const FL = [0, 1, 2, 3].map(() => ({ p: Array.from({ length: 130 }, () => ({ a: 0, u: Math.random(), fr: Math.random(), sg: Math.random() < .5 ? 1 : -1, ph: Math.random() * 6.28, sm: .3 + Math.random() * 1.5, t: Math.random() * 3, pause: 0, tu: Math.random(), sz: 2.2 + Math.random() * 2.6 })), v: Array.from({ length: 30 }, (_, i) => ({ a: 0, u: Math.random(), fr: Math.random(), sg: i % 2 ? 1 : -1, ph: Math.random() * 6.28, sm: .5 + Math.random() * 1.1, t: Math.random() * 3, tf: Math.random() })) }));
const DIR = [.35, -.5, 0, 1.2], LV = ['', 'Bajo', 'Medio', 'Alto'];
const lvl = s => { const fs = uniq(F.filter(f => f.s === s && on(f))); return pf && pf.s === s ? [pf.fp, pf.fv] : [mean(fs, f => f.fp) || 1, mean(fs, f => f.fv) || 1]; };
const lvn = v => LV[cl(Math.round(v), 1, 3)];
const cen = (g, f) => { const a = angM(f.m); return [g.cx + Math.cos(a) * g.R * .45, g.cy + Math.sin(a) * g.R * .45, g.R * (.16 + .34 * cl((f.pr - 50) / 30, 0, 1))]; };
const bar = (lab, v, hi, lo = 45, hi2 = 90) => `<div${hi ? ' class="hi"' : ''}>${lab}<span class="tr"><i style="width:${v == null ? 0 : cl((v - lo) / (hi2 - lo), 0, 1) * 100}%"></i></span><b>${v == null ? '–' : v.toFixed(0)}</b></div>`;
function perfilHtml(s) { // patrón horario del sector y comparación entre sectores (dB promedio, mediciones únicas)
  const mine = uniq(F.filter(f => f.s === s)), fr = [['Mañana', 'am'], ['Tarde', 'pm'], ['Hora punta', 'pk']].map(([n, k]) => { const q = mine.filter(f => f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1]); return bar(n, q.length ? mean(q, f => f.pr) : null, false); }).join('');
  return `<div class="pf"><h5>dB promedio por franja</h5>${fr}<h5>Comparación entre sectores</h5>${SECT.map((n, i) => bar(n, dbAvg(i), i === s)).join('')}</div>`;
}
function flowHtml(s) { const [p, v] = lvl(s); return `<div class="fl"><div>Personas<span class="tr"><i style="width:${p / 3 * 100}%"></i></span><b>${lvn(p)}</b></div><div class="v">Vehículos<span class="tr"><i style="width:${v / 3 * 100}%"></i></span><b>${lvn(v)}</b></div></div>`; }

function size() {
  W = innerWidth; H = innerHeight; const mob = W < 760;
  dpr = Math.min(devicePixelRatio || 1, mob ? 1.5 : 2);
  cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  layout();
}
function layout() { // las figuras se reacomodan en sincronía con el pill/leyenda «Cómo leer»
  const mob = W < 760;
  const top0 = W < 1100 ? 64 : 72 + leg.offsetHeight + 14, LB = mob ? 98 : 90, gh = H - (mob ? 124 : 100) - top0, gw = W - (mob ? 28 : 44), x0 = mob ? 14 : 22;
  const rA = Math.min(gw / 4 / 2.05, (gh - LB) / 2.2), rB = Math.min(gw / 2 / 2.05, (gh / 2 - LB) / 2.2), row = rA >= rB;
  Rb = Math.max(rA, rB); const bh = 2.2 * Rb + LB, off = row ? (gh - bh) / 2 : (gh / 2 - bh) / 2;
  ctr = [0, 1, 2, 3].map(i => row ? [x0 + gw * (i + .5) / 4, top0 + off + 8 + Rb * 1.08] : [x0 + gw * (i % 2 + .5) / 2, top0 + (gh / 2) * Math.floor(i / 2) + off + 8 + Rb * 1.08]);
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

function geoms() {
  G = [0, 1, 2, 3].map(s => {
    const kk = foc === s ? k : 0;
    return { cx: lerp(ctr[s][0], FX, kk), cy: lerp(ctr[s][1], FY, kk), R: lerp(Rb, Rf, kk), al: foc === null || foc === s ? 1 : 1 - k, kk };
  });
}

// ===== Marea de resonancias: malla orgánica (tubo deformado por ruido Perlin) =====
// Malla: largo = hora (09:40 → 18:50) · alrededor = fuente de sonido · relieve = dB · color = lugar · puntos = fichas
const TAU = Math.PI * 2, NZ = 30, NA = 28, NV = (NZ + 1) * (NA + 1), LZ = 3.2, FP = 1000;
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
  f.fg = (f.s + f.fl) / 4;                                    // idem en la marea total (cada lugar ocupa un cuarto)
  f.sg = .035 + .075 * cl((f.mx - f.mn) / 60, 0, 1);          // ancho de la zona iluminada = rango dB
  f.amp = Math.max(-.08, (f.pr - 48) / 35 * .55);             // relieve = dB promedio
  f.hf = ((i * 53) % 17) / 17;
});
const dfr = (a, b) => { const d = Math.abs(a - b) % 1; return d > .5 ? 1 - d : d; };
const gws = (f, fr, u, g, sg) => { const a = dfr(fr, g), b = u - f.u; return Math.exp(-(a * a / (2 * sg * sg) + b * b / (2 * .04 * .04))); };
const MS = [0, 1, 2, 3].map(s => {
  const m = { SX: new Float32Array(NV), SY: new Float32Array(NV), LW: new Float32Array(NV), LC: new Uint8Array(NV), hv: new Float32Array(NV), EV: new Float32Array(NV), bB: new Float32Array(NV), bS: new Float32Array(NV), ttS: 0 };
  const own = F.filter(f => f.s === s);
  own.forEach(f => { f.litB = []; f.litS = []; });
  for (let i = 0; i <= NZ; i++) for (let j = 0; j <= NA; j++) {
    const id = i * (NA + 1) + j, u = i / NZ, frB = (s + j / NA) / 4, frS = j / NA;
    m.hv[id] = pn(i * .21 + s * 5, j * .21, 3.3);
    F.forEach(f => { m.bB[id] += f.amp * gws(f, frB, u, f.fg, f.sg / 4); });
    own.forEach(f => { m.bS[id] += f.amp * gws(f, frS, u, f.fl, f.sg); const wb = gws(f, frB, u, f.fg, f.sg / 4), ws = gws(f, frS, u, f.fl, f.sg); if (wb > .07) f.litB.push(id, wb); if (ws > .07) f.litS.push(id, ws); });
  }
  return m;
});
F.forEach(f => { f.bAB = 0; f.bAS = 0; F.forEach(g => { f.bAB += g.amp * gws(g, f.fg, f.u, g.fg, g.sg / 4); if (g.s === f.s) f.bAS += g.amp * gws(g, f.fl, f.u, g.fl, g.sg); }); });

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
      if (ev < 1) { const th = (s + j / NA) / 4 * TAU, r = Math.max(.16, rad0(th, u, ttB, 11.3) + m.bB[id]); rot(r * Math.cos(th), r * Math.sin(th), zz, S0); bx = RX_; by = RY_; bz = RZ_; }
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
  x.globalCompositeOperation = 'lighter'; x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 1;
  x.strokeStyle = `rgba(${c},${.34 * al})`; x.beginPath();
  for (let i = 0; i <= NZ; i++) { const o = i * n1; x.moveTo(m.SX[o], m.SY[o]); for (let j = 1; j <= NA; j++) x.lineTo(m.SX[o + j], m.SY[o + j]); }
  x.stroke();
  if (e1 > .5) { x.strokeStyle = `rgba(${c},${.34 * al * cl((e1 - .5) / .4, 0, 1)})`; x.beginPath(); for (let i = 0; i <= NZ; i++) { const o = i * n1; x.moveTo(m.SX[o + NA], m.SY[o + NA]); x.lineTo(m.SX[o], m.SY[o]); } x.stroke(); }
  x.strokeStyle = `rgba(${c},${.19 * al})`; x.beginPath();
  for (let j = 0; j < NA; j++) { x.moveTo(m.SX[j], m.SY[j]); for (let i = 1; i <= NZ; i++) x.lineTo(m.SX[i * n1 + j], m.SY[i * n1 + j]); }
  x.stroke();
  for (let i = 0; i <= NZ; i++) for (let j = 0; j <= NA; j++) { // tramos iluminados
    const id = i * n1 + j, w = m.LW[id]; if (w < .1) continue;
    x.strokeStyle = `rgba(${CRGB[m.LC[id]]},${Math.min(1, w) * al})`; x.lineWidth = w > 1.05 ? 3 : 1.8; x.beginPath();
    if (j < NA) { x.moveTo(m.SX[id], m.SY[id]); x.lineTo(m.SX[id + 1], m.SY[id + 1]); }
    if (i < NZ) { x.moveTo(m.SX[id], m.SY[id]); x.lineTo(m.SX[id + n1], m.SY[id + n1]); }
    x.stroke();
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
function drawDots() {
  const mob = W < 760;
  x.globalCompositeOperation = 'lighter';
  DOTS.forEach(d => { const f = d.f, h = hov === f || pf === f, r = (mob ? 6.5 : 5.5) * (h ? 1.8 : 1), a = d.al * (pf && pf !== f ? .25 : 1);
    x.fillStyle = hex(COL[f.c], .13 * a); x.beginPath(); x.arc(d.x, d.y, r * 3.4, 0, TAU); x.fill(); x.fillStyle = hex(COL[f.c], .22 * a); x.beginPath(); x.arc(d.x, d.y, r * 1.9, 0, TAU); x.fill(); });
  x.globalCompositeOperation = 'source-over';
  DOTS.forEach(d => { const f = d.f, h = hov === f || pf === f, r = (mob ? 6.5 : 5.5) * (h ? 1.8 : 1), a = d.al * (pf && pf !== f ? .25 : 1);
    x.fillStyle = hex(COL[f.c], a); x.strokeStyle = `rgba(255,255,255,${a})`; x.lineWidth = h ? 2 : 1.4; x.beginPath(); x.arc(d.x, d.y, r, 0, TAU); x.fill(); x.stroke(); });
}
const ptOn = (s, u, fr) => { // punto de la malla (u: largo, fr: vuelta 0-1) por interpolación bilineal de los vértices proyectados
  const m = MS[s], fi = cl(u, 0, 1) * NZ, fj = (((fr % 1) + 1) % 1) * NA, i = Math.min(NZ - 1, Math.floor(fi)), j = Math.min(NA - 1, Math.floor(fj)), a = fi - i, b = fj - j, o = i * (NA + 1) + j, o2 = o + NA + 1;
  return [lerp(lerp(m.SX[o], m.SX[o + 1], b), lerp(m.SX[o2], m.SX[o2 + 1], b), a), lerp(lerp(m.SY[o], m.SY[o + 1], b), lerp(m.SY[o2], m.SY[o2 + 1], b), a)];
};
function flows(s, dt, al) {
  const [lp, lv] = lvl(s), tp = (lp - 1) / 2, tv = (lv - 1) / 2, nP = Math.round(lerp(10, 130, tp)), nV = Math.round(lerp(2, 30, tv)), ag = cl(1 - (agrSec(s) + 1) / 3, 0, 1);
  x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
  FL[s].p.forEach((q, i) => {
    q.a += ((i < nP ? 1 : 0) - q.a) * .08; if (q.a < .03) { q.u = Math.random(); q.fr = Math.random(); return; }
    q.t -= dt; if (q.t <= 0) { q.t = .8 + Math.random() * (4 - 2.5 * ag); if (Math.random() < .35) q.sg = -q.sg; q.pause = Math.random() < .3 * (1 - ag * .5) ? 1 + Math.random() * 2.5 : 0; q.tu = Math.random(); }
    q.pause = Math.max(0, q.pause - dt);
    const spd = q.pause > 0 ? .01 : lerp(.02, .1, tp) * q.sm * (1 + ag * .9 * Math.sin(T * 2.7 + q.ph));
    q.fr = (q.fr + spd * dt * q.sg + 1) % 1; q.u = cl(q.u + (q.tu - q.u) * dt * (.15 + ag * .6) + Math.sin(T * 1.3 + q.ph) * dt * ag * .08, .01, .99);
    const p = ptOn(s, q.u, q.fr), j = ag * 6;
    x.fillStyle = `rgba(255,244,214,${(.55 + .4 * Math.sin(T * 2 + q.ph)) * q.a * al})`; x.beginPath(); x.arc(p[0] + Math.cos(T * 2.1 + q.ph) * j, p[1] + Math.sin(T * 1.7 + q.ph * 2) * j, q.sz, 0, TAU); x.fill();
  });
  x.lineWidth = 3;
  FL[s].v.forEach((q, i) => {
    q.a += ((i < nV ? 1 : 0) - q.a) * .08; if (q.a < .03) return;
    q.t -= dt; if (q.t <= 0) { q.t = 1 + Math.random() * 3; q.tf = Math.random(); if (Math.random() < .25) q.sg = -q.sg; }
    const brake = .35 + .65 * Math.abs(Math.sin(T * (.5 + q.sm * .5) + q.ph)), spd = lerp(.07, .35, tv) * q.sm * brake * (1 + ag * .6 * Math.sin(T * 4 + q.ph)), Lu = Math.min(.3, spd * .3 + .04);
    q.u += spd * dt * q.sg; if (q.u > 1) q.u -= 1; if (q.u < 0) q.u += 1; q.fr += (q.tf - q.fr) * dt * .4;
    x.strokeStyle = `rgba(255,255,255,${.9 * q.a * al})`; x.beginPath();
    for (let j = 0; j <= 4; j++) { const p = ptOn(s, cl(q.u - q.sg * Lu * j / 4, 0, 1), q.fr); j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }
    x.stroke();
  });
}

let lastT = 0, curDt = 0, lastLh = 0, lastHt = '', lastDeep = false, lastTide = true;
function frame(ms) {
  T = ms / 1000; const dt = Math.min(.05, T - lastT); lastT = T;
  const lh = leg.offsetHeight; if (W >= 1100 && Math.abs(lh - lastLh) > 1) { lastLh = lh; layout(); document.documentElement.style.setProperty('--lb', (72 + lh + 14) + 'px'); }
  k += ((want === null ? 0 : 1) - k) * .09;
  if (want === null && k < .003) { k = 0; foc = null; } else if (want !== null) foc = want;
  // scroll → marea total (arriba) → sectores → ambiente (contraste y estadísticas)
  const vh = innerHeight, sy0 = window.scrollY, hero = document.body.classList.contains('heroing');
  amb = hero || want !== null ? 0 : cl((sy0 - 1.0 * vh) / (.6 * vh), 0, 1);
  const tt0 = cl(sy0 / (.9 * vh), 0, 1), eT = want !== null ? 1 : hero ? 0 : tt0 * tt0 * (3 - 2 * tt0);
  eS += (eT - eS) * (1 - Math.exp(-dt * 5)); if (Math.abs(eT - eS) < .002) eS = eT;
  ee = eS * (1 - amb); Aglob = lerp(1, .14, amb);
  const deep = amb > .25, tide = eS < .5; if (deep !== lastDeep) { lastDeep = deep; document.body.classList.toggle('deep', deep); } if (tide !== lastTide) { lastTide = tide; document.body.classList.toggle('tide', tide); }
  const rm = RM ? .2 : 1, ry = T * rm * .12 + oy, rx = -.5 + ox; cY = Math.cos(ry); sY = Math.sin(ry); cX = Math.cos(rx); sX = Math.sin(rx);
  geoms(); x.globalCompositeOperation = 'source-over'; x.fillStyle = '#070a14'; x.fillRect(0, 0, W, H);
  curDt = dt * rm;
  for (let s = 0; s < 4; s++) { updMesh(s, ee); lightMesh(s); }
  for (let s = 0; s < 4; s++) { const al = G[s].al * Aglob; if (al > .01) { drawMesh(s, al, evOf(ee, .5)); flows(s, curDt, al); } }
  calcDots(ee); drawDots();
  x.globalCompositeOperation = 'source-over'; x.textAlign = 'center';
  const lab = cl((eS - .6) / .35, 0, 1) * (1 - amb);
  if (lab > .05) G.forEach((g, s) => {
    if (g.al < .05) return; const c = rgbOf(COL[DOM[s]]), big = g.kk > .5, mob = W < 760, [p, v] = lvl(s), y = g.cy + g.R * 1.12 + (big ? (mob ? 24 : 32) : (mob ? 18 : 22));
    x.globalAlpha = g.al * lab; x.fillStyle = '#fff'; x.font = `700 ${big ? (mob ? 20 : 28) : (mob ? 14 : 20)}px Helvetica,Arial`; x.fillText(SECT[s].toUpperCase(), g.cx, y);
    x.font = `${big ? (mob ? 13 : 16) : (mob ? 11 : 14)}px Helvetica,Arial`; x.fillStyle = `rgb(${c})`;
    const dbl = dbAvg(s).toFixed(1) + ' dB promedio';
    if (mob && !big) { x.fillText(SH[DOM[s]] + ' · agrado ' + agrSec(s).toFixed(2), g.cx, y + 15); x.fillStyle = '#cfd8ea'; x.fillText(dbl, g.cx, y + 29); x.fillStyle = '#fff'; x.fillText('Personas: ' + lvn(p), g.cx, y + 43); x.fillText('Vehículos: ' + lvn(v), g.cx, y + 57); }
    else if (!big) { x.fillText('Predomina: ' + SH[DOM[s]] + ' · agrado ' + agrSec(s).toFixed(2), g.cx, y + 21); x.fillStyle = '#cfd8ea'; x.fillText(dbl, g.cx, y + 40); x.fillStyle = '#fff'; x.fillText(`Personas: ${lvn(p)} · Vehículos: ${lvn(v)}`, g.cx, y + 59); }
    else { x.fillText('Predomina: ' + SH[DOM[s]] + ' · agrado ' + agrSec(s).toFixed(2), g.cx, y + (mob ? 18 : 24)); x.fillStyle = '#fff'; x.fillText(`Personas: ${lvn(p)} · Vehículos: ${lvn(v)}`, g.cx, y + (mob ? 35 : 46)); }
    x.globalAlpha = 1;
  });
  const ht = want !== null ? '' : (tide ? 'Marea total · toca una ficha' : 'Clic en un sector para expandirlo · teclas 1–4'); if (ht !== lastHt) { lastHt = ht; hint.textContent = ht; }
  const dw = document.getElementById('down'), dl = tide ? 'Desplegar sectores ↓' : 'Contraste y comparación ↓'; if (dw.textContent !== dl) dw.textContent = dl;
  requestAnimationFrame(frame);
}

const hint = document.getElementById('hint');
function render() {
  panel.style.display = want !== null ? 'block' : 'none'; hint.style.display = want !== null ? 'none' : 'block';
  const s = want !== null ? want : hs, key = [want, flt, srcF, pf && pf.id, s].join();
  if (key === pkey || want === null) return; pkey = key; const sc = panel.scrollTop;
  if (s === null) { panel.className = ''; panel.innerHTML = '<h2>Explora los cuatro sectores</h2><small>Pasa el cursor sobre un sector y haz clic para expandirlo y aislarlo; luego elige una ficha.</small>'; return; }
  const fs = uniq(F.filter(f => f.s === s && on(f))), es = E.filter(e => e[0] === s), a = agrSec(s), db = es.filter(e => e[2]), mood = a > .8 ? 'agrado' : a < 0 ? 'molestia' : 'neutral';
  let h = `<h2>${SECT[s]}</h2><small>${SUB[s]} · ${fs.length} fichas visibles</small><div class="g">
    <div>dB promedio<b>${mean(fs, f => f.pr).toFixed(1)}</b></div><div>dB máx. registrado<b>${fs.length ? Math.max(...fs.map(f => f.mx)) : '–'}</b></div>
    <div>Flujo peatonal / vehicular (1-3)<b>${mean(fs, f => f.fp).toFixed(1)} / ${mean(fs, f => f.fv).toFixed(1)}</b></div>
    <div>Agrado (−1…2) · n=${es.length}<b style="color:rgb(${agr(a)})">${a.toFixed(2)} · ${mood}</b></div></div>`;
  h += flowHtml(s) + perfilHtml(s);
  if (db.length) h += `<small>dB medidos en encuestas: ${mean(db, e => e[2]).toFixed(1)} (n=${db.length})</small>`;
  h += `<q>${QUOTE[s]}</q>`;
  if (want === null) h += '<small class="hint">Clic para expandir este sector</small>';
  else {
    if (pf) h += `<div class="det" style="border-color:${COL[pf.c]}"><b>${pf.id} · ${pf.t} h</b>${pf.src}<br>${pf.mn}–${pf.mx} dB · prom. ${pf.pr}<br>Flujo peatonal ${pf.fp}/3 · vehicular ${pf.fv}/3<br><span style="color:${COL[pf.c]}">${CAT[pf.c]}</span><br><i>${pf.ph}</i></div>`;
    h += '<div class="list">' + F.map((f, i) => f.s === s && on(f) ? `<button class="it${pf === f ? ' on' : ''}" data-i="${i}"><span style="background:${COL[f.c]}"></span>${f.id} · ${f.t}<em>${f.src}</em><b>${f.pr} dB</b></button>` : '').join('') + '</div>';
  }
  panel.className = want !== null ? 'big' : ''; panel.innerHTML = h; panel.scrollTop = sc;
}

let dragM = null, dragged = false;
cv.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) dragM = { x: e.clientX, y: e.clientY, mv: 0 }; });
addEventListener('pointermove', e => { if (!dragM) return; const dx = e.clientX - dragM.x, dy = e.clientY - dragM.y; dragM.mv += Math.abs(dx) + Math.abs(dy); dragM.x = e.clientX; dragM.y = e.clientY; if (dragM.mv > 6) { oy += dx * .006; ox = cl(ox + dy * .006, -1.1, 1.1); } });
addEventListener('pointerup', () => { if (dragM && dragM.mv > 6) { dragged = true; setTimeout(() => dragged = false, 60); } dragM = null; });
function pick(e) {
  const mx = e.clientX, my = e.clientY; hs = null; hov = null;
  if (amb < .2) {
    let best = Math.pow(W < 760 ? 24 : 17, 2);
    DOTS.forEach(d => { const q = (d.x - mx) * (d.x - mx) + (d.y - my) * (d.y - my); if (d.al > .3 && q < best) { best = q; hov = d.f; } });
    if (eS > .85) G.forEach((g, s) => { if (g.al < .5) return; const inFig = Math.hypot(mx - g.cx, my - g.cy) < g.R * 1.1, inLbl = want === null && Math.abs(mx - g.cx) < Math.max(g.R, W < 760 ? 70 : 110) && my > g.cy + g.R * .95 && my < g.cy + g.R * 1.12 + 92; if ((inFig && (foc === null || k > .5)) || inLbl) hs = s; });
  }
  if (hov) { tip.innerHTML = `<b>${hov.id} · ${hov.t} h</b>${hov.src}<br>${hov.mn}–${hov.mx} dB · prom ${hov.pr}<br><span style="color:${COL[hov.c]}">${CAT[hov.c]}</span><br><i>${hov.ph}</i>`; tip.style.display = 'block'; tip.style.left = Math.max(8, Math.min(mx + 16, W - 280)) + 'px'; tip.style.top = (W < 760 ? Math.max(60, my - 130) : my + 16) + 'px'; }
  else tip.style.display = 'none';
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
document.getElementById('down').onclick = () => { const vh = innerHeight; scrollTo({ top: eS < .5 ? vh : 2 * vh - 70, behavior: RM ? 'auto' : 'smooth' }); };
panel.addEventListener('click', e => { const b = e.target.closest('.it'); if (b) { const f = F[+b.dataset.i]; pf = pf === f ? null : f; render(); } });
back.onclick = () => focus(null);
addEventListener('keydown', e => { if (e.key === 'Escape') focus(null); });
document.querySelectorAll('#ctl button').forEach(b => b.onclick = () => { flt = b.dataset.f; document.querySelectorAll('#ctl button').forEach(o => o.classList.toggle('on', o === b)); document.querySelector('#ctl .lbl').textContent = 'Franja · ' + b.textContent; document.getElementById('ctl').classList.remove('open'); b.blur(); render(); });
document.getElementById('next').onclick = () => document.getElementById('hero').classList.add('s2');
document.getElementById('prev').onclick = () => document.getElementById('hero').classList.remove('s2');
document.getElementById('go').onclick = () => { document.getElementById('hero').classList.add('off'); document.body.classList.remove('heroing'); };
document.querySelector('#leg .lgb').innerHTML = `<div class="lcols">
  <div class="lc"><h4>Color · fuente de sonido</h4><ul class="dots">${Object.keys(COL).map(k => `<li data-c="${k}" tabindex="0"><i style="background:${COL[k]}"></i>${CAT[k]}</li>`).join('')}</ul><p class="hn">Toca un color para filtrar</p></div>
  <div class="lc"><h4>Malla · un lugar</h4><ul><li><b>Color:</b> fuente que predomina</li><li><b>Largo:</b> hora, de 09:40 a 18:50</li><li><b>Relieve:</b> sube donde el sonido es más fuerte</li><li><b>Movimiento errático:</b> menor agrado</li></ul></div>
  <div class="lc"><h4>Ficha · una medición</h4><ul><li><b>Punto:</b> color de su fuente</li><li><b>Zona iluminada:</b> ancho = rango dB mín → máx</li><li><b>Relieve bajo el punto:</b> dB promedio</li></ul></div>
  <div class="lc"><h4>Flujos · recorren la malla</h4><ul><li><b>● Puntos lentos:</b> personas</li><li><b>━ Estelas rápidas:</b> vehículos</li><li><b>Más cantidad y velocidad:</b> más flujo</li></ul></div></div>`;
// «Cómo leer»: pill que se transforma en el contenedor de la leyenda (escritorio: abierta por defecto; móvil: cerrada)
document.querySelector('#leg .lgb').addEventListener('click', e => {
  const li = e.target.closest('li[data-c]'); if (!li) return; srcF = srcF === li.dataset.c ? null : li.dataset.c; pkey = '';
  document.querySelectorAll('#leg li[data-c]').forEach(o => { o.classList.toggle('act', o.dataset.c === srcF); o.classList.toggle('dim', !!srcF && o.dataset.c !== srcF); }); render();
});
document.querySelector('#leg .lgb').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.target.click(); } });
const leg = document.getElementById('leg'), lgin = leg.querySelector('.lgin'), lgt = document.getElementById('lgbtn');
function legMeasure() {
  const oh = Math.min(lgin.offsetHeight, innerHeight - 150);
  leg.style.setProperty('--oh', oh + 'px'); document.documentElement.style.setProperty('--lb', (72 + Math.min(lgin.offsetHeight, 260) + 14) + 'px');
}
let legMode = innerWidth >= 1100; leg.classList.toggle('open', legMode); lgt.setAttribute('aria-expanded', legMode);
const legSet = v => { legMeasure(); leg.classList.toggle('open', v); lgt.setAttribute('aria-expanded', v); };
lgt.onclick = () => legSet(!leg.classList.contains('open'));
cv.addEventListener('click', () => { if (innerWidth < 1100) legSet(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && innerWidth < 1100) legSet(false); });
addEventListener('resize', () => { legMeasure(); const m = innerWidth >= 1100; if (m !== legMode) { legMode = m; legSet(m); } });
legMeasure(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { legMeasure(); size(); });
cv.tabIndex = 0; cv.setAttribute('aria-label', 'Modelo visual de cuatro sectores. Teclas 1 a 4: expandir un sector. Escape: volver.');
addEventListener('keydown', e => { if (/^[1-4]$/.test(e.key) && !document.body.classList.contains('heroing')) focus(+e.key - 1); });
addEventListener('resize', size); size(); render(); requestAnimationFrame(frame);
