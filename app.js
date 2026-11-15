/* Variación sonora · Barrio Puerto — arte de datos generativo (Canvas 2D)
   Codificación:
   · nodo = sector · rayo = ficha de terreno (ángulo = hora del día, largo = dB mín→máx, punto = dB prom)
   · partículas por rayo: oscilan entre dB mín y máx; velocidad ∝ dB prom; dispersión ∝ flujo vehicular;
     cantidad ∝ flujo peatonal · color = tipo de fuente (V/H/M/N)
   · metabola (silueta líquida) = perfil de dB promedio según la hora
   · halo = agrado percibido en encuestas (coral → ámbar → turquesa) */

const SECT = ['Muelle Prat', 'Plaza Sotomayor', 'Calle Serrano', 'Plaza Echaurren'];
const SUB = ['borde abierto al mar', 'explanada de bordes duros', 'corredor encerrado', 'claro rodeado de muros'];
const COL = { V: '#ff6b5e', H: '#f4c25b', C: '#e86bd0', M: '#8f9bff', N: '#4fd1c5' };
const CAT = { V: 'Vehicular', H: 'Humana (voces, música)', C: 'Comercial (locales, captadores)', M: 'Mecánica / portuaria', N: 'Natural' };
const rgbOf = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const SH = { V: 'Vehicular', H: 'Humana', C: 'Comercial', M: 'Portuaria', N: 'Natural' };
const QUOTE = [
  'Aunque estén varias cosas pasando... resulta muy agradable estar aquí tranquilo y ver el mar.',
  'Son muchos sonidos pasando a la vez.',
  'En Serrano hay más tranquilidad comparado con el tránsito y bocinazos de Sotomayor.',
  'Bajó el sonido ambiental, más viento.'
];
// [hora, sector, dBmín, dBprom, dBmáx, flujo peatonal 1-3, flujo vehicular 1-3, tipo, fuente, fenómeno]
const F = [
  ['14:40', 0, 53, 64, 79, 2, 1, 'M', 'Ruido portuario / camiones', 'Competencia entre fondo difuso portuario y picos mecánicos'],
  ['10:08', 0, 50, 54, 70, 1, 2, 'M', 'Camiones portuarios', 'Ampliación sonora al salir de barreras TPV'],
  ['17:36', 0, 58, 67, 89, 3, 2, 'M', 'Motores de camión', 'Gran barco atracado genera sonidos inusuales de carga'],
  ['17:15', 0, 25, 65.4, 80.5, 3, 2, 'H', 'Lancheros gritando', 'Gritos de ofertas rompen el murmullo'],
  ['14:56', 1, 62, 72, 80, 3, 3, 'V', 'Tránsito / micros', 'El semáforo dirige el volumen de las conversaciones'],
  ['10:35', 1, 54, 55, 75, 2, 3, 'V', 'Vehículos', 'Pausas en rojo dejan oír pisadas y banda lejana'],
  ['17:34', 1, 25, 71.1, 84.5, 2, 3, 'V', 'Tránsito pesado / bocinazos', 'Caja de resonancia: fachadas continuas amplifican'],
  ['15:09', 2, 57, 62, 68, 1, 1, 'V', 'Rodaje de adoquín', 'Tubo sonoro íntimo; el adoquín frena al auto'],
  ['10:51', 2, 50, 55, 60, 2, 1, 'H', 'Música y conversaciones', 'Poco tránsito: se oyen carretilla y gaviotas'],
  ['15:17', 3, 66, 69, 72, 2, 1, 'H', 'Voces / canto', 'Pileta seca proyecta el canto en el anillo de bancas'],
  ['11:02', 3, 55, 62, 77, 2, 1, 'H', 'Música y conversaciones', 'Desplazarse al interior atenúa el ruido de esquinas'],
  ['15:40', 0, 59, 66, 81, 3, 1, 'H', 'Turistas / zumbido portuario', 'El pico cambia de origen mecánico a grupo humano'],
  ['11:30', 0, 56, 62, 78, 3, 1, 'H', 'Conversaciones de grupo', 'Más voces atenúan la atención a los camiones'],
  ['15:55', 1, 62, 73, 87, 3, 3, 'V', 'Micros / comercio', 'El comercio de esquina marca el pico'],
  ['16:06', 2, 65, 74, 86, 1, 3, 'V', 'Rodaje rápido sobre adoquín', 'Pasillo íntimo → corredor exprés'],
  ['16:16', 3, 65, 70, 79, 2, 1, 'H', 'Voces / camiones de esquina', 'La curva obliga paso lento; las voces sostienen el nivel'],
  ['15:30', 0, 10, 69.5, 121.4, 3, 2, 'H', 'Voces de lancheros', 'Ofertas de paseos dominan la explanada (142 peatones/10 min)'],
  ['15:30', 0, 10, 69.5, 121.4, 3, 2, 'V', 'Tránsito vehicular / camión', 'Eventos móviles de alta intensidad (26 vehículos/10 min)'],
  ['15:30', 0, 10, 69.5, 121.4, 3, 2, 'M', 'Grúas y maquinaria', 'Fondo mecánico continuo'],
  ['16:40', 2, 66, 76, 87, 2, 3, 'V', 'Traqueteo vehicular', 'Calzada estrechada obliga marcha rápida peatonal'],
  ['17:10', 0, 56, 69, 82, 3, 1, 'H', 'Captadores / motores náuticos', 'El altoparlante polariza al público hacia la baranda'],
  ['17:40', 1, 64, 75, 85, 3, 3, 'V', 'Tránsito pesado hora punta', 'Atochamiento genera eco envolvente'],
  ['18:05', 2, 61, 72, 81, 3, 3, 'H', 'Cierre de cortinas metálicas', 'Peak seco marca el apagado comercial'],
  ['18:30', 0, 58, 70, 83, 1, 3, 'M', 'Camiones / alarmas de retroceso', 'El muelle pasa de turístico a cierre industrial'],
  ['18:50', 1, 67, 78, 88, 3, 3, 'V', 'Congestión de buses', 'Colapso acústico en paraderos; se anula la condición cívica'],
  ['10:45', 2, 53, 59, 67, 2, 1, 'H', 'Intercambio vocal de locatarios', 'Abastecimiento matinal y desaceleración de furgón'],
  ['11:15', 0, 54, 63, 74, 2, 1, 'M', 'Actividad portuaria / camiones', 'Casco de barcos refleja el sonido hacia la explanada'],
  ['11:40', 1, 58, 71, 81, 3, 3, 'V', 'Micros en aceleración', 'Losas deterioradas amplifican de forma percusiva'],
  ['11:55', 2, 55, 62, 70, 3, 1, 'H', 'Murmullo de transeúntes', 'Zaguanes funcionan como cámaras de eco'],
  ['12:15', 0, 52, 60, 69, 2, 1, 'H', 'Guías con megáfono', 'La voz reorganiza espacialmente al grupo'],
  ['12:35', 1, 54, 64, 73, 2, 2, 'N', 'Fuente de agua / tránsito difuso', 'La fuente delimita un radio de enmascaramiento'],
  ['11:00', 0, 55, 75, 79, 1, 1, 'H', 'Canto / intervención musical', 'La música delimita el radio y atrae público'],
  ['11:20', 1, 59, 77, 81, 3, 3, 'V', 'Frenos de micros / sirena', 'Paso de ambulancia quiebra el fondo'],
  ['11:35', 2, 54, 66, 78, 1, 1, 'H', 'Música de locales', 'Superposición gradual entre fachadas continuas'],
  ['15:00', 0, 56, 65, 77, 1, 2, 'H', 'Títeres y música', 'Risas infantiles concentran la atención vecinal'],
  ['15:15', 1, 60, 75, 87, 3, 3, 'V', 'Bocinazos', 'Bocinazos simultáneos superponen el fondo'],
  ['13:50', 2, 54, 62, 70, 2, 1, 'H', 'Captadores de restaurantes', 'Captadores compiten entre sí ofreciendo menús'],
  ['09:40', 0, 54, 62, 70, 1, 1, 'M', 'Camiones y persona cantando', 'Alternan con la actividad de borde costero'],
  ['10:00', 1, 60, 69, 82, 1, 1, 'V', 'Frenos, micros y bocinazos', 'Dominan la esquina con Cochrane'],
  ['10:18', 2, 54, 62, 68, 1, 1, 'H', 'Música de locales', 'Música y paso peatonal a la altura de pasaje Goñi']
].map((r, i) => ({ id: 'BP-' + String(i + 1).padStart(2, '0'), t: r[0], m: +r[0].slice(0, 2) * 60 + +r[0].slice(3), s: r[1],
  mn: r[2], pr: r[3], mx: r[4], fp: r[5], fv: r[6], c: r[7], src: r[8], ph: r[9] }));
[8, 20, 22, 25, 28, 33, 36, 39].forEach(i => F[i].c = 'C');
const DOM = [0, 1, 2, 3].map(s => { const n = {}; F.filter(f => f.s === s).forEach(f => n[f.c] = (n[f.c] || 0) + 1); let b = 'M', v = 0; ['M', 'V', 'C', 'H', 'N'].forEach(c => { if ((n[c] || 0) > v) { v = n[c]; b = c; } }); return b; });
// encuestas [sector, agrado (2 me gusta · 1 un poco · 0 da igual · -1 incomoda), dB]
const E = [[0,1,71.4],[0,1,75],[3,1,54],[3,-1,75.4],[2,0,74.3],[0,1],[0,2],[0,1],[0,1],[1,-1],[1,-1],[1,0],[1,-1],[1,-1],[2,0],[2,2],[2,2],[2,2],[0,2],[1,2]];

const FILTERS = { all: [0, 1e4], am: [0, 756], pm: [757, 1049], pk: [1050, 1e4] };
let flt = 'all', want = null, foc = null, k = 0, pf = null, hov = null, hs = null, W, H, dpr, T = 0, Rb, Rf, FX, FY, ctr = [], G = [], pkey = '';
const cv = document.getElementById('c'), x = cv.getContext('2d'), tip = document.getElementById('tip'), panel = document.getElementById('panel'), back = document.getElementById('back');
const lerp = (a, b, t) => a + (b - a) * t, cl = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const agr = a => { const t = cl((a + 1) / 3, 0, 1); return t < .5 ? mix([255, 107, 94], [244, 194, 91], t * 2) : mix([244, 194, 91], [79, 209, 197], (t - .5) * 2); };
const hex = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };
const mean = (a, f) => a.length ? a.reduce((s, v) => s + f(v), 0) / a.length : 0;
const agrSec = s => mean(E.filter(e => e[0] === s), e => e[1]);
const on = f => f.m >= FILTERS[flt][0] && f.m <= FILTERS[flt][1];
const angM = m => -Math.PI / 2 + cl((m - 580) / 570, 0, 1) * Math.PI * 1.9;
const rad = (d, R) => R * (.2 + .8 * (cl(d, 20, 95) - 20) / 75);
const wid = f => .13 + .04 * f.fv;

// flujos: personas = puntos lentos · vehículos = estelas rápidas (cantidad y velocidad ∝ nivel de flujo)
const FL = [0, 1, 2, 3].map(() => ({ p: Array.from({ length: 130 }, () => ({ a: 0, li: 3, u: 0, sg: Math.random() < .5 ? 1 : -1, ph: Math.random() * 6.28, sm: .3 + Math.random() * 1.5, t: Math.random() * 3, pause: 0, tl: 3 + Math.random() * 20, sz: 2.2 + Math.random() * 2.6 })), v: Array.from({ length: 30 }, (_, i) => ({ a: 0, li: Math.random() * 26, u: Math.random() * 8, sg: i % 2 ? 1 : -1, ph: Math.random() * 6.28, sm: .5 + Math.random() * 1.1, t: Math.random() * 3, tl: Math.random() * 26 })) }));
const DIR = [.35, -.5, 0, 1.2], LV = ['', 'Bajo', 'Medio', 'Alto'];
const lvl = s => { const fs = F.filter(f => f.s === s && on(f)); return pf && pf.s === s ? [pf.fp, pf.fv] : [mean(fs, f => f.fp) || 1, mean(fs, f => f.fv) || 1]; };
const lvn = v => LV[cl(Math.round(v), 1, 3)];
const cen = (g, f) => { const a = angM(f.m); return [g.cx + Math.cos(a) * g.R * .45, g.cy + Math.sin(a) * g.R * .45, g.R * (.16 + .34 * cl((f.pr - 50) / 30, 0, 1))]; };
function flowHtml(s) { const [p, v] = lvl(s); return `<div class="fl"><div>Personas<span class="tr"><i style="width:${p / 3 * 100}%"></i></span><b>${lvn(p)}</b></div><div class="v">Vehículos<span class="tr"><i style="width:${v / 3 * 100}%"></i></span><b>${lvn(v)}</b></div></div>`; }

function size() {
  dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const top0 = W < 900 ? 64 : 178, gh = H - 72 - top0, gw = W - 44;
  const rA = Math.min(gw / 4 / 2.05, (gh - 74) / 2.2), rB = Math.min(gw / 2 / 2.05, (gh / 2 - 74) / 2.2), row = rA >= rB;
  Rb = Math.max(rA, rB); const bh = 2.2 * Rb + 74, off = row ? (gh - bh) / 2 : (gh / 2 - bh) / 2;
  ctr = [0, 1, 2, 3].map(i => row ? [22 + gw * (i + .5) / 4, top0 + off + 8 + Rb * 1.08] : [22 + gw * (i % 2 + .5) / 2, top0 + (gh / 2) * Math.floor(i / 2) + off + 8 + Rb * 1.08]);
  const fw = W < 900 ? W - 40 : W - 480; Rf = Math.max(80, Math.min((gh - 100) / 2.3, fw / 2.3));
  FX = W < 900 ? W / 2 : 22 + fw / 2; FY = top0 + 8 + Rf * 1.08 + (gh - 84 - 2.2 * Rf) / 2;
}

function geoms() {
  G = [0, 1, 2, 3].map(s => {
    const kk = foc === s ? k : 0;
    return { cx: lerp(ctr[s][0], FX, kk), cy: lerp(ctr[s][1], FY, kk), R: lerp(Rb, Rf, kk), al: foc === null || foc === s ? 1 : 1 - k, kk };
  });
}

// perfil de dB por hora: deforma la figura del lugar
function prof(s) {
  const fs = F.filter(f => f.s === s && on(f)), base = mean(F.filter(f => f.s === s), f => f.pr), N = 72, out = [];
  for (let i = 0; i < N; i++) { const a = -Math.PI / 2 + i / N * 6.2832; let w = 0, v = 0;
    fs.forEach(f => { const d = Math.atan2(Math.sin(a - angM(f.m)), Math.cos(a - angM(f.m))), q = Math.exp(-d * d / .25); w += q; v += q * f.pr; });
    out.push((v + base * .5) / (w + .5)); }
  return { out, base };
}

const rpoly = (A, r, rot, m) => { const p = 6.2832 / m, a = (((A - rot) % p) + p) % p; return r * Math.cos(Math.PI / m) / Math.cos(a - Math.PI / m); };
const pp = (g, li, u) => {
  const m = g.m, f = row => { const uu = ((u % m) + m) % m, k = Math.floor(uu), r = uu - k, a = row[k], b = row[(k + 1) % m]; return [lerp(a[0], b[0], r), lerp(a[1], b[1], r)]; };
  const i = Math.floor(li), t = li - i, A = f(g.pts[i]), B = f(g.pts[Math.min(i + 1, g.pts.length - 1)]); return [lerp(A[0], B[0], t), lerp(A[1], B[1], t)];
};

function rayHit(row, cx, cy, a) {
  const dx = Math.cos(a), dy = Math.sin(a), m = row.length;
  for (let q = 0; q < m; q++) {
    const p = row[q], r = row[(q + 1) % m], ex = r[0] - p[0], ey = r[1] - p[1], den = dx * ey - dy * ex; if (Math.abs(den) < 1e-6) continue;
    const t = ((p[0] - cx) * ey - (p[1] - cy) * ex) / den, u = ((p[0] - cx) * dy - (p[1] - cy) * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) return [cx + dx * t, cy + dy * t, t];
  }
  return null;
}

function drawSector(s) {
  const g = G[s], { cx, cy, R, al, kk } = g; if (al < .01) return;
  const c = rgbOf(COL[DOM[s]]), all = F.filter(f => f.s === s);
  const { out, base } = prof(s), m = cl(3 + Math.round(all.length / 3), 4, 9), Ro = R * (.86 + .14 * cl((base - 52) / 26, 0, 1)),
    dl = .045 + mean(all, f => f.mx - f.mn) / 420, NL = 26, sd = s % 2 ? 1 : -1, sa = pf ? .3 : 1, rot0 = T * .05 * sd;
  const pm = A => { const u = ((((A + Math.PI / 2) / 6.2832) % 1) + 1) % 1 * out.length, i = Math.floor(u), t = u - i; return 1 + (lerp(out[i % out.length], out[(i + 1) % out.length], t) - base) / 35; };
  const pts = [];
  for (let i = 0; i <= NL; i++) { const r = Ro * (1 - .88 * i / NL), rot = i * dl * sd + rot0, row = [];
    for (let q = 0; q < m; q++) { const A = rot + q * 6.2832 / m, rr = r * pm(A); row.push([cx + Math.cos(A) * rr, cy + Math.sin(A) * rr]); } pts.push(row); }
  g.pts = pts; g.m = m;
  const segs = [], sg = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2 - cx, my = (y1 + y2) / 2 - cy; segs.push([x1, y1, x2, y2, Math.atan2(my, mx), Math.hypot(mx, my)]); };
  x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
  for (let i = 0; i < NL; i++) {
    const t = i / NL, col = mix(c, [255, 255, 255], t * .5); x.strokeStyle = `rgba(${col},${(.07 + .12 * (1 - t)) * al * sa})`; x.lineWidth = 1; x.beginPath();
    for (let q = 0; q < m; q++) { const a = pts[i][q], b = pts[i][(q + 1) % m], n1 = pts[i + 1][q], n2 = pts[i + 1][(q + 1) % m];
      x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); sg(a[0], a[1], b[0], b[1]);
      for (let j = 0; j < 5; j++) { const u = j / 4, ex = lerp(n1[0], n2[0], u), ey = lerp(n1[1], n2[1], u); x.moveTo(a[0], a[1]); x.lineTo(ex, ey); sg(a[0], a[1], ex, ey); } }
    x.stroke();
  }
  flows(s, curDt); // los flujos quedan debajo de las fichas
  // cada hebra se asigna a la ficha angularmente más cercana: los colores no se apilan
  const fl = F.filter(f => f.s === s && on(f)), ow = new Map(fl.map(f => [f, []]));
  segs.forEach(q => {
    let best = null, bd = 1;
    fl.forEach(f => { if (q[5] < rad(f.mn, R) || q[5] > rad(f.mx, R)) return; const d = Math.abs(Math.atan2(Math.sin(q[4] - angM(f.m)), Math.cos(q[4] - angM(f.m)))) / (wid(f) * .575); if (d < bd) { bd = d; best = f; } });
    if (best) ow.get(best).push(q);
  });
  x.globalCompositeOperation = 'source-over';
  fl.forEach(f => {
    let o = 1; if (pf && pf !== f) o = .2;
    const h = hov === f || pf === f, a = angM(f.m), w = wid(f) * 1.15, rp = rad(f.pr, R), col = COL[f.c], ph = T * (1 + f.pr / 45);
    x.lineCap = 'round'; x.lineWidth = h ? 2.8 : 1.9;
    ow.get(f).forEach(q => {
      const pw = Math.pow(.5 + .5 * Math.sin(ph - q[5] / R * 9), 2.5); // pulso que viaja de dB mín a dB máx
      x.beginPath(); x.moveTo(q[0], q[1]); x.lineTo(q[2], q[3]); x.lineWidth = h ? 5.5 : 4.2; x.strokeStyle = `rgba(7,10,20,${.75 * o * al})`; x.stroke(); // contorno oscuro: separa la ficha de la figura
      x.lineWidth = h ? 2.8 : 1.9; x.strokeStyle = hex(col, (.35 + .65 * pw) * o * al); x.stroke();
    });
    let il = 0, bd = 1e9; for (let i = 0; i <= NL; i++) { const hit = rayHit(pts[i], cx, cy, a); if (hit && Math.abs(hit[2] - rp) < bd) { bd = Math.abs(hit[2] - rp); il = i; } }
    x.lineCap = 'butt'; x.lineJoin = 'miter'; x.lineWidth = (kk > .5 ? 6 : 4.5) * (h ? 1.5 : 1); x.strokeStyle = hex(col, o * al); x.beginPath(); let st = false;
    for (let j = 0; j <= 8; j++) { const hit = rayHit(pts[il], cx, cy, a - w / 2 + j * w / 8); if (!hit) continue; st ? x.lineTo(hit[0], hit[1]) : x.moveTo(hit[0], hit[1]); st = true; }
    x.stroke();
    const d = rayHit(pts[il], cx, cy, a);
    if (d) { const rot = il * dl * sd + rot0, mr = (kk > .5 ? 11 : 8) * (h ? 1.4 : 1); x.beginPath();
      for (let q = 0; q < m; q++) { const A = rot + q * 6.2832 / m; q ? x.lineTo(d[0] + Math.cos(A) * mr, d[1] + Math.sin(A) * mr) : x.moveTo(d[0] + Math.cos(A) * mr, d[1] + Math.sin(A) * mr); }
      x.closePath(); x.fillStyle = hex(col, o * al); x.fill(); x.strokeStyle = `rgba(255,255,255,${o * al})`; x.lineWidth = 1.6; x.stroke(); }
  });
}

function flows(s, dt) {
  const g = G[s]; if (g.al < .02 || !g.pts) return; const [lp, lv] = lvl(s), tp = (lp - 1) / 2, tv = (lv - 1) / 2, nP = Math.round(lerp(10, 130, tp)), nV = Math.round(lerp(2, 30, tv)),
    NL = g.pts.length - 1, ag = cl(1 - (agrSec(s) + 1) / 3, 0, 1); // agitación: menos agrado = movimiento más errático
  x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
  FL[s].p.forEach(q => {
    const i = FL[s].p.indexOf(q); q.a += ((i < nP ? 1 : 0) - q.a) * .08; if (q.a < .03) { q.li = 1 + Math.random() * (NL - 2); q.u = Math.random() * g.m; return; }
    q.t -= dt; if (q.t <= 0) { q.t = .8 + Math.random() * (4 - 2.5 * ag); if (Math.random() < .35) q.sg = -q.sg; q.pause = Math.random() < .3 * (1 - ag * .5) ? 1 + Math.random() * 2.5 : 0; q.tl = 1 + Math.random() * (NL - 2); }
    q.pause = Math.max(0, q.pause - dt);
    const spd = q.pause > 0 ? .02 : lerp(.1, .7, tp) * q.sm * (1 + ag * .9 * Math.sin(T * 2.7 + q.ph));
    q.u += spd * dt * q.sg; q.li = cl(q.li + (q.tl - q.li) * dt * (.2 + ag * .8) + Math.sin(T * 1.3 + q.ph) * dt * ag * 3, .3, NL - .3);
    const p = pp(g, q.li, q.u), j = ag * 7;
    x.fillStyle = `rgba(255,244,214,${(.35 + .3 * Math.sin(T * 2 + q.ph)) * q.a * g.al})`; x.beginPath();
    x.arc(p[0] + Math.cos(T * 2.1 + q.ph) * j, p[1] + Math.sin(T * 1.7 + q.ph * 2) * j, q.sz, 0, 6.283); x.fill();
  });
  x.lineWidth = 2.2;
  FL[s].v.forEach((q, i) => {
    q.a += ((i < nV ? 1 : 0) - q.a) * .08; if (q.a < .03) { q.li = Math.random() * NL; return; }
    q.t -= dt; if (q.t <= 0) { q.t = 1 + Math.random() * 3; q.tl = Math.random() * NL; if (Math.random() < .25) q.sg = -q.sg; }
    const brake = .35 + .65 * Math.abs(Math.sin(T * (.5 + q.sm * .5) + q.ph)), spd = lerp(.9, 3.2, tv) * q.sm * brake * (1 + ag * .6 * Math.sin(T * 4 + q.ph)), Lu = Math.min(.9, spd * .12 + .08);
    q.u += spd * dt * q.sg; q.li = cl(q.li + (q.tl - q.li) * dt * .5, 0, NL);
    x.strokeStyle = `rgba(255,255,255,${.6 * q.a * g.al})`; x.beginPath();
    for (let j = 0; j <= 4; j++) { const p = pp(g, q.li, q.u - q.sg * Lu * j / 4); j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }
    x.stroke();
  });
}

let lastT = 0, curDt = 0;
function frame(ms) {
  T = ms / 1000; const dt = Math.min(.05, T - lastT); lastT = T; k += ((want === null ? 0 : 1) - k) * .09;
  if (want === null && k < .003) { k = 0; foc = null; } else if (want !== null) foc = want;
  geoms(); x.globalCompositeOperation = 'source-over'; x.fillStyle = '#070a14'; x.fillRect(0, 0, W, H);
  curDt = dt; for (let s = 0; s < 4; s++) drawSector(s);
  x.globalCompositeOperation = 'source-over'; x.textAlign = 'center';
  G.forEach((g, s) => {
    if (g.al < .05) return; const c = rgbOf(COL[DOM[s]]), big = g.kk > .5, y = g.cy + g.R * 1.12 + (big ? 32 : 22), [p, v] = lvl(s);
    x.globalAlpha = g.al; x.fillStyle = '#fff'; x.font = `700 ${big ? 28 : 20}px Helvetica,Arial`; x.fillText(SECT[s].toUpperCase(), g.cx, y);
    x.font = `${big ? 16 : 14}px Helvetica,Arial`; x.fillStyle = `rgb(${c})`; x.fillText('Predomina: ' + SH[DOM[s]] + ' · agrado ' + agrSec(s).toFixed(2), g.cx, y + (big ? 24 : 21));
    x.fillStyle = '#fff'; x.fillText(`Personas: ${lvn(p)} · Vehículos: ${lvn(v)}`, g.cx, y + (big ? 46 : 41)); x.globalAlpha = 1;
  });
  requestAnimationFrame(frame);
}

const hint = document.getElementById('hint');
function render() {
  panel.style.display = want !== null ? 'block' : 'none'; hint.style.display = want !== null ? 'none' : 'block';
  const s = want !== null ? want : hs, key = [want, flt, pf && pf.id, s].join();
  if (key === pkey || want === null) return; pkey = key; const sc = panel.scrollTop;
  if (s === null) { panel.className = ''; panel.innerHTML = '<h2>Explora los cuatro sectores</h2><small>Pasa el cursor sobre un sector y haz clic para expandirlo y aislarlo; luego elige una ficha.</small>'; return; }
  const fs = F.filter(f => f.s === s && on(f)), es = E.filter(e => e[0] === s), a = agrSec(s), db = es.filter(e => e[2]), mood = a > .8 ? 'agrado' : a < 0 ? 'molestia' : 'neutral';
  let h = `<h2>${SECT[s]}</h2><small>${SUB[s]} · ${fs.length} fichas visibles</small><div class="g">
    <div>dB promedio<b>${mean(fs, f => f.pr).toFixed(1)}</b></div><div>dB máx. registrado<b>${fs.length ? Math.max(...fs.map(f => f.mx)) : '–'}</b></div>
    <div>Flujo peatonal / vehicular (1-3)<b>${mean(fs, f => f.fp).toFixed(1)} / ${mean(fs, f => f.fv).toFixed(1)}</b></div>
    <div>Agrado (−1…2) · n=${es.length}<b style="color:rgb(${agr(a)})">${a.toFixed(2)} · ${mood}</b></div></div>`;
  h += flowHtml(s);
  if (db.length) h += `<small>dB medidos en encuestas: ${mean(db, e => e[2]).toFixed(1)} (n=${db.length})</small>`;
  h += `<q>${QUOTE[s]}</q>`;
  if (want === null) h += '<small class="hint">Clic para expandir este sector</small>';
  else {
    if (pf) h += `<div class="det" style="border-color:${COL[pf.c]}"><b>${pf.id} · ${pf.t} h</b>${pf.src}<br>${pf.mn}–${pf.mx} dB · prom. ${pf.pr}<br>Flujo peatonal ${pf.fp}/3 · vehicular ${pf.fv}/3<br><span style="color:${COL[pf.c]}">${CAT[pf.c]}</span><br><i>${pf.ph}</i></div>`;
    h += '<div class="list">' + F.map((f, i) => f.s === s && on(f) ? `<button class="it${pf === f ? ' on' : ''}" data-i="${i}"><span style="background:${COL[f.c]}"></span>${f.id} · ${f.t}<em>${f.src}</em><b>${f.pr} dB</b></button>` : '').join('') + '</div>';
  }
  panel.className = want !== null ? 'big' : ''; panel.innerHTML = h; panel.scrollTop = sc;
}

function pick(e) {
  const mx = e.clientX, my = e.clientY; hs = null; hov = null;
  G.forEach((g, s) => { if (g.al > .5 && Math.hypot(mx - g.cx, my - g.cy) < g.R * 1.1 && (foc === null || k > .5)) hs = s; });
  if (hs !== null) {
    const g = G[hs], a = Math.atan2(my - g.cy, mx - g.cx); let best = 9;
    F.forEach(q => { if (q.s !== hs || !on(q)) return; const d = Math.abs(Math.atan2(Math.sin(a - angM(q.m)), Math.cos(a - angM(q.m)))); if (d < wid(q) / 2 + .03 && d < best && Math.hypot(mx - g.cx, my - g.cy) > g.R * .15) { best = d; hov = q; } });
  }
  if (hov) { tip.innerHTML = `<b>${hov.id} · ${hov.t} h</b>${hov.src}<br>${hov.mn}–${hov.mx} dB · prom ${hov.pr}<br><span style="color:${COL[hov.c]}">${CAT[hov.c]}</span><br><i>${hov.ph}</i>`; tip.style.display = 'block'; tip.style.left = Math.min(mx + 16, W - 320) + 'px'; tip.style.top = my + 16 + 'px'; }
  else tip.style.display = 'none';
  cv.style.cursor = hs !== null ? 'pointer' : 'default'; render();
}
function focus(s) { want = s; pf = null; back.style.display = s === null ? 'none' : 'block'; pkey = ''; render(); }

cv.addEventListener('mousemove', pick);
cv.addEventListener('click', e => { pick(e); if (want === null) { if (hs !== null) focus(hs); } else if (hov) { pf = pf === hov ? null : hov; render(); } });
panel.addEventListener('click', e => { const b = e.target.closest('.it'); if (b) { const f = F[+b.dataset.i]; pf = pf === f ? null : f; render(); } });
back.onclick = () => focus(null);
addEventListener('keydown', e => { if (e.key === 'Escape') focus(null); });
document.querySelectorAll('#ctl button').forEach(b => b.onclick = () => { flt = b.dataset.f; document.querySelectorAll('#ctl button').forEach(o => o.classList.toggle('on', o === b)); render(); });
document.getElementById('go').onclick = () => document.getElementById('hero').classList.add('off');
document.getElementById('leg').innerHTML =
  `<div class="lg"><b>Fuente de sonido</b><br>${Object.keys(COL).map(k => `<span><i style="background:${COL[k]}"></i>${CAT[k]}</span>`).join('')}</div>
  <div class="lg"><b>Figura</b> = el lugar: color = fuente predominante, lados = n.º de fichas, deformación = dB según la hora.<br><b>Ficha</b> = hebras de la figura que se iluminan y pulsan entre su dB mín y máx (hora en sentido horario desde arriba); trazo grueso y punto = dB promedio.</div>
  <div class="lg"><b>● puntos = personas · ━ estelas = vehículos.</b> Más cantidad y velocidad = más flujo. Recorren la geometría del lugar; cuanto menor el agrado, más errático el movimiento.</div>`;
addEventListener('resize', size); size(); render(); requestAnimationFrame(frame);
