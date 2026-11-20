/* Comparativa por sector (la malla se acompaña), gráficas que se transforman, estadísticas y explicación del código.
   Todo se calcula desde data.js (mediciones únicas: BP-17 a 19 cuentan una vez en dB y flujos). */
(function () {
  const S = [0, 1, 2, 3].map(s => {
    const all = F.filter(f => f.s === s), q = uniq(all), es = E.filter(e => e[0] === s), bk = k => { const r = q.filter(f => f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1]); return r.length ? mean(r, f => f.pr) : null; };
    return { s, n: q.length, db: mean(q, f => f.pr), mx: Math.max(...q.filter(f => f.mx < 100).map(f => f.mx)), ag: agrSec(s), ne: es.length, fp: mean(q, f => f.fp), fv: mean(q, f => f.fv),
      fr: [bk('am'), bk('pm'), bk('pk')], hex: COL[DOM[s]], cats: CK.map(c => all.filter(f => f.c === c).length), ags: [-1, 0, 1, 2].map(v => es.filter(e => e[1] === v).length), inc: es.filter(e => e[1] < 0).length };
  });
  const FI = [
    'El lugar más diverso: portuaria, humana, vehicular y comercial. Tiene los picos más altos y, aun así, las 7 respuestas lo valoran bien: el mar y las voces pesan más que los decibeles.',
    'El techo del barrio: micros y bocinas dominan (10 de 11 mediciones) y los flujos son los más altos. 4 de 6 personas lo sienten incómodo.',
    'Un tubo comercial: captadores, música de locales y cortinas. Es tranquilo en la mañana y salta a 72 dB en la hora punta.',
    'Voces y canto en torno a la pileta seca: el sonido más parejo. Con 3 mediciones y 2 encuestas es una lectura preliminar.'];
  const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const FN = [['Mañana', '09:40–12:36', 'am'], ['Tarde', '12:37–17:29', 'pm'], ['Hora punta', '17:30–18:50', 'pk']];
  S.forEach(d => { const q = uniq(F.filter(f => f.s === d.s)); d.fn = FN.map(([, , k]) => q.filter(f => f.m >= FILTERS[k][0] && f.m <= FILTERS[k][1]).length); });
  const card = d => `<section class="step" data-s="${d.s}"><div class="stk"><div class="blk"><div class="bh"><h3>${SECT[d.s]}</h3><div class="sub">${SUB[d.s]} · ${d.n} mediciones</div></div><article class="card sc">
    <div class="big" style="color:${d.hex}">${d.db.toFixed(1)}<small>dB promedio</small></div>
    <div class="chips"><span style="color:${d.hex}">● ${SH[DOM[d.s]]}</span><span style="color:rgb(${agr(d.ag)})">agrado ${d.ag.toFixed(2)}</span></div>
    <div class="fnow"><b class="fn"></b><span class="fh"></span><span class="fv"></span></div>
    <div class="fact">Máximo ${d.mx} dB · flujo peatonal ${d.fp.toFixed(1)} · vehicular ${d.fv.toFixed(1)}</div><p class="fi">${FI[d.s]}</p>
    <div class="pf"><h5>dB promedio por franja</h5>${['Mañana', 'Tarde', 'Hora punta'].map((n, i) => bar(n, d.fr[i], false)).join('')}</div></article></div></div></section>`;

  /* ---- motor de transformación: cada vista es un mapa id → forma; los ids compartidos se interpolan ---- */
  const INK = '#5E6655', MUT = '#8F9984', GR = '#C4C7B9';
  const hx = c => { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); };
  const mixc = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const V = () => { const m = {}; m.add = (id, t, a, o = {}) => { m[id] = Object.assign({ t, a }, o); return m; }; return m; };
  const rect = (v, id, x, y, w, h, f, o = 1, r = 4) => v.add(id, 'rect', { x, y, w, h, o, r }, { f });
  const circ = (v, id, x, y, r, f, o = 1) => v.add(id, 'circle', { x, y, r, o }, { f });
  const line = (v, id, x1, y1, x2, y2, s, o = 1, sw = 1) => v.add(id, 'line', { x1, y1, x2, y2, o, sw }, { f: s });
  const text = (v, id, x, y, s, k = 'm', an = 'start', o = 1) => v.add(id, 'text', { x, y, o }, { txt: String(s), k, an });
  const nm = i => SECT[i].split(' ').pop();

  /* Grupo A · intensidad por lugar <-> evolución por franja */
  const A = {
    a: () => { const v = V(); [50, 60, 70, 80, 90].forEach(t => { const x = 150 + (t - 40) / 55 * 340; line(v, 'ag' + t, x, 12, x, 200, GR); text(v, 'at' + t, x, 216, t, 'm', 'middle'); });
      S.forEach((d, i) => { const y = 24 + i * 44, w = (d.db - 40) / 55 * 340, wm = 150 + (d.mx - 40) / 55 * 340;
        text(v, 'n' + i, 0, y + 11, SECT[i], 'b'); text(v, 's' + i, 0, y + 26, `prom ${d.db.toFixed(1)} · máx ${d.mx}`, 'm');
        rect(v, 'b' + i, 150, y, w, 14, d.hex, .92, 7); line(v, 'mx' + i, wm, y - 4, wm, y + 18, INK, 1, 2.5);
        for (let j = 0; j < 3; j++) circ(v, `p${i}${j}`, 150 + w, y + 7, 0, d.hex, 0);
        for (let j = 0; j < 2; j++) line(v, `q${i}${j}`, 150 + w, y + 7, 150 + w, y + 7, d.hex, 0, 3); }); return v; },
    b: () => { const v = V(), xs = [90, 250, 410], Y = x => 206 - (x - 55) / 25 * 190;
      [60, 70, 80].forEach(t => { line(v, 'ag' + (t - 10), 40, Y(t), 500, Y(t), GR); text(v, 'at' + (t - 10), 32, Y(t) + 4, t, 'm', 'end'); });
      ['Mañana', 'Tarde', 'Hora punta'].forEach((n, j) => text(v, 'x' + j, xs[j], 228, n, 'm', 'middle'));
      S.forEach((d, i) => { const P = d.fr.map((q, j) => q == null ? null : [xs[j], Y(q)]);
        text(v, 'n' + i, P[2] ? P[2][0] + 12 : 420, (P[2] || P[1])[1] + 4 + [8, 0, 0, -7][i], nm(i), 'b'); text(v, 's' + i, 0, 0, '', 'm', 'start', 0);
        rect(v, 'b' + i, 150, 0, 0, 0, d.hex, 0, 7); line(v, 'mx' + i, 150, 0, 150, 0, INK, 0);
        P.forEach((p, j) => p && circ(v, `p${i}${j}`, p[0], p[1], 5.5, d.hex, 1));
        for (let j = 0; j < 2; j++) if (P[j] && P[j + 1]) line(v, `q${i}${j}`, P[j][0], P[j][1], P[j + 1][0], P[j + 1][1], d.hex, 1, 3); }); return v; },
    ta: ['Intensidad', 'dB promedio (barra) y máximo (marca oscura)'], tb: ['La hora punta es el techo', 'dB promedio por franja: mañana, tarde, hora punta'], la: 'Por lugar', lb: 'Por hora', h: 240 };

  /* Grupo B · agrado frente a dB <-> respuestas de agrado */
  const B = {
    a: () => { const v = V(), X = q => 50 + (q - 60) / 14 * 450, Y = a => 206 - (a + 1) / 3 * 190, dy = [-14, 24, 24, -14];
      [60, 64, 68, 72].forEach(t => { line(v, 'gx' + t, X(t), 14, X(t), 206, GR); text(v, 'tx' + t, X(t), 226, t, 'm', 'middle'); });
      [-1, 0, 1, 2].forEach(t => { line(v, 'gy' + t, 50, Y(t), 500, Y(t), GR); text(v, 'ty' + t, 40, Y(t) + 4, t, 'm', 'end'); });
      text(v, 'ax', 500, 238, 'dB promedio →', 'm', 'end'); text(v, 'ay', 0, 10, 'agrado ↑', 'm');
      S.forEach((d, i) => { const x = X(d.db), y = Y(d.ag); circ(v, 'c' + i, x, y, 10, d.hex, .92); text(v, 'n' + i, x, y + dy[i], nm(i), 'b', 'middle');
        for (let k = 0; k < 4; k++) rect(v, `r${i}${k}`, x, y, 0, 0, '#D20A2E', 0); }); return v; },
    b: () => { const v = V(), col = ['#D20A2E', '#a39f8a', '#5E9C8F', '#00675B'], nmz = ['Incomoda', 'Da igual', 'Gusta un poco', 'Gusta'];
      S.forEach((d, i) => { const y = 14 + i * 40; text(v, 'n' + i, 0, y + 13, SECT[i], 'b'); let x = 140;
        d.ags.forEach((c, k) => { rect(v, `r${i}${k}`, x, y, Math.max(c * 48 - 2, 0), 20, col[k], c ? 1 : 0); if (c > 1) text(v, `k${i}${k}`, x + c * 24 - 1, y + 14, c, 'k', 'middle'); x += c * 48; });
        text(v, 'e' + i, x + 4, y + 14, `n=${d.ne}`, 'm'); circ(v, 'c' + i, 140, y + 10, 0, d.hex, 0); });
      nmz.forEach((n, k) => { circ(v, 'lg' + k, 8 + k * 118, 190, 5, col[k]); text(v, 'lt' + k, 18 + k * 118, 194, n, 'm'); }); return v; },
    ta: ['El agrado no sigue a los decibeles', 'Cada lugar según su dB promedio y su agrado'], tb: ['¿Cómo se siente?', 'Respuestas de agrado de las encuestas por lugar'], la: 'Agrado vs dB', lb: 'Respuestas', h: 244 };

  /* Grupo C · qué suena <-> cuánta gente y tráfico */
  const C = {
    a: () => { const v = V(); S.forEach((d, i) => { const y = 14 + i * 40; text(v, 'n' + i, 0, y + 13, SECT[i], 'b'); let x = 140;
        d.cats.forEach((c, k) => { rect(v, `f${i}${k}`, x, y, Math.max(c * 22 - 2, 0), 20, COL[CK[k]], c ? .92 : 0); if (c > 1) text(v, `k${i}${k}`, x + c * 11 - 1, y + 14, c, 'k', 'middle'); x += c * 22; });
        text(v, 'e' + i, x + 4, y + 14, d.cats.reduce((a, b) => a + b, 0), 'm'); });
      CK.forEach((c, k) => { circ(v, 'lg' + k, 8 + k * 98, 190, 5, COL[c]); text(v, 'lt' + k, 18 + k * 98, 194, SH[c], 'm'); }); return v; },
    b: () => { const v = V(); S.forEach((d, i) => { const y = 10 + i * 42; text(v, 'n' + i, 0, y + 14, SECT[i], 'b');
        rect(v, `f${i}0`, 140, y, d.fp / 3 * 300, 10, '#7a8468', 1, 5); text(v, 'e' + i, 146 + d.fp / 3 * 300, y + 9, d.fp.toFixed(1), 'm');
        rect(v, `f${i}1`, 140, y + 15, d.fv / 3 * 300, 10, '#D20A2E', 1, 5); text(v, 'e' + i + 'b', 146 + d.fv / 3 * 300, y + 24, d.fv.toFixed(1), 'm');
        for (let k = 2; k < 5; k++) rect(v, `f${i}${k}`, 140, y + 20, 0, 0, COL[CK[k]], 0); });
      circ(v, 'lg0', 8, 176, 5, '#7a8468'); text(v, 'lt0', 18, 180, 'Personas (1 a 3)', 'm'); circ(v, 'lg1', 168, 176, 5, '#D20A2E'); text(v, 'lt1', 178, 180, 'Vehículos (1 a 3)', 'm'); return v; },
    ta: ['¿Qué suena?', 'Fichas por fuente de sonido y lugar'], tb: ['¿Cuánta gente y tráfico?', 'Nivel de flujo medio de 1 (bajo) a 3 (alto)'], la: 'Fuentes', lb: 'Flujos', h: 204 };

  const mk = (t, at) => { const e = document.createElementNS(NS, t); for (const k in at) e.setAttribute(k, at[k]); return e; };
  function Morph(root, G) {
    root.innerHTML = `<div class="bh"><h3></h3><p class="cs"></p></div><div class="tg" role="group"><button data-v="a" class="on">${G.la}</button><button data-v="b">${G.lb}</button></div><div class="card cc"></div>`;
    const svg = mk('svg', { viewBox: `0 0 520 ${G.h}`, width: '100%', role: 'img' }); root.querySelector('.cc').appendChild(svg);
    const H3 = root.querySelector('h3'), CS = root.querySelector('.cs'), el = {}, cur = {}; let cv = 'a', raf = 0;
    const draw = (id, s) => { const e = el[id]; if (!e) return; const a = s.a;
      if (s.t === 'rect') { e.setAttribute('x', a.x); e.setAttribute('y', a.y); e.setAttribute('width', Math.max(a.w, 0)); e.setAttribute('height', Math.max(a.h, 0)); e.setAttribute('rx', Math.min(a.r, Math.max(a.h, 0) / 2)); e.setAttribute('fill', s.f); }
      else if (s.t === 'circle') { e.setAttribute('cx', a.x); e.setAttribute('cy', a.y); e.setAttribute('r', Math.max(a.r, 0)); e.setAttribute('fill', s.f); }
      else if (s.t === 'line') { e.setAttribute('x1', a.x1); e.setAttribute('y1', a.y1); e.setAttribute('x2', a.x2); e.setAttribute('y2', a.y2); e.setAttribute('stroke', s.f); e.setAttribute('stroke-width', a.sw); e.setAttribute('stroke-linecap', 'round'); }
      else { e.setAttribute('x', a.x); e.setAttribute('y', a.y); e.setAttribute('class', 't ' + s.k); e.setAttribute('text-anchor', s.an); if (e.textContent !== s.txt) e.textContent = s.txt; }
      e.setAttribute('opacity', Math.max(0, Math.min(1, a.o))); };
    const ensure = (id, s) => { if (!el[id]) { el[id] = mk(s.t === 'rect' ? 'rect' : s.t === 'circle' ? 'circle' : s.t === 'line' ? 'line' : 'text', {}); svg.appendChild(el[id]); } };
    const ghost = s => { const g = JSON.parse(JSON.stringify(s)); g.a.o = 0; return g; };
    function go(to, instant) {
      const A_ = G[to](), from = {}; for (const id in cur) from[id] = cur[id];
      const ids = new Set([...Object.keys(from), ...Object.keys(A_)].filter(k => k !== 'add'));
      const S0 = {}, S1 = {}; ids.forEach(id => { S0[id] = from[id] || ghost(A_[id]); S1[id] = A_[id] || ghost(from[id]); if (!from[id]) S0[id].txt = S1[id].txt; if (!A_[id]) S1[id].txt = S0[id].txt; ensure(id, S1[id]); });
      H3.textContent = G['t' + to][0]; CS.textContent = G['t' + to][1]; cv = to; cancelAnimationFrame(raf);
      const T0 = performance.now(), D = instant || RM ? 0 : 750, ez = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const step = now => { const t = D ? Math.min((now - T0) / D, 1) : 1, k = ez(t);
        ids.forEach(id => { const a = S0[id], b = S1[id], o = { t: b.t, a: {}, f: b.f, k: b.k, an: b.an, txt: t < .5 ? a.txt : b.txt };
          for (const q in b.a) o.a[q] = a.a[q] + (b.a[q] - a.a[q]) * k;
          if (a.f && b.f && b.t !== 'text') o.f = mixc(a.f, b.f, k); cur[id] = o; draw(id, o); });
        if (t < 1) raf = requestAnimationFrame(step); else ids.forEach(id => { if (!A_[id]) { el[id].remove(); delete el[id]; delete cur[id]; } else cur[id] = A_[id]; }); };
      raf = requestAnimationFrame(step); }
    const tg = root.querySelector('.tg'), th = document.createElement('i'); th.className = 'th'; tg.prepend(th);
    const place = () => { const b = tg.querySelector('button.on'); th.style.left = b.offsetLeft + 'px'; th.style.width = b.offsetWidth + 'px'; }; place(); addEventListener('resize', place); addEventListener('load', place); if (document.fonts) document.fonts.ready.then(place);
    tg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { if (b.dataset.v === cv) return; tg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); place(); go(b.dataset.v); }));
    go('a', true); }

  const peaks = () => uniq(F).filter(f => f.mx < 100).sort((a, b) => b.mx - a.mx).slice(0, 6).map(f => `<li><b style="color:${COL[f.c]}">${f.mx}<small> dB</small></b><span>${f.src}<em>${SECT[f.s]} · ${f.t} h</em></span></li>`).join('');

  document.getElementById('s3').innerHTML = `<div class="steps"><div class="cmpw"><div class="cmp"><h2>Contraste y comparación</h2><p class="cq">¿Cómo varían las fuentes y la intensidad del sonido según el lugar y la hora? Un lugar a la vez, con el mismo modelo.</p>
      <div class="ft">${FN.map(f => `<span>${f[0]}<em> ${f[1]}</em></span>`).join('')}</div>
      <div class="cp"><span class="dots">${S.map((d, i) => `<span style="background:${d.hex}"${i ? '' : ' class="on"'}></span>`).join('')}</span><span class="cn">Lugar <i id="cmpn">1</i> de 4 · <i id="cmpt">${SECT[0]}</i></span></div>
      <dl class="cl"><div><dt>Color</dt><dd>fuente de sonido que predomina</dd></div><div><dt>Largo</dt><dd>hora, de 09:40 a 18:50</dd></div><div><dt>Relieve</dt><dd>dB promedio del lugar</dd></div><div><dt>Perlas</dt><dd>una medición de terreno</dd></div><div><dt>Puntos y estelas</dt><dd>personas y vehículos</dd></div></dl></div></div>${S.map(card).join('')}</div>
    <div class="wrap2 charts2"><h2 class="sech">Las mismas cifras, de otra forma</h2><p class="lead3">Cada gráfica se transforma en otra del mismo tema con el botón.</p><div class="grid2"><div class="mg" id="gA"></div><div class="mg" id="gB"></div></div></div>`;
  document.getElementById('s4').innerHTML = `<div class="wrap2"><h2 class="sech">Estadísticas del Barrio Puerto</h2>
    <p class="lead3">Qué suena, cuánta gente y tráfico hay, y dónde están los picos.</p>
    <div class="grid2"><div class="mg" id="gC"></div><div class="blk"><div class="bh"><h3>Los picos del barrio</h3><p class="cs">Las seis mediciones más altas (dB máximo)</p></div><div class="card cc"><ol class="peaks">${peaks()}</ol></div></div></div>
    <p class="foot2">Fuente: Base de Datos – Variación Sonora Barrio Puerto. Criterios y límites en <a href="about.html">Acerca del estudio</a>; datos en <a href="data.json">data.json</a>.</p></div>`;
  Morph(document.getElementById('gA'), A); Morph(document.getElementById('gB'), B); Morph(document.getElementById('gC'), C);

  document.getElementById('s5').innerHTML = `<div class="wrap2"><h2 class="sech">Cómo funciona</h2>
    <p class="lead3">La lógica del código, en palabras simples.</p>
    <div class="console"><div class="cbar"><i></i><i></i><i></i><span>marea — explicar</span></div><pre><span class="pm">$</span> marea --explicar
<span class="ok">1 · datos</span>   data.js guarda las 40 fichas y 20 encuestas. Se unen por lugar.
<span class="ok">2 · malla</span>   cada lugar es un tubo de puntos. Un ruido suave (Perlin) lo ondula;
           su largo es la hora, su relieve son los decibeles y cada carril es una fuente.
<span class="ok">3 · fichas</span>  cada medición es una perla sobre la malla, del color de su fuente.
<span class="ok">4 · flujos</span>  puntos lentos son personas; estelas rápidas, vehículos.
           Cuanto menos agrado, más agitado el movimiento.
<span class="ok">5 · scroll</span>  al bajar, el tubo total se parte en cuatro y luego se acerca al lugar
           que lees. Los filtros solo apagan lo que no coincide.
<span class="ok">6 · vidrio</span>  glass.js dibuja los contenedores con un shader: refracta lo que
           hay detrás, como el sonido atravesando una fachada.
<span class="pm">$</span> <span class="cur"></span></pre></div></div>`;

  /* scroll → lugar (cuatro tramos) y, dentro de cada lugar, franja horaria (mañana → tarde → hora punta) */
  const stp = [...document.querySelectorAll('.step')], dots = [...document.querySelectorAll('.cmp .dots span')], cn = document.getElementById('cmpn'), ct = document.getElementById('cmpt'),
    ft = [...document.querySelectorAll('.cmp .ft span')], cmpEl = document.querySelector('.cmp'), stepsEl = document.querySelector('.steps');
  const cl01 = v => Math.max(0, Math.min(1, v)); let cur = -1, curF = -1, saved = null, tk = 0;
  const paint = f => stp.forEach((el, q) => { const d = S[q], v = d.fr[f], n = d.fn[f], c = el.querySelector('.fnow');
    c.querySelector('.fn').textContent = FN[f][0]; c.querySelector('.fh').textContent = FN[f][1] + ' h';
    c.querySelector('.fv').innerHTML = n ? `<i>${v.toFixed(0)}</i> dB · ${n} ${n > 1 ? 'mediciones' : 'medición'}` : 'sin mediciones';
    el.querySelectorAll('.pf > div').forEach((r, i) => r.classList.toggle('hi', i === f)); });
  const upd = () => { tk = 0; const vh = innerHeight; let b = 1e9, k = 0;
    stp.forEach((el, q) => { const r = el.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - vh / 2); if (d < b) { b = d; k = q; } });
    const r = stp[k].getBoundingClientRect(), sr = stepsEl.getBoundingClientRect(), p = cl01((vh / 2 - r.top) / r.height), f = Math.min(2, Math.floor(p * 3)), w = p * 3 - f, inside = sr.top < vh * .5 && sr.bottom > vh * .5;
    if (k !== cur) { cur = k; cn.textContent = k + 1; ct.textContent = SECT[k]; dots.forEach((d, q) => d.classList.toggle('on', q === k)); }
    if (f !== curF) { curF = f; paint(f); }
    ft.forEach((e, j) => { e.classList.toggle('on', j === f); e.style.setProperty('--p', j < f ? 1 : j === f ? w : 0); });
    if (window.MAREA) { if (inside) { if (saved === null) saved = MAREA.flt; MAREA.setFlt(FN[f][2]); } else if (saved !== null) { MAREA.setFlt(saved); saved = null; } }
    const lim = 68 + cmpEl.offsetHeight + 40, o = cl01((vh * .85 - sr.top) / 120) * cl01((sr.bottom - lim) / 90);
    cmpEl.style.opacity = o; cmpEl.style.visibility = o < .02 ? 'hidden' : 'visible'; };
  addEventListener('scroll', () => { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true }); addEventListener('resize', upd); upd();
})();
