/* Comparativa por sector (la malla se acompaña), gráficas que se transforman, estadísticas y explicación del código.
   Todo se calcula desde data.js (mediciones únicas: BP-17 a 19 cuentan una vez en dB y flujos). */
(function () {
  const S = NSX.map(s => {
    const all = FM.filter(f => f.s === s), q = uniq(all), qr = real(q), es = E.filter(e => e[0] === s), bk = k => { const r = real(q).filter(f => f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1]); return r.length ? mean(r, f => f.pr) : null; };
    return { s, ref: F.find(f => f.s === s && f.ap && !f.night) || null, refN: F.find(f => f.s === s && f.night) || null, n: q.length, nd: !qr.length, db: qr.length ? mean(qr, f => f.pr) : null, mx: qr.length ? Math.max(...qr.filter(f => f.mx < 100).map(f => f.mx)) : null, ag: es.length ? agrSec(s) : null, ne: es.length, fp: mean(q, f => f.fp), fv: mean(q, f => f.fv),
      fr: [bk('am'), bk('pm'), bk('pk')], hex: COL[DOM[s]], cats: CK.map(c => all.filter(f => f.c === c).length), ags: [-1, 0, 1, 2].map(v => es.filter(e => e[1] === v).length), inc: es.filter(e => e[1] < 0).length };
  });
  const FI = [
    [['Qué se oye', 'Mar, motores portuarios, voces y locales: el lugar con más variedad de sonidos.'], ['Cómo se vive', 'Tiene los picos más altos, pero las 7 personas encuestadas lo valoran bien: el mar y las voces pesan más que los decibeles.']],
    [['Qué se oye', 'Micros y bocinas: 10 de 11 mediciones son tráfico, y es donde más gente y vehículos circulan.'], ['Cómo se vive', '4 de 6 personas encuestadas lo sienten incómodo.']],
    [['Qué se oye', 'Captadores, música de locales y cortinas metálicas: un pasaje comercial.'], ['Cómo cambia', 'Tranquilo en la mañana; sube a 72 dB en la hora punta.']],
    [['Qué se oye', 'Voces y canto en torno a la pileta seca: el sonido más parejo del barrio.'], ['Ojo con el dato', 'Solo 3 mediciones y 2 encuestas: es una lectura preliminar.']],
    [['Qué se oye', 'Colectivos y autos, con mucha gente a pie: una plaza junto a una avenida.'], ['Cómo cambia', 'El promedio sube de 70 a 74 dB entre la mañana y la hora punta.'], ['Ojo con el dato', 'Tres mediciones propias con dB y ninguna encuesta de agrado.']],
    [['Qué se oye', 'El zumbido de la ciudad de fondo, turistas y terrazas, en el borde del río.'], ['Cómo cambia', 'De noche, la música de los bares lleva el máximo a 96 dB.'], ['Ojo con el dato', 'Cinco mediciones propias con dB y ninguna encuesta de agrado.']]];
  window.FIX = FI;
  const cl01 = v => Math.max(0, Math.min(1, v));
  const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const deLap = (ys, gap) => { const o = ys.map((y, i) => [y, i]).filter(a => a[0] != null).sort((a, b) => a[0] - b[0]), r = ys.slice(); for (let k = 1; k < o.length; k++) if (r[o[k][1]] - r[o[k - 1][1]] < gap) r[o[k][1]] = r[o[k - 1][1]] + gap; /* centra el bloque desplazado */ if (o.length) { const sh = (o.reduce((s, a) => s + r[a[1]] - a[0], 0)) / o.length; o.forEach(a => r[a[1]] -= sh); } return r; };
  const AGN = ['Incomoda', 'Da igual', 'Gusta un poco', 'Gusta'];
  const FN = [['Mañana', '09:40–12:36', 'am'], ['Tarde', '12:37–17:29', 'pm'], ['Hora punta', '17:30–18:50', 'pk']];
  S.forEach(d => { const q = uniq(F.filter(f => f.s === d.s)); d.fn = FN.map(([, , k]) => q.filter(f => !f.ap).filter(f => f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1]).length); });
  const card = d => `<section class="step" data-s="${d.s}"><div class="stk"><div class="blk"><div class="bh"><h3>${SECT[d.s]}</h3><div class="sub">${SUB[d.s]} · ${d.n} ${d.n === 1 ? "medición" : "mediciones"}</div></div><button class="cmin" type="button" aria-expanded="false">Ver detalle ▾</button><article class="card sc">
    <div class="big" style="color:${d.hex}">${d.db == null && d.ref ? `<span data-big data-n="${d.ref.pr.toFixed(1)}" data-dec="1">${d.ref.pr.toFixed(1)}</span>` : d.db == null ? '<span class="nd">sin dB</span>' : `<span data-big data-n="${d.db.toFixed(1)}" data-dec="1">${d.db.toFixed(1)}</span>`}<small>${d.db == null && d.ref ? 'dB · modelo APrA 2018, no medido en terreno' : d.db == null ? 'sin medir · relieve por intensidad percibida' : 'dB promedio'}</small></div>
    ${d.db == null && !d.ref ? '' : `<div class="dbs"><div class="dtr"><i data-w="${dbPos(d.db == null ? d.ref.pr : d.db).toFixed(1)}" style="background:${d.hex}"></i></div><small>≈ ${DBW(d.db == null ? d.ref.pr : d.db)}</small></div>`}
    <div class="chips"><span style="color:${d.hex}">● Predomina: ${SH[DOM[d.s]]}</span>${d.ag == null ? '<span>sin encuestas</span>' : `<span style="color:rgb(${agr(d.ag)})">Según ${nEnc(d.ne)}: ${AGX(d.ag)}</span>`}</div>
    <div class="fnow"><b class="fn"></b><span class="fh"></span><span class="fv"></span></div>
    <div class="ag${d.ne ? '' : ' na'}"><div class="agb" data-reveal>${d.ags.map((c, k) => c ? `<span style="flex:${c};background:${AGC[k]}" title="${AGN[k]}: ${c}">${c}</span>` : '').join('')}</div>${agCap(d.ags, d.ne)}<q style="color:${qCol(d.s)}">${QUOTE[d.s]}</q></div>
    <div class="fact">${d.mx == null && d.ref ? `<span class="bnd">Banda modelada de día ${d.ref.mn}–${d.ref.mx} dB</span>` : factLine(d.mx, d.fp, d.fv)}</div>${fiBlock(FI[d.s])}
    <div class="pf"><h5>Cuánto ruido hay según la hora del día (promedio, en dB)</h5>${['Mañana', 'Tarde', 'Hora punta'].map((n, i) => bar(n, d.fr[i], false)).join('')}</div></article></div></div></section>`;

  /* ---- motor de transformación: cada vista es un mapa id → forma; los ids compartidos se interpolan ---- */
  const INK = '#5E6655', MUT = '#8F9984', GR = '#C4C7B9';
  const hx = c => { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); };
  const mixc = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const V = () => { const m = {}; m.add = (id, t, a, o = {}) => { m[id] = Object.assign({ t, a }, o); return m; }; return m; };
  const rect = (v, id, x, y, w, h, f, o = 1, r = 4) => v.add(id, 'rect', { x, y, w, h, o, r }, { f });
  const circ = (v, id, x, y, r, f, o = 1) => v.add(id, 'circle', { x, y, r, o }, { f });
  const line = (v, id, x1, y1, x2, y2, s, o = 1, sw = 1) => v.add(id, 'line', { x1, y1, x2, y2, o, sw }, { f: s });
  const text = (v, id, x, y, s, k = 'm', an = 'start', o = 1) => v.add(id, 'text', { x, y, o }, { txt: String(s), k, an });
  const nm = i => SHORT[i];

  /* Grupo A · intensidad por lugar <-> evolución por franja */
  const A = {
    a: () => { const v = V(); [50, 60, 70, 80, 90].forEach(t => { const x = 150 + (t - 40) / 62 * 340; line(v, 'ag' + t, x, 12, x, 200, GR); text(v, 'at' + t, x, 226, t, 'm', 'middle'); });
      S.forEach((d, i) => { const y = 18 + i * 34, ap = d.db == null && d.ref, nd = d.db == null && !ap, pr = ap ? d.ref.pr : d.db, mxv = ap ? d.ref.mx : d.mx, w = nd ? 0 : (pr - 40) / 62 * 340, wm = nd ? 150 : 150 + (mxv - 40) / 62 * 340, st = ap ? '*' : '';
        text(v, 'n' + i, 0, y + 11, SECT[i] + st, 'b'); text(v, 's' + i, nd ? 156 : 150 + w + 9, y + 12, nd ? 'sin dB medido' : pr.toFixed(1) + st, nd ? 'm' : 'b', 'start'); text(v, 'mt' + i, ap ? 150 + w + 62 : wm + 8, y + 13, nd ? '' : ap ? `rango ${d.ref.mn}–${d.ref.mx}` : 'máx ' + mxv, 'm', 'start', nd ? 0 : 1);
        rect(v, 'b' + i, 150, y, w, 14, d.hex, nd ? 0 : ap ? .5 : .92, 7); line(v, 'mx' + i, wm, y - 4, wm, y + 18, INK, nd || ap ? 0 : 1, 2.5);
        for (let j = 0; j < 3; j++) circ(v, `p${i}${j}`, 150 + w, y + 7, 0, d.hex, 0);
        for (let j = 0; j < 2; j++) line(v, `q${i}${j}`, 150 + w, y + 7, 150 + w, y + 7, d.hex, 0, 3); }); text(v, 'fn', 0, 262, '', 'm', 'start'); return v; },
    b: () => { const v = V(), xs = [90, 250, 410], Y = x => 206 - (x - 55) / 25 * 190;
      [60, 70, 80].forEach(t => { line(v, 'ag' + (t - 10), 40, Y(t), 500, Y(t), GR); text(v, 'at' + (t - 10), 32, Y(t) + 4, t, 'm', 'end'); });
      ['Mañana', 'Tarde', 'Hora punta'].forEach((n, j) => text(v, 'x' + j, xs[j], 228, n, 'm', 'middle'));
      const LY = deLap(S.map(d => { const P = d.fr.map((q, j) => q == null ? null : [xs[j], Y(q)]), L = P[2] || P[1] || P[0]; return L ? L[1] + 4 : null; }), 16);
      S.forEach((d, i) => { const P = d.fr.map((q, j) => q == null ? null : [xs[j], Y(q)]), L = P[2] || P[1] || P[0];
        text(v, 'n' + i, L ? L[0] + 12 : 420, L ? LY[i] : 0, nm(i), 'b', 'start', L ? 1 : 0); text(v, 's' + i, 0, 0, '', 'm', 'start', 0); text(v, 'mt' + i, 0, 0, '', 'm', 'start', 0); if (!i) text(v, 'fn', 0, 262, '', 'm', 'start', 0);
        rect(v, 'b' + i, 150, 0, 0, 0, d.hex, 0, 7); line(v, 'mx' + i, 150, 0, 150, 0, INK, 0);
        P.forEach((p, j) => p && circ(v, `p${i}${j}`, p[0], p[1], 5.5, d.hex, 1));
        for (let j = 0; j < 2; j++) if (P[j] && P[j + 1]) line(v, `q${i}${j}`, P[j][0], P[j][1], P[j + 1][0], P[j + 1][1], d.hex, 1, 3); }); return v; },
    ta: ['Intensidad', 'dB promedio (barra) y máximo (marca oscura)'], tb: ['La hora punta es el techo', 'dB promedio según la hora del día: mañana, tarde, hora punta'], la: 'Por lugar', lb: 'Por hora', h: 270 };

  /* Grupo B · agrado frente a dB <-> respuestas de agrado */
  const B = {
    a: () => { const v = V(), X = q => 120 + (q - 60) / 14 * 380, Y = a => 206 - (a + 1) / 3 * 190, dy = [-18, 28, 28, -18, 28, -18];
      [60, 64, 68, 72].forEach(t => { line(v, 'gx' + t, X(t), 14, X(t), 206, GR); text(v, 'tx' + t, X(t), 236, t, 'm', 'middle'); });
      [-1, 0, 1, 2].forEach(t => { line(v, 'gy' + t, 120, Y(t), 500, Y(t), GR); text(v, 'ty' + t, 104, Y(t) + 4, ['incómoda', 'da igual', 'gusta un poco', 'gusta'][t + 1], 'm', 'end'); });
      text(v, 'ax', 500, 11, 'dB promedio →', 'm', 'end'); text(v, 'ay', 124, 11, 'agrado percibido ↑', 'm');
      S.forEach((d, i) => { const nn = d.db == null || d.ag == null, x = nn ? 520 : X(d.db), y = nn ? 120 : Y(d.ag); circ(v, 'c' + i, x, y, nn ? 0 : 10, d.hex, nn ? 0 : .92); text(v, 'n' + i, x, y + dy[i], nm(i), 'b', 'middle', nn ? 0 : 1);
        for (let k = 0; k < 4; k++) rect(v, `r${i}${k}`, x, y, 0, 0, '#D20A2E', 0); }); return v; },
    b: () => { const v = V(), col = ['#D20A2E', '#a39f8a', '#5E9C8F', '#00675B'], nmz = ['Incomoda', 'Da igual', 'Gusta un poco', 'Gusta'];
      S.forEach((d, i) => { const y = 8 + i * 31; text(v, 'n' + i, 0, y + 13, SECT[i], 'b'); let x = 162;
        d.ags.forEach((c, k) => { rect(v, `r${i}${k}`, x, y, Math.max(c * 44 - 2, 0), 20, col[k], c ? 1 : 0); if (c > 1) text(v, `k${i}${k}`, x + c * 22 - 1, y + 14, c, 'k', 'middle'); x += c * 44; });
        text(v, 'e' + i, x + 4, y + 14, d.ne ? `n=${d.ne}` : 'sin encuestas', 'm'); circ(v, 'c' + i, 162, y + 10, 0, d.hex, 0); });
      nmz.forEach((n, k) => { circ(v, 'lg' + k, 8 + k * 118, 214, 5, col[k]); text(v, 'lt' + k, 18 + k * 118, 218, n, 'm'); }); return v; },
    ta: ['El agrado no sigue a los decibeles', 'Promedio de lo que respondieron las personas encuestadas (de incómoda a gusta) frente al dB de cada lugar'], tb: ['¿Cómo se siente?', 'Respuestas de agrado de las encuestas por lugar'], la: 'Agrado vs dB', lb: 'Respuestas', h: 244 };

  /* Grupo C · qué suena <-> cuánta gente y tráfico */
  const C = {
    a: () => { const v = V(); S.forEach((d, i) => { const y = 12 + i * 45; text(v, 'n' + i, 0, y + 13, SECT[i], 'b'); let x = 162;
        d.cats.forEach((c, k) => { rect(v, `f${i}${k}`, x, y, Math.max(c * 20 - 2, 0), 20, COL[CK[k]], c ? .92 : 0); if (c > 1) text(v, `k${i}${k}`, x + c * 10 - 1, y + 14, c, 'k', 'middle'); x += c * 20; });
        text(v, 'e' + i, x + 4, y + 14, d.cats.reduce((a, b) => a + b, 0), 'm'); });
      CK.forEach((c, k) => { circ(v, 'lg' + k, 8 + k * 98, 280, 5, COL[c]); text(v, 'lt' + k, 18 + k * 98, 284, SH[c], 'm'); }); return v; },
    b: () => { const v = V(); S.forEach((d, i) => { const y = 10 + i * 45; text(v, 'n' + i, 0, y + 14, SECT[i], 'b');
        rect(v, `f${i}0`, 162, y, d.fp / 3 * 290, 10, '#7a8468', 1, 5); text(v, 'e' + i, 168 + d.fp / 3 * 290, y + 9, d.fp.toFixed(1), 'm');
        rect(v, `f${i}1`, 162, y + 15, d.fv / 3 * 290, 10, '#D20A2E', 1, 5); text(v, 'e' + i + 'b', 168 + d.fv / 3 * 290, y + 24, d.fv.toFixed(1), 'm');
        for (let k = 2; k < 5; k++) rect(v, `f${i}${k}`, 162, y + 20, 0, 0, COL[CK[k]], 0); });
      circ(v, 'lg0', 8, 280, 5, '#7a8468'); text(v, 'lt0', 18, 284, 'Personas (1 a 3)', 'm'); circ(v, 'lg1', 168, 280, 5, '#D20A2E'); text(v, 'lt1', 178, 284, 'Vehículos (1 a 3)', 'm'); return v; },
    ta: ['¿Qué suena?', 'Mediciones por fuente de sonido y lugar'], tb: ['¿Cuánta gente y tráfico?', 'Nivel de flujo medio de 1 (bajo) a 3 (alto)'], la: 'Fuentes', lb: 'Flujos', h: 304 };

  /* Grupo D · partitura: cada ficha es una nota (línea = fuente, posición = hora, tamaño = dB) */
  const D = (() => {
    const WD = innerWidth >= 900 ? 1040 : 520, X = m => 98 + (Math.min(m, 1140) - 580) / 570 * (WD - 118), rr = (f, k) => (3 + cl01((f.pr - 50) / 35) * 5.5) * k, TK = [[600, '10:00'], [720, '12:00'], [840, '14:00'], [960, '16:00'], [1080, '18:00']];
    const common = (v, y0, y1, ya, hh) => { [756.5, 1049.5].forEach((m, i) => line(v, 'fd' + i, X(m), y0, X(m), y1, GR, 1, 1)); [['Mañana', 668], ['Tarde', 902], ['Hora punta', 1100]].forEach(([n, m], i) => text(v, 'fl' + i, X(m), 14, n, 'm', 'middle'));
      TK.forEach(([m, t]) => text(v, 'tk' + m, X(m), ya, t, 'm', 'middle')); CK.forEach((c, k) => { circ(v, 'lg' + k, 8 + k * 98, hh - 12, 5, COL[c]); text(v, 'lt' + k, 18 + k * 98, hh - 8, SH[c], 'm'); }); };
    return { w: WD, h: 380, ha: 380, hb: 490, la: 'Todo el barrio', lb: 'Por lugar',
      ta: ['¿Qué suena y cuándo?', 'Línea = fuente · posición = hora · tamaño = dB'], tb: ['¿Qué suena y cuándo, por lugar?', 'Las mismas notas, ahora en el pentagrama de cada lugar'],
      a: () => { const v = V(), Y = k => 44 + k * 50; CK.forEach((c, k) => { line(v, 'La' + k, 98, Y(k), WD - 20, Y(k), GR, 1, 1); text(v, 'sl' + k, 90, Y(k) + 4, SH[c], 'm', 'end'); }); common(v, 26, 262, 282, 380);
        FM.forEach(f => circ(v, 'n' + f.id, X(f.m), Y(CK.indexOf(f.c)), rr(f, 1), COL[f.c], .88)); return v; },
      b: () => { const v = V(), T0 = s => 54 + s * 64; S.forEach((d, i) => { text(v, 'sn' + i, 98, T0(i) - 12, SECT[i], 'b'); for (let k = 0; k < 5; k++) line(v, `Lb${i}${k}`, 98, T0(i) + k * 9, WD - 20, T0(i) + k * 9, GR, 1, 1); });
        common(v, 28, 420, 440, 490); FM.forEach(f => circ(v, 'n' + f.id, X(f.m), T0(f.s) + CK.indexOf(f.c) * 9, rr(f, .55), COL[f.c], .9)); return v; } };
  })();
  const mk = (t, at) => { const e = document.createElementNS(SVGNS, t); for (const k in at) e.setAttribute(k, at[k]); return e; };
  function Morph(root, G) {
    root.innerHTML = `<div class="bh"><h3></h3><p class="cs"></p></div><div class="tg" role="group"><button data-v="a" class="on">${G.la}</button><button data-v="b">${G.lb}</button></div><div class="card cc"></div>`;
    const svg = mk('svg', { viewBox: `0 0 ${G.w || 520} ${G.ha || G.h}`, width: '100%', role: 'img' }); root.querySelector('.cc').appendChild(svg);
    const H3 = root.querySelector('h3'), CS = root.querySelector('.cs'), el = {}, cur = {}; let cv = 'a', raf = 0;
    const draw = (id, s) => { const e = el[id]; if (!e) return; const a = s.a;
      if (s.t === 'rect') { e.setAttribute('x', a.x); e.setAttribute('y', a.y); e.setAttribute('width', Math.max(a.w, 0)); e.setAttribute('height', Math.max(a.h, 0)); e.setAttribute('rx', Math.min(a.r, Math.max(a.h, 0) / 2)); e.setAttribute('fill', s.f); }
      else if (s.t === 'circle') { e.setAttribute('cx', a.x); e.setAttribute('cy', a.y); e.setAttribute('r', Math.max(a.r, 0)); e.setAttribute('fill', s.f); }
      else if (s.t === 'line') { e.setAttribute('x1', a.x1); e.setAttribute('y1', a.y1); e.setAttribute('x2', a.x2); e.setAttribute('y2', a.y2); e.setAttribute('stroke', s.f); e.setAttribute('stroke-width', a.sw); e.setAttribute('stroke-linecap', 'round'); }
      else { e.setAttribute('x', a.x); e.setAttribute('y', a.y); e.setAttribute('class', 't ' + s.k); e.setAttribute('text-anchor', s.an); if (e.textContent !== s.txt) e.textContent = s.txt; }
      e.setAttribute('opacity', Math.max(0, Math.min(1, a.o))); };
    const ensure = (id, s) => { if (!el[id]) { el[id] = mk(s.t === 'rect' ? 'rect' : s.t === 'circle' ? 'circle' : s.t === 'line' ? 'line' : 'text', {}); svg.appendChild(el[id]); } };
    const ghost = s => { const g = JSON.parse(JSON.stringify(s)); g.a.o = 0; return g; };
    function go(to, instant, stag) {
      const A_ = G[to](), from = {}; for (const id in cur) from[id] = cur[id];
      const ids = new Set([...Object.keys(from), ...Object.keys(A_)].filter(k => k !== 'add'));
      const S0 = {}, S1 = {}; ids.forEach(id => { S0[id] = from[id] || ghost(A_[id]); S1[id] = A_[id] || ghost(from[id]); if (!from[id]) S0[id].txt = S1[id].txt; if (!A_[id]) S1[id].txt = S0[id].txt; ensure(id, S1[id]); });
      { const rk = e => e.tagName === 'text' ? 2 : e.tagName === 'circle' ? 1 : 0; [...svg.children].map((e, i) => [rk(e), i, e]).sort((p, q) => p[0] - q[0] || p[1] - q[1]).forEach(p => svg.appendChild(p[2])); } /* capas: barras y líneas, luego puntos, luego textos (también tras cambiar de vista) */
      H3.textContent = G['t' + to][0]; CS.textContent = G['t' + to][1]; cv = to; cancelAnimationFrame(raf);
      const T0 = performance.now(), D = instant || RM ? 0 : stag ? 900 : 750, ez = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, DL = {}, WW = G.w || 520; let mxd = 0;
      if (stag) ids.forEach(id => { const b = S1[id], q = b.a; DL[id] = b.t === 'rect' ? q.y / G.h * 420 : b.t === 'text' ? 0 : ((q.x != null ? q.x : q.x1) / WW) * 680; mxd = Math.max(mxd, DL[id]); });
      const hA = parseFloat(svg.getAttribute('viewBox').split(' ')[3]), hB = G['h' + to] || G.h, WV = G.w || 520;
      const step = now => { const tt = D ? Math.min((now - T0) / (D + mxd), 1) : 1, t0 = D ? Math.min((now - T0) / (D + mxd), 1) : 1;
        svg.setAttribute('viewBox', `0 0 ${WV} ${hA + (hB - hA) * ez(tt)}`);
        ids.forEach(id => { const t = D ? Math.max(0, Math.min(1, (now - T0 - (DL[id] || 0)) / D)) : 1, k = ez(t), a = S0[id], b = S1[id], o = { t: b.t, a: {}, f: b.f, k: b.k, an: b.an, txt: t < .5 ? a.txt : b.txt };
          for (const q in b.a) o.a[q] = a.a[q] + (b.a[q] - a.a[q]) * k;
          if (a.f && b.f && b.t !== 'text') o.f = mixc(a.f, b.f, k); cur[id] = o; draw(id, o); });
        if (tt < 1) raf = requestAnimationFrame(step); else ids.forEach(id => { if (!A_[id]) { el[id].remove(); delete el[id]; delete cur[id]; } else cur[id] = A_[id]; }); };
      raf = requestAnimationFrame(step); }
    const tg = root.querySelector('.tg'), th = document.createElement('i'); th.className = 'th'; tg.prepend(th);
    const place = () => { const b = tg.querySelector('button.on'); th.style.left = b.offsetLeft + 'px'; th.style.width = b.offsetWidth + 'px'; }; place(); addEventListener('resize', place); addEventListener('load', place); if (document.fonts) document.fonts.ready.then(place);
    tg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { if (b.dataset.v === cv) return; tg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); place(); go(b.dataset.v); }));
    go('a', true);
    /* entrada: las marcas (barras, puntos, notas) crecen en cascada al entrar en pantalla y se reinician al salir */
    const zero = () => { Object.keys(el).forEach(id => { el[id].remove(); delete el[id]; delete cur[id]; }); const m = G[cv](); for (const id in m) { if (id === 'add') continue; const s = JSON.parse(JSON.stringify(m[id]));
        if (s.t === 'rect') s.a.w = 0; else if (s.t === 'circle') s.a.r = 0; else if (s.t === 'line' && s.f !== GR) s.a.o = 0; ensure(id, s); draw(id, s); cur[id] = s; } };
    if (!RM && 'IntersectionObserver' in window) { let on = false; zero(); new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= .3) { if (!on) { on = true; cancelAnimationFrame(raf); zero(); go(cv, false, true); } } else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf); zero(); } }), { threshold: [0, .3, .6] }).observe(root.querySelector('.cc')); } }

  const peaks = () => real(uniq(FB)).filter(f => f.mx < 100).sort((a, b) => b.mx - a.mx).slice(0, 6).map(f => `<li><b style="color:${COL[f.c]}"><span data-n="${f.mx}">${f.mx}</span><small> dB</small></b><span>${f.src}<em>${SECT[f.s]} · ${f.t} h</em><i class="pb"><u style="width:${cl01((f.mx - 60) / 35) * 100}%;background:${COL[f.c]}" data-w="${(cl01((f.mx - 60) / 35) * 100).toFixed(1)}"></u></i></span></li>`).join('');

  const hourChart = () => {
    const mob = innerWidth < 700, Wd = mob ? 360 : 940, Ht = mob ? 270 : 300, pl = mob ? 34 : 44, pr = mob ? 112 : 205, x0 = pl + 26, x1 = Wd - pr, xs = [0, 1, 2].map(j => x0 + (x1 - x0) * j / 2), Y = v => 24 + (81 - v) / 24 * (Ht - 80);
    const names = [['Mañana', '09:40–12:36'], ['Tarde', '12:37–17:29'], ['Hora punta', '17:30–18:50']];
    let g = [60, 70, 80].map(v => `<line x1="${pl}" x2="${Wd - 8}" y1="${Y(v)}" y2="${Y(v)}" stroke="#C4C7B9" stroke-dasharray="2 5"/><text x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="12" fill="#8F9984">${v}</text>`).join('');
    g += names.map((n, j) => `<text x="${xs[j]}" y="${Ht - 30}" text-anchor="middle" font-size="${mob ? 12 : 14}" font-weight="700" fill="#3b4234">${n[0]}</text>${mob ? '' : `<text x="${xs[j]}" y="${Ht - 12}" text-anchor="middle" font-size="12" fill="#8F9984">${n[1]}</text>`}`).join('');
    const lastP = d => { const pts = d.fr.map((q, j) => q == null ? null : [xs[j], Y(q)]).filter(Boolean); return pts.length ? pts[pts.length - 1] : null; };
    const LYS = new Array(S.length).fill(0); // etiquetas separadas por grupo: líneas que llegan a Hora punta / líneas que terminan antes
    [true, false].forEach(end => { const idx = S.map((d, i) => i).filter(i => { const L = lastP(S[i]); return L && (L[0] >= xs[2]) === end; }); const ys = deLap(idx.map(i => lastP(S[i])[1] + 4), mob ? 14 : 17); idx.forEach((i, k) => LYS[i] = ys[k]); });
    const ls = S.map((d, di) => { const P = d.fr.map((q, j) => q == null ? null : [xs[j], Y(q), q]); const pts = P.filter(Boolean); if (pts.length < 1) return '';
      const L = pts[pts.length - 1];
      return `<g><polyline fill="none" stroke="${d.hex}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}"/>${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="${d.hex}"/>`).join('')}<text x="${L[0] + 12}" y="${LYS[di]}" text-anchor="start" font-size="${mob ? 12 : 14}" font-weight="700" fill="${d.hex}" stroke="#E7E9DF" stroke-opacity=".88" stroke-width="4.2" stroke-linejoin="round" paint-order="stroke">${mob ? SHORT[d.s] : SECT[d.s]} <tspan font-weight="400" fill="#5E6655">${L[2].toFixed(1)}</tspan></text></g>`; }).join('');
    return `<article class="card fd fday"><span class="k">Así cambia durante el día</span><h3>dB promedio según la hora del día, un lugar por línea</h3>
      <svg data-reveal viewBox="0 0 ${Wd} ${Ht}" role="img" aria-label="Línea de dB promedio por franja horaria para cada lugar con datos">${g}${ls}</svg>
      <p>Cada punto es el promedio de las mediciones de ese tramo del día (a veces solo 1 o 2). Los puntos de Plaza de Mayo y Puente de la Mujer (Buenos Aires) usan sus mediciones propias; la de las 00:20 queda fuera de las franjas.</p></article>`;
  };
  const thesis = () => {
    const w = S.filter(d => d.db != null && d.ag != null), top = w.slice().sort((a, b) => b.ag - a.ag)[0], low = w.slice().sort((a, b) => a.ag - b.ag)[0], pk = S.filter(d => d.mx != null).sort((a, b) => b.mx - a.mx)[0];
    if (!top || !low || top === low) return '';
    const f = v => v.toFixed(1).replace('.', ',');
    const WHY = ['El mar y las voces pesan más que los decibeles.', 'Dominan micros y bocinas, con el flujo vehicular más alto.', 'Captadores y música de locales en un tubo comercial.', 'Voces y canto en torno a la pileta.'];
    const row = (d, v, nm, t) => `<li style="--c:${d.hex}"><b><span data-n="${v}" data-dec="${Number.isInteger(+v) ? 0 : 1}">${Number.isInteger(+v) ? v : f(+v)}</span><small> dB</small></b><div><strong>${nm}</strong><span>${t}</span></div></li>`;
    return `<h3 class="sech2">Lectura de los datos</h3>
      <article class="card thesis"><p class="tq">El ruido no molesta por su volumen, sino por lo que lo produce.</p>
        <ul class="tev">
          ${row(top, top.db.toFixed(1), SECT[top.s], `El mejor valorado de los cuatro: ${top.ags[2] + top.ags[3]} de ${top.ne} respuestas dicen que les gusta${top.inc ? '' : ' y ninguna lo siente incómodo'}. ${WHY[top.s]}`)}
          ${row(low, low.db.toFixed(1), SECT[low.s], `El peor valorado: ${f(Math.abs(low.db - top.db))} dB ${low.db > top.db ? 'más' : 'menos'} y ${low.inc} de ${low.ne} personas lo sienten incómodo. ${WHY[low.s]}`)}
          ${row(pk, String(pk.mx), SECT[pk.s] + ' · pico', pk === top ? 'Aun con este máximo sigue siendo el mejor valorado.' : pk.s === 5 ? 'Máximo registrado, de noche (00:20 h): la música de los bares.' : 'Máximo registrado.')}
        </ul>
        <p class="tn">Pocas encuestas por lugar: es una lectura, no una causa demostrada.</p></article>`;
  };
  const finds = () => {
    const nr = real(uniq(FB)).length, w = S.filter(d => d.s < 4 && d.db != null).sort((a, b) => b.db - a.db), hi = w[0], lo = w[w.length - 1];
    const rise = S.map(d => { const p = d.fr.filter(x => x != null); return p.length > 1 ? [d, p[p.length - 1] - p[0]] : null; }).filter(Boolean), up = rise.filter(r => r[1] > 0).length, av = rise.reduce((a, r) => a + r[1], 0) / rise.length;
    const chip = (d, t) => `<a class="fc" href="#" data-s="${d.s}" style="--c:${d.hex}"><i></i>${SHORT[d.s]}${t ? ' <em>' + t + '</em>' : ''}</a>`;
    return `<section class="finds wrap2" id="finds"><h2 class="sech">Lo que dice el Barrio Puerto</h2>
      <p class="lead3">Tres respuestas a la pregunta, leídas de las ${nr} mediciones con dB. Toca un lugar para verlo.</p>
      <div class="fgrid">
        <article class="card fd"><span class="k">Según el lugar</span><div class="fb"><span data-n="${hi.db.toFixed(1)}" data-dec="1">${hi.db.toFixed(1)}</span> dB</div>
          <h3>${SECT[hi.s]} es el lugar más ruidoso</h3><p>${hi.db.toFixed(1)} dB de promedio (≈ ${DBW(hi.db)}), ${(hi.db - lo.db).toFixed(1)} dB sobre ${SECT[lo.s]}, el más tranquilo (${lo.db.toFixed(1)}).</p>
          <div class="fcs">${chip(hi, hi.db.toFixed(1))}${chip(lo, lo.db.toFixed(1))}</div></article>
        <article class="card fd"><span class="k">Según la fuente</span><div class="fb"><span data-n="${new Set(S.map(d => DOM[d.s])).size}">${new Set(S.map(d => DOM[d.s])).size}</span> fuentes</div>
          <h3>Cada lugar suena distinto</h3><p>La fuente que predomina cambia de un lugar a otro: no hay un solo «ruido del barrio».</p>
          <div class="fcs">${S.map(d => chip(d, SH[DOM[d.s]].toLowerCase())).join('')}</div></article>
        <article class="card fd"><span class="k">Según la hora</span><div class="fb">+<span data-n="${av.toFixed(1)}" data-dec="1">${av.toFixed(1)}</span> dB</div>
          <h3>El sonido sube a medida que avanza el día</h3><p>En ${up} de ${rise.length} lugares con datos, el último tramo medido supera a la mañana (+${av.toFixed(1)} dB en promedio). Pocas mediciones por franja: es una tendencia, no una regla.</p>
          <div class="fcs">${rise.map(([d, v]) => chip(d, (v > 0 ? '+' : '') + v.toFixed(1))).join('')}</div></article>
      </div>
      ${hourChart()}
      ${thesis()}
      <p class="foot2">Plaza de Mayo y Puente de la Mujer (Buenos Aires) son lugares de comparación: tienen dB propios, pero no entran en las cifras del Barrio Puerto. Las equivalencias en palabras son aproximadas.</p></section>`;
  };
  const ABOUT = document.body.classList.contains('about');
  if (!ABOUT) document.getElementById('s3').innerHTML = `${finds()}<div class="steps"><div class="cmpw"><div class="cmp"><h2 id="cmph">Dos lugares frente a frente</h2><p class="cq"></p>
      <div class="ft">${FN.map(f => `<span>${f[0]}<em> ${f[1]}</em></span>`).join('')}</div>
      <div class="cp"><span class="dots">${S.map((d, i) => `<span style="background:${d.hex}"${i ? '' : ' class="on"'}></span>`).join('')}</span><span class="cn r">Lugar <i id="cmpn">1</i> de ${NS} · <i id="cmpt">${SECT[0]}</i></span><span class="cn c">Comparando · <i id="cmpa"></i> ↔ <i id="cmpb"></i></span></div>
      <dl class="cl"></dl></div></div>
    <section class="cstage"><div class="stk"><div class="blk"><div class="bh"><h3>Comparar dos lugares</h3><div class="sub">elige A, B y la hora del día · mismas escalas en mallas y barras</div></div><article class="card sc cmpc"><p class="rd" id="rd" aria-live="polite"></p>
      ${[0, 1].map(k => `<div class="pk" data-k="${k}"><b style="color:${S[k ? 1 : 0].hex}">${'AB'[k]}</b>${S.map((d, i) => `<button data-i="${i}"><i style="background:${d.hex}"></i>${nm(i)}</button>`).join('')}</div>`).join('')}
      <div class="tg fg" id="cfg">${[['all', 'Día'], ['am', 'Mañana'], ['pm', 'Tarde'], ['pk', 'Hora punta']].map(([k, n], i) => `<button data-f="${k}"${i ? '' : ' class="on"'}>${n}</button>`).join('')}</div>
      <div class="bfs" id="bfs"></div></article></div></div></section></div>
`;
  if (!ABOUT) document.body.insertAdjacentHTML('beforeend', '<div id="sref" aria-hidden="true">' + S.map(card).join('') + '</div>'); // molde invisible: da a app.js el tamaño de tarjeta que replican sectores y ciudades expandidos
  const CH = `<p class="lead3">Cada gráfica se transforma en otra del mismo tema con el botón.</p><div class="grid2"><div class="mg" id="gA"></div><div class="mg" id="gB"></div></div>
      <div class="ptr"><div class="mg" id="gD"></div></div>`;
  const S4 = `<p class="lead3">Qué suena, cuánta gente y tráfico hay, y dónde están los picos.</p>
    <div class="grid2"><div class="mg" id="gC"></div><div class="blk"><div class="bh"><h3>Los picos del barrio</h3><p class="cs">Las seis mediciones más altas (dB máximo)</p></div><div class="tg st"><span>De mayor a menor</span></div><div class="card cc"><ol class="peaks">${peaks()}</ol></div></div></div>
    <p class="foot2">Fuente: Base de Datos – Variación Sonora Barrio Puerto. Datos abiertos: <a href="data.json">data.json</a> y <a href="data.js">data.js</a>.</p>`;
  const S5 = `<p class="lead3">La lógica del código, en palabras simples.</p>
    <div class="console"><div class="cbar"><i></i><i></i><i></i><span>marea — explicar</span></div><pre><span class="pm">$</span> marea --explicar
<span class="ok">1 · datos</span>   data.js guarda las mediciones de terreno y las encuestas. Se unen por lugar.
<span class="ok">2 · malla</span>   cada lugar es un tubo de puntos. Un ruido suave (Perlin) lo ondula;
           su largo es la hora, su relieve son los decibeles y cada carril es una fuente.
<span class="ok">3 · puntos</span>  cada medición es un punto brillante sobre la malla, del color de su fuente.
<span class="ok">4 · flujos</span>  puntos lentos son personas; estelas rápidas, vehículos.
           Cuanto menos agrado, más agitado el movimiento.
<span class="ok">5 · scroll</span>  al bajar, el tubo total se parte en seis y luego se acerca al lugar
           que lees. Los filtros solo apagan lo que no coincide.
<span class="ok">6 · vidrio</span>  glass.js dibuja los contenedores con un shader: refracta lo que
           hay detrás, como el sonido atravesando una fachada.
<span class="pm">$</span> <span class="cur"></span></pre></div>`;
  if (ABOUT) {
    document.getElementById('ab-charts').innerHTML = CH; document.getElementById('s4').innerHTML = S4; document.getElementById('s5').innerHTML = S5;
  if (window.VITA) VITA.scan(document.getElementById('ab-charts')), VITA.scan(document.getElementById('s4'));
  Morph(document.getElementById('gA'), A); Morph(document.getElementById('gB'), B); Morph(document.getElementById('gC'), C); Morph(document.getElementById('gD'), D);
  { const SN = { V: 'los vehículos', H: 'las voces', C: 'el comercio', M: 'el puerto', N: 'la naturaleza' }, fr = FN.map(([n, , k]) => { const q = FM.filter(f => f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1]), c = CK.map(c => q.filter(f => f.c === c).length), t = c.indexOf(Math.max(...c)); return `<li><b>${n}</b> <span>predomina ${SN[CK[t]]}</span></li>`; }).join('');
    const lg = document.createElement('div'); lg.className = 'rd2 lg'; lg.id = 'rd2'; document.querySelector('#gD .tg').before(lg);
    const gl = { dot: '<svg viewBox="0 0 40 28"><circle cx="20" cy="14" r="7" fill="currentColor"/></svg>', time: '<svg viewBox="0 0 40 28"><path d="M4 14h30M28 8l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      rows: '<svg viewBox="0 0 40 28"><path d="M5 6h30M5 14h30M5 22h30" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>', size: '<svg viewBox="0 0 40 28"><circle cx="10" cy="15" r="3.5" fill="currentColor"/><circle cx="27" cy="14" r="8" fill="currentColor"/></svg>' };
    lg.innerHTML = `<h5>Cómo leer este gráfico</h5><ul class="how"><li>${gl.dot}<p><b>Cada punto</b> es una medición hecha en terreno.</p></li><li>${gl.time}<p><b>De izquierda a derecha</b> pasa el día, de las 09:40 a las 18:50. La medición de las 00:20 queda al final.</p></li><li>${gl.rows}<p><b>Cada fila</b> es un tipo de sonido: vehículos, voces, comercio, puerto o naturaleza.</p></li><li>${gl.size}<p><b>Más grande</b> significa más fuerte, medido en decibeles (dB).</p></li></ul>
      <div class="see"><h5>Lo que se ve</h5><ul>${fr}</ul><p class="rn">Puntos casi juntos en la misma hora son sonidos que se oyeron a la vez. Son pocas mediciones (${uniq(FM).length}), así que los patrones son pistas, no conclusiones.</p></div>`; }
    const eqBh = () => { const hs = [...document.querySelectorAll('.charts2 .grid2 .bh')]; hs.forEach(h => h.style.minHeight = ''); if (innerWidth <= 700) return; const m = Math.max(0, ...hs.map(h => h.offsetHeight)); hs.forEach(h => h.style.minHeight = m + 'px'); };
    eqBh(); addEventListener('resize', eqBh); setTimeout(eqBh, 500); setTimeout(eqBh, 2000); if (document.fonts && document.fonts.ready) document.fonts.ready.then(eqBh); document.querySelector('.charts2').addEventListener('click', () => setTimeout(eqBh, 60));
    return;
  }




  /* ---- modo comparar: dos lugares frente a frente, misma franja y misma escala ---- */
  const REC = [['Color', 'qué suena más en el lugar'], ['Largo', 'la hora del día, de 09:40 a 18:50'], ['Relieve', 'qué tan fuerte suena (dB): más alto, más fuerte'], ['Puntos brillantes', 'una medición hecha en terreno'], ['Puntos y estelas', 'personas caminando y vehículos pasando'], ['Anillos', 'los finos miden los dB; el grande, cuánto agrada el lugar']];
  const RING = AGC.map((c, i) => `<span style="color:${c}">● ${AGN[i].toLowerCase()}</span>`).join(' ');
  const CMPL = [['Mallas', 'A a la izquierda, B a la derecha, a la misma escala'], ['Color y relieve', 'qué suena más · qué tan fuerte (dB promedio)'], ['Anillo exterior', 'cuánto agrada el lugar: ' + RING + ' (no cambia con la hora)']];
  const CQ = ['¿Cómo varían las fuentes y la intensidad del sonido según el lugar y la hora? Un lugar a la vez, con el mismo modelo.', 'Misma hora del día y misma escala en los dos lugares.'];
  let cur = -1, curF = -1, saved = null, tk = 0;
  const FNM = { all: 'todo el día', am: 'la mañana', pm: 'la tarde', pk: 'la hora punta' }, pair = [0, 1]; let cf = 'all', mode = '';
  const inR = (f, k) => k === 'all' ? !f.night : (!f.ap && f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1]);
  const met = (s, k) => { const all = F.filter(f => f.s === s && inR(f, k)), q = uniq(all), qn = q.filter(f => !f.ap), qr = real(q), c = CK.map(x => all.filter(f => f.c === x && !f.ap).length), mxs = qr.filter(f => f.mx < 100 && !f.ap).map(f => f.mx);
    return { n: qn.length, ap: qr.length > 0 && qr.every(f => f.ap), db: qr.length ? mean(qr, f => f.pr) : null, mx: mxs.length ? Math.max(...mxs) : null, fp: qn.length ? mean(qn, f => f.fp) : null, fv: qn.length ? mean(qn, f => f.fv) : null, dom: qn.length ? (k === 'all' ? DOM[s] : CK[c.indexOf(Math.max(...c))]) : null, ag: S[s].ag, ne: S[s].ne }; };
  const ROWS = [['dB prom.', 'db', 45, 90, v => v.toFixed(1)], ['dB máx.', 'mx', 60, 100, v => v.toFixed(0)], ['Peatonal', 'fp', 1, 3, v => v.toFixed(1)], ['Vehicular', 'fv', 1, 3, v => v.toFixed(1)], ['Agrado*', 'ag', -1, 2, v => v.toFixed(2)], ['Mediciones', 'n', 0, 14, v => v]];
  const dc = k => ({ db: 1, fp: 1, fv: 1, ag: 2 })[k] || 0, bf = (m, i) => { const A = m[0], B = m[1], w = (v, lo, hi) => v == null ? 0 : cl01((v - lo) / (hi - lo)) * 100;
    return ROWS.map(([l, key, lo, hi, f]) => `<div class="bf"><b${A[key] == null ? '' : ` data-n="${f(A[key])}" data-dec="${dc(key)}"`}>${A[key] == null ? '–' : f(A[key])}</b><span class="ba"><i style="width:${w(A[key], lo, hi)}%;background:${S[pair[0]].hex}" data-w="${w(A[key], lo, hi).toFixed(1)}"></i></span><em>${l}</em><span class="bb"><i style="width:${w(B[key], lo, hi)}%;background:${S[pair[1]].hex}" data-w="${w(B[key], lo, hi).toFixed(1)}"></i></span><b${B[key] == null ? '' : ` data-n="${f(B[key])}" data-dec="${dc(key)}"`}>${B[key] == null ? '–' : f(B[key])}</b></div>`).join('')
      + `<div class="bf dm"><b style="color:${A.dom ? COL[A.dom] : 'inherit'}">${A.dom ? SH[A.dom] : '–'}</b><span></span><em>Predomina</em><span></span><b style="color:${B.dom ? COL[B.dom] : 'inherit'}">${B.dom ? SH[B.dom] : '–'}</b></div><p class="bfn">*Agrado: promedio de las encuestas, de −1 (les incomoda) a 2 (les gusta).</p>`; };
  const cmpEl = document.querySelector('.cmp'), cmpL = cmpEl.querySelector('.cl'), cmpQ = cmpEl.querySelector('.cq'), cmpDots = [...cmpEl.querySelectorAll('.dots span')];
  const renderCmp = () => { const [a, b] = pair, A = met(a, cf), B = met(b, cf); if (window.MAREA) MAREA.pair = pair.slice();
    document.getElementById('bfs').innerHTML = bf([A, B]); if (window.VITA) VITA.scan(document.getElementById('bfs'));
    document.getElementById('cmpa').textContent = nm(a); document.getElementById('cmpb').textContent = nm(b);
    document.getElementById('rd').innerHTML = !A.n || !B.n ? 'Sin mediciones en ese tramo del día para uno de los dos lugares.' : A.db == null || B.db == null ? `<b>${SECT[A.db == null ? a : b]}</b> no tiene dB medido, así que la intensidad no se puede comparar en cifras. Predomina ${SH[A.dom].toLowerCase()} frente a ${SH[B.dom].toLowerCase()}. Lectura preliminar: ${A.n} y ${B.n} mediciones.` : (() => { const d = B.db - A.db; return `<b>${SECT[b]}</b> suena ${Math.abs(d).toFixed(1)} dB ${d >= 0 ? 'más fuerte' : 'más bajo'} que <b>${SECT[a]}</b> en ${FNM[cf]}. Predomina ${SH[A.dom].toLowerCase()} frente a ${SH[B.dom].toLowerCase()}. ${A.ag == null || B.ag == null ? '' : `Según las encuestas (${A.ne} y ${B.ne} personas), en ${SECT[a]} ${AGX(A.ag)} y en ${SECT[b]} ${AGX(B.ag)}.`}${Math.min(A.n, B.n) < 3 ? ` Hay ${A.n} y ${B.n} mediciones: lectura preliminar.` : ''}${A.ap || B.ap ? ` El dB de ${SECT[A.ap ? a : b]} es un modelo oficial (APrA 2018), no una medición propia.` : ''}`; })();
    document.querySelectorAll('.pk').forEach(p => p.querySelectorAll('button').forEach(x => x.classList.toggle('on', +x.dataset.i === pair[+p.dataset.k]))); if (mode === 'c') cmpDots.forEach((d, q) => d.classList.toggle('on', pair.includes(q))); };
  const lens = tg => { const th = document.createElement('i'); th.className = 'th'; tg.prepend(th); const place = () => { const b = tg.querySelector('button.on'); if (b) { th.style.left = b.offsetLeft + 'px'; th.style.width = b.offsetWidth + 'px'; } }; place(); addEventListener('resize', place); addEventListener('load', place); if (document.fonts) document.fonts.ready.then(place); return place; };
  const placeF = lens(document.getElementById('cfg'));
  document.querySelectorAll('.pk').forEach(p => p.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const k = +p.dataset.k, i = +b.dataset.i; if (pair[k] === i) return; if (pair[1 - k] === i) pair[1 - k] = pair[k]; pair[k] = i; renderCmp(); }));
  document.getElementById('cfg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cf = b.dataset.f; document.querySelectorAll('#cfg button').forEach(x => x.classList.toggle('on', x === b)); placeF(); renderCmp(); if (window.MAREA && mode === 'c') MAREA.setFlt(cf); upd(); });
  const setMode = m => { if (m === mode) return; mode = m; const c = m === 'c'; cmpEl.dataset.m = m;
    cmpL.innerHTML = (c ? CMPL : REC).map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join(''); cmpQ.textContent = CQ[c ? 1 : 0]; document.getElementById('cmph').textContent = c ? 'Dos lugares frente a frente' : 'Cada lugar, a cada hora';
    cmpEl.querySelector('.cn.r').style.display = c ? 'none' : ''; cmpEl.querySelector('.cn.c').style.display = c ? '' : 'none';
    if (c) renderCmp(); else cmpDots.forEach((d, q) => d.classList.toggle('on', q === cur)); };
  renderCmp(); setMode('r');

  /* scroll → lugar (seis tramos) y, dentro de cada lugar, franja horaria (mañana → tarde → hora punta); después, modo comparar */
  const stp = [...document.querySelectorAll('.steps .step')], dots = cmpDots, cn = document.getElementById('cmpn'), ct = document.getElementById('cmpt'),
    ft = [...document.querySelectorAll('.cmp .ft span')], stepsEl = document.querySelector('.steps'), stg = document.querySelector('.cstage');
  const paint = f => stp.forEach((el, q) => { const d = S[q], v = d.fr[f], n = d.fn[f], c = el.querySelector('.fnow');
    if (d.ref && d.refN) { const fb = Math.min(f, 1), r = fb ? d.refN : d.ref; c.querySelector('.fn').textContent = fb ? 'Noche' : 'Día'; c.querySelector('.fh').textContent = fb ? '22:01–07:00 · modelo' : '07:01–22:00 · modelo'; c.querySelector('.fv').innerHTML = `<i data-n="${r.pr.toFixed(1)}" data-dec="1">${r.pr.toFixed(1)}</i> dB · banda ${r.mn}–${r.mx}`; const bg = el.querySelector('.big span[data-n]'), br = el.querySelector('.dbs i'), bn = el.querySelector('.bnd'); if (bg) { bg.dataset.n = r.pr.toFixed(1); bg.textContent = r.pr.toFixed(1); } if (br) { br.dataset.w = dbPos(r.pr).toFixed(1); br.style.width = dbPos(r.pr).toFixed(1) + '%'; } if (bn) bn.textContent = `Banda modelada de ${fb ? 'noche' : 'día'} ${r.mn}–${r.mx} dB`; if (window.VITA) { VITA.scan(c); if (q === vk) VITA.play(c); } el.querySelectorAll('.pf > div').forEach(r => r.classList.remove('hi')); return; }
    c.querySelector('.fn').textContent = FN[f][0]; c.querySelector('.fh').textContent = FN[f][1] + ' h';
    c.querySelector('.fv').innerHTML = n ? `${v == null ? '<i class="nd">sin dB</i>' : `<i data-n="${v.toFixed(0)}">${v.toFixed(0)}</i> dB`} · ${n} ${n > 1 ? 'mediciones' : 'medición'}` : 'sin mediciones'; if (window.VITA) { VITA.scan(c); if (q === vk) VITA.play(c); }
    el.querySelectorAll('.pf > div').forEach((r, i) => r.classList.toggle('hi', i === f)); });
  let vk = -1, ftBA = false;
  const upd = () => { tk = 0; const vh = innerHeight, sr = stepsEl.getBoundingClientRect(), inside = sr.top < vh * .5 && sr.bottom > vh * .5; // la sección es solo la comparación A/B
    setMode('c');
    const fi = ['am', 'pm', 'pk'].indexOf(cf); ft.forEach((e, j) => { e.classList.toggle('on', j === fi); e.style.setProperty('--p', j === fi ? 1 : 0); });
    if (window.MAREA) { MAREA.setNight(false); if (inside) { if (saved === null) saved = MAREA.flt; MAREA.setFlt(cf); } else if (saved !== null) { MAREA.setFlt(saved); saved = null; } }
    const lim = 68 + cmpEl.offsetHeight + 40, o = cl01((vh * .92 - sr.top) / (vh * .2)) * cl01((sr.bottom - lim) / 90);
    stepsEl.style.setProperty('--ei', cl01((vh * .75 - sr.top) / (vh * .35))); cmpEl.style.opacity = o; cmpEl.style.visibility = o < .02 ? 'hidden' : 'visible'; };
  document.addEventListener('click', e => { const mb = e.target.closest('.cmin'); if (mb) { const b = mb.closest('.blk'), o = b.classList.toggle('open'); mb.setAttribute('aria-expanded', o); mb.textContent = o ? 'Ocultar detalle ▴' : 'Ver detalle ▾'; if (o && window.VITA) VITA.play(b); return; } const g = e.target.closest('#ans a'); if (g) { e.preventDefault(); scrollTo({ top: abs(q1('.finds')) - 40, behavior: 'smooth' }); return; } const a = e.target.closest('.fc'); if (!a) return; e.preventDefault(); const q = +a.dataset.s; scrollTo({ top: innerHeight * 1.95, behavior: 'smooth' }); setTimeout(() => { if (window.MAREA) MAREA.focus(q); }, 1100); });
  addEventListener('scroll', () => { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true }); addEventListener('resize', upd); upd();

  /* ---- navegación por secciones, estado en la URL y teclado ---- */
  const abs = el => el.getBoundingClientRect().top + scrollY, vhh = () => innerHeight, q1 = sel => document.querySelector(sel);
  const SEC = [['barrio', 'Barrio', () => 0], ['ciudades', 'Dos ciudades', () => vhh() * .9], ['sectores', 'Sectores', () => vhh() * 1.95], ['hallazgos', 'Hallazgos', () => abs(q1('.finds')) - 40], ['comparar', 'Comparar', () => abs(stg) - vhh() * .4]];
  const nav = document.createElement('nav'); nav.id = 'sec'; nav.setAttribute('aria-label', 'Secciones del atlas');
  nav.innerHTML = SEC.map(([k, n]) => `<button data-k="${k}" aria-label="${n}"><span>${n}</span><i></i></button>`).join('')
    + '<button class="snd" hidden aria-pressed="false" aria-label="Activar sonido"><span>Sonido silenciado</span><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6v4h2.6L8.5 12.6V3.4L5.1 6z"/><path class="w" d="M10.8 5.6a3.4 3.4 0 010 4.8M12.6 3.8a6 6 0 010 8.4"/></svg></button><button class="lk" aria-label="Copiar enlace a esta vista"><span>Copiar enlace</span><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6.5 9.5l3-3M5 8l-1.2 1.2a2.4 2.4 0 003.4 3.4L8.4 11.4M11 8l1.2-1.2A2.4 2.4 0 008.8 3.4L7.6 4.6"/></svg></button><button class="kb" aria-label="Atajos de teclado"><span>Atajos de teclado</span><b>?</b></button>';
  document.body.appendChild(nav);
  const kbd = document.createElement('div'); kbd.id = 'kbd'; kbd.hidden = true; kbd.setAttribute('role', 'dialog'); kbd.setAttribute('aria-label', 'Atajos de teclado');
  kbd.innerHTML = '<h4>Atajos de teclado</h4><dl><dt>← →</dt><dd>en Comparar, cambia la franja horaria</dd><dt>A · B</dt><dd>en Comparar, cambia el lugar A o B</dd><dt>N · P</dt><dd>sección siguiente o anterior</dd><dt>1 – 4</dt><dd>expande un sector · Esc vuelve</dd><dt>M</dt><dd>activa o silencia el sonido por fuentes</dd><dt>?</dt><dd>muestra u oculta esta ayuda</dd></dl>';
  document.body.appendChild(kbd);
  const sbtn = [...nav.querySelectorAll('button[data-k]')]; let act = -1, ready = false, ut = 0, pin = null;
  const go = (y, i) => { pin = i == null ? null : { i, y: Math.max(0, y), landed: false, ly: 0 }; scrollTo({ top: Math.max(0, y), behavior: RM ? 'auto' : 'smooth' }); };
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => { pin = null; }, { passive: true }));
  sbtn.forEach((b, i) => b.addEventListener('click', () => go((SEC[i][3] || SEC[i][2])(), i)));
  const hashState = () => { const q = new URLSearchParams(); q.set('sec', SEC[act][0]); const M = window.MAREA; if (M.want !== null) q.set('s', M.want + 1);
    if (act <= 2 || M.want !== null) { if (M.flt !== 'all') q.set('f', M.flt); } if (M.srcF) q.set('c', M.srcF);
    if (act === 4) { q.set('A', pair[0] + 1); q.set('B', pair[1] + 1); if (cf !== 'all') q.set('cf', cf); } return '#' + q.toString(); };
  const sync = () => { if (!ready || document.body.classList.contains('heroing') || ut) return; ut = setTimeout(() => { ut = 0; try { history.replaceState(null, '', hashState()); } catch (e) { } }, 250); };
  const mark = () => { const y = scrollY + vhh() * .35; let a = 0; SEC.forEach((s, i) => { if (y >= s[2]() - vhh() * .0) a = i; }); if (pin) { const mx = document.documentElement.scrollHeight - innerHeight; if (!pin.landed && (Math.abs(scrollY - pin.y) < 6 || scrollY >= mx - 2)) { pin.landed = true; pin.ly = scrollY; } if (pin.landed && Math.abs(scrollY - pin.ly) > 30) pin = null; else a = pin.i; } if (a !== act) { act = a; sbtn.forEach((b, i) => { b.classList.toggle('on', i === a); if (i === a) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); } sync(); };
  addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true }); addEventListener('resize', mark);
  document.getElementById('cfg').addEventListener('click', sync); document.querySelectorAll('.pk').forEach(p => p.addEventListener('click', sync));
  nav.querySelector('.lk').addEventListener('click', e => { const b = e.currentTarget, sp = b.querySelector('span'), u = location.href.split('#')[0] + hashState(), done = () => { sp.textContent = 'Enlace copiado'; setTimeout(() => sp.textContent = 'Copiar enlace', 1600); };
    try { history.replaceState(null, '', hashState()); } catch (er) { }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(done, () => prompt('Copia este enlace', u)); else prompt('Copia este enlace', u); });
  const measK = () => { const bt = nav.querySelector('.kb'), r = bt.getBoundingClientRect(), st = kbd.style; st.transition = 'none'; st.setProperty('width', 'var(--kw)', 'important'); st.setProperty('height', 'auto', 'important'); const h = kbd.offsetHeight; st.removeProperty('width'); st.removeProperty('height'); void kbd.offsetWidth; st.transition = ''; kbd.style.setProperty('--kh', h + 'px'); kbd.style.setProperty('--kb', Math.max(12, innerHeight - r.bottom - 6) + 'px'); };
  const tkb = () => { if (kbd.hidden) measK(); kbd.hidden = !kbd.hidden; }; nav.querySelector('.kb').addEventListener('click', tkb);
  addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey || e.altKey || document.body.classList.contains('heroing')) return; const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return; const k = e.key;
    if (k === '?') { tkb(); e.preventDefault(); return; } if (k === 'Escape') { kbd.hidden = true; return; }
    if (/^[np]$/i.test(k)) { go(SEC[Math.max(0, Math.min(SEC.length - 1, act + (/n/i.test(k) ? 1 : -1)))][2]()); e.preventDefault(); return; }
    if (k === 'ArrowRight' || k === 'ArrowLeft') { const d = k === 'ArrowRight' ? 1 : -1;
      if (mode === 'c') { const o = ['all', 'am', 'pm', 'pk'], j = Math.max(0, Math.min(3, o.indexOf(cf) + d)); document.querySelector(`#cfg button[data-f="${o[j]}"]`).click(); e.preventDefault(); }
      return; }
    if (mode === 'c' && /^[ab]$/i.test(k)) { const i = /a/i.test(k) ? 0 : 1; let n = (pair[i] + 1) % NS; if (n === pair[1 - i]) n = (n + 1) % NS; pair[i] = n; renderCmp(); sync(); e.preventDefault(); } });
  // pantallas de poca altura: la tarjeta derecha se escala para caber en el alto visible (sin solapar la anterior)
  const fitBlk = () => { const av = innerHeight - 150, wide = innerWidth > 1100, all = [...document.querySelectorAll('.step .blk'), ...document.querySelectorAll('.cstage .blk')]; all.forEach(b => { b.style.minHeight = ''; b.style.transform = ''; b.style.width = ''; });
    if (!wide) return;
    const tv = Math.min(innerWidth * .4, 660); // ancho visual objetivo; se ensancha la tarjeta y se escala lo justo para caber
    [[...document.querySelectorAll('.step .blk')], [...document.querySelectorAll('.cstage .blk')]].forEach(g => { let sc = 1, w = Math.min(tv, 560); for (let k = 0; k < 4; k++) { g.forEach(b => { b.style.minHeight = ''; b.style.width = w + 'px'; }); const mh = Math.max(0, ...g.map(b => b.offsetHeight)); sc = mh > av ? Math.max(.6, av / mh) : 1; w = Math.min(tv / sc, innerWidth * .62); }
      g.forEach(b => b.style.width = w + 'px'); const mh = Math.max(0, ...g.map(b => b.offsetHeight)); sc = mh > av ? Math.max(.6, av / mh) : 1; g.forEach(b => { b.style.minHeight = mh + 'px'; b.style.transformOrigin = 'right top'; if (sc < 1) b.style.transform = `scale(${sc.toFixed(3)})`; }); }); }; // todas las tarjetas: mismo ancho, alto y escala
  fitBlk(); addEventListener('resize', fitBlk); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBlk); setTimeout(fitBlk, 600); setTimeout(fitBlk, 2000);
  // restaurar la vista desde la URL (si trae sec=…) y saltar la portada
  const restore = () => { const h = location.hash.slice(1); if (!h.includes('sec=')) { ready = true; mark(); return; } const q = new URLSearchParams(h), M = window.MAREA; if (document.body.classList.contains('heroing')) document.getElementById('go').click();
    if (q.get('f')) M.setFlt(q.get('f')); if (q.get('c')) M.setSrc(q.get('c'));
    if (q.get('A') && q.get('B')) { pair[0] = Math.max(0, Math.min(NS - 1, +q.get('A') - 1)); pair[1] = Math.max(0, Math.min(NS - 1, +q.get('B') - 1)); if (pair[0] === pair[1]) pair[1] = (pair[0] + 1) % NS; }
    if (q.get('cf') && ['am', 'pm', 'pk'].includes(q.get('cf'))) { cf = q.get('cf'); document.querySelectorAll('#cfg button').forEach(x => x.classList.toggle('on', x.dataset.f === cf)); placeF(); } renderCmp();
    const i = Math.max(0, SEC.findIndex(s => s[0] === q.get('sec')));
    setTimeout(() => { scrollTo(0, SEC[i][2]()); if (q.get('s')) setTimeout(() => { if (scrollY < vhh()) scrollTo(0, SEC[2][2]()); setTimeout(() => M.focus(+q.get('s') - 1), 900); }, 400); setTimeout(() => { ready = true; mark(); }, q.get('s') ? 2200 : 900); }, 700); };
  restore(); mark();
})();
