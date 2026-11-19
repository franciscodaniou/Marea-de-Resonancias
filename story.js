/* Contraste, comparación y estadísticas por sector (secciones bajo la visualización).
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
  const T_ = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img">${inner}</svg>`;
  const tx = (xx, yy, t, cl2 = '', an = 'start') => `<text class="t ${cl2}" x="${xx}" y="${yy}" text-anchor="${an}">${t}</text>`;
  const card = d => `<div class="blk"><div class="bh"><h3>${SECT[d.s]}</h3><div class="sub">${SUB[d.s]} · ${d.n} mediciones</div></div><article class="card sc">
    <div class="big" style="color:${d.hex}">${d.db.toFixed(1)}<small>dB promedio</small></div>
    <div class="chips"><span style="color:${d.hex}">● ${SH[DOM[d.s]]}</span><span style="color:rgb(${agr(d.ag)})">agrado ${d.ag.toFixed(2)}</span></div>
    <div class="fact">Máximo ${d.mx} dB · flujo peatonal ${d.fp.toFixed(1)} · vehicular ${d.fv.toFixed(1)}</div><p class="fi">${FI[d.s]}</p>
    <div class="pf"><h5>dB promedio por franja</h5>${['Mañana', 'Tarde', 'Hora punta'].map((n, i) => bar(n, d.fr[i], false)).join('')}</div></article></div>`;
  const cA = () => { let h = ''; [50, 60, 70, 80, 90].forEach(v => { const xx = 150 + (v - 40) / 55 * 340; h += `<line class="g" x1="${xx}" x2="${xx}" y1="12" y2="200"/>` + tx(xx, 214, v, 'm', 'middle'); });
    S.forEach((d, i) => { const y = 24 + i * 44, w = (d.db - 40) / 55 * 340, wm = (d.mx - 40) / 55 * 340; h += tx(0, y + 11, SECT[i], 'b') + tx(0, y + 26, `prom ${d.db.toFixed(1)} · máx ${d.mx}`, 'm') + `<rect x="150" y="${y}" width="${w}" height="14" rx="7" fill="${d.hex}" opacity=".9"/><line x1="${150 + wm}" x2="${150 + wm}" y1="${y - 4}" y2="${y + 18}" stroke="#2f2418" stroke-width="2.5"/>`; });
    return T_(520, 222, h); };
  const cB = () => { let h = ''; [60, 64, 68, 72].forEach(v => { const xx = 50 + (v - 60) / 14 * 450; h += `<line class="g" x1="${xx}" x2="${xx}" y1="14" y2="206"/>` + tx(xx, 226, v, 'm', 'middle'); });
    [-1, 0, 1, 2].forEach(v => { const yy = 206 - (v + 1) / 3 * 190; h += `<line class="g" x1="50" x2="500" y1="${yy}" y2="${yy}"/>` + tx(40, yy + 4, v, 'm', 'end'); });
    const dy = [-14, 24, 24, -14];
    S.forEach((d, i) => { const xx = 50 + (d.db - 60) / 14 * 450, yy = 206 - (d.ag + 1) / 3 * 190; h += `<circle cx="${xx}" cy="${yy}" r="10" fill="${d.hex}" opacity=".9"/>` + tx(xx, yy + dy[i] + (i === 2 ? 0 : 0), SECT[i].split(' ').pop(), 'b', 'middle'); });
    return T_(520, 238, h + tx(500, 238, 'dB promedio →', 'm', 'end') + tx(0, 10, 'agrado ↑', 'm')); };
  const cC = () => { let h = ''; [60, 70, 80].forEach(v => { const yy = 206 - (v - 55) / 25 * 190; h += `<line class="g" x1="40" x2="500" y1="${yy}" y2="${yy}"/>` + tx(32, yy + 4, v, 'm', 'end'); });
    const xs = [90, 250, 410]; ['Mañana', 'Tarde', 'Hora punta'].forEach((n, i) => { h += tx(xs[i], 226, n, 'm', 'middle'); });
    S.forEach((d, i) => { const pts = d.fr.map((v, j) => v == null ? null : [xs[j], 206 - (v - 55) / 25 * 190]).filter(Boolean); h += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${d.hex}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` + pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${d.hex}"/>`).join('') + tx(pts[pts.length - 1][0] + 10, pts[pts.length - 1][1] + 4, SECT[i].split(' ').pop(), 'b'); });
    return T_(520, 238, h); };
  const cD = () => { let h = ''; S.forEach((d, i) => { const y = 14 + i * 40; h += tx(0, y + 13, SECT[i], 'b'); let xx = 140; d.cats.forEach((c, k) => { if (!c) return; const w = c * 22; h += `<rect x="${xx}" y="${y}" width="${w - 2}" height="20" rx="4" fill="${COL[CK[k]]}" opacity=".9"/>` + (c > 1 ? tx(xx + w / 2 - 1, y + 14, c, 'k', 'middle') : ''); xx += w; }); h += tx(xx + 4, y + 14, d.cats.reduce((a, b) => a + b, 0), 'm'); });
    CK.forEach((c, k) => { h += `<circle cx="${8 + k * 98}" cy="190" r="5" fill="${COL[c]}"/>` + tx(18 + k * 98, 194, SH[c], 'm'); }); return T_(520, 204, h); };
  const cE = () => { let h = ''; S.forEach((d, i) => { const y = 10 + i * 42; h += tx(0, y + 14, SECT[i], 'b') + `<rect x="140" y="${y}" width="${d.fp / 3 * 300}" height="10" rx="5" fill="#8a6d3b"/>` + tx(146 + d.fp / 3 * 300, y + 9, d.fp.toFixed(1), 'm') + `<rect x="140" y="${y + 15}" width="${d.fv / 3 * 300}" height="10" rx="5" fill="#c8483b"/>` + tx(146 + d.fv / 3 * 300, y + 24, d.fv.toFixed(1), 'm'); });
    return T_(520, 190, h + `<circle cx="8" cy="176" r="5" fill="#8a6d3b"/>` + tx(18, 180, 'Personas (1 a 3)', 'm') + `<circle cx="168" cy="176" r="5" fill="#c8483b"/>` + tx(178, 180, 'Vehículos (1 a 3)', 'm')); };
  const cF = () => { const colr = ['#c8483b', '#9a8f7d', '#6fb3a4', '#1f8f82'], nm = ['Incomoda', 'Da igual', 'Gusta un poco', 'Gusta']; let h = ''; S.forEach((d, i) => { const y = 14 + i * 40; h += tx(0, y + 13, SECT[i], 'b'); let xx = 140; d.ags.forEach((c, k) => { if (!c) return; const w = c * 48; h += `<rect x="${xx}" y="${y}" width="${w - 2}" height="20" rx="4" fill="${colr[k]}"/>` + tx(xx + w / 2 - 1, y + 14, c, 'k', 'middle'); xx += w; }); h += tx(xx + 4, y + 14, `n=${d.ne}`, 'm'); });
    nm.forEach((n, k) => { h += `<circle cx="${8 + k * 118}" cy="190" r="5" fill="${colr[k]}"/>` + tx(18 + k * 118, 194, n, 'm'); }); return T_(520, 204, h); };
  const peaks = () => uniq(F).filter(f => f.mx < 100).sort((a, b) => b.mx - a.mx).slice(0, 6).map(f => `<li><b style="color:${COL[f.c]}">${f.mx}<small> dB</small></b><span>${f.src}<em>${SECT[f.s]} · ${f.t} h</em></span></li>`).join('');
  const ch = (t, c, svg) => `<div class="blk"><div class="bh"><h3>${t}</h3><p class="cs">${c}</p></div><div class="card cc">${svg}</div></div>`;
  document.getElementById('s3').innerHTML = `<div class="wrap2"><h2 class="sech">Contraste y comparación</h2>
    <p class="lead3">¿Cómo varían las fuentes y la intensidad del sonido según el lugar y la hora? Cuatro lugares del Barrio Puerto, cuatro respuestas distintas.</p>
    <div class="cards4">${S.map(card).join('')}</div>
    <div class="charts">${ch('Intensidad', 'dB promedio (barra) y máximo (marca oscura)', cA())}${ch('El agrado no sigue a los decibeles', 'Cada lugar según su dB promedio y su agrado', cB())}${ch('La hora punta es el techo', 'dB promedio por franja horaria', cC())}</div></div>`;
  document.getElementById('s4').innerHTML = `<div class="wrap2"><h2 class="sech">Estadísticas del Barrio Puerto</h2>
    <p class="lead3">Qué suena, cuánta gente y tráfico hay, cómo se siente cada lugar y dónde están los picos.</p>
    <div class="grid2">${ch('¿Qué suena?', 'Fichas por fuente de sonido y lugar', cD())}${ch('¿Cuánta gente y tráfico?', 'Nivel de flujo medio de 1 (bajo) a 3 (alto)', cE())}${ch('¿Cómo se siente?', 'Respuestas de agrado de las encuestas', cF())}
    <div class="blk"><div class="bh"><h3>Los picos del barrio</h3><p class="cs">Las seis mediciones más altas (dB máximo)</p></div><div class="card cc"><ol class="peaks">${peaks()}</ol></div></div></div>
    <p class="foot2">Fuente: Base de Datos – Variación Sonora Barrio Puerto. Criterios y límites en <a href="about.html">Acerca del estudio</a>; datos en <a href="data.json">data.json</a>.</p></div>`;
})();
