/* Sonido por fuentes (prototipo opt-in, silenciado por defecto). Síntesis con Web Audio, sin archivos.
   Qué suena depende de la escena: sector en foco, los dos lugares de «Comparar» (A a la izquierda, B a la derecha), o los cinco lugares en estéreo.
   Mapa: fuente → timbre · dB promedio → volumen · flujo vehicular → frecuencia de pasadas · flujo peatonal → murmullo · agrado bajo → timbre más áspero.
   Para quitarlo: borrar audio.js, su <script> en index.html, el botón .snd en story.js y la llamada SND en app.js. */
window.SND = (() => {
  const AC = window.AudioContext || window.webkitAudioContext; let ctx, master, comp, nbuf, an, slots = [], active = false, vol = 0, timer = 0, last = 0, sceneKey = '';
  const TRIM = { V: .85, H: .7, C: .5, M: 1.15, N: .42 }, PENT = [0, 2, 4, 7, 9, 12, 14, 16];
  const cl = (v, a, b) => Math.max(a, Math.min(b, v)), r = (a, b) => a + Math.random() * (b - a);
  let col = null; const noise = () => { const s = ctx.createBufferSource(); s.buffer = nbuf; s.loop = true; s.loopStart = 0; s.loopEnd = nbuf.duration; s.start(0, Math.random() * nbuf.duration); if (col) col.push(s); return s; };
  const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filt = (t, f, q = 1) => { const x = ctx.createBiquadFilter(); x.type = t; x.frequency.value = f; x.Q.value = q; return x; };
  const lfo = (f, depth, param) => { const o = ctx.createOscillator(), g = gain(depth); o.frequency.value = f; o.connect(g); g.connect(param); o.start(); if (col) col.push(o); return o; };
  function init() {
    try { ctx = new AC({ latencyHint: 'playback' }); } catch (e) { ctx = new AC(); } master = gain(0); comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 6; comp.attack.value = .005; comp.release.value = .25; an = ctx.createAnalyser(); an.fftSize = 2048; master.connect(comp); comp.connect(an); comp.connect(ctx.destination);
    // ruido marrón-blanco con bucle sin costura (el empalme de los extremos producía un golpe cada 3 s)
    const sr = ctx.sampleRate, len = sr * 3, X = Math.floor(sr * .4), tmp = new Float32Array(len + X); let b = 0; for (let i = 0; i < tmp.length; i++) { const w = Math.random() * 2 - 1; b = (b + .02 * w) / 1.02; tmp[i] = w * .5 + b * 6; }
    nbuf = ctx.createBuffer(1, len, sr); const d = nbuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = tmp[i]; for (let i = 0; i < X; i++) { const t = i / X; d[i] = d[i] * Math.sin(t * Math.PI / 2) + tmp[len + i] * Math.cos(t * Math.PI / 2); }
    for (let i = 0; i < NS; i++) slots.push(slot());
  }
  const osc = (type, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(); if (col) col.push(o); return o; };
  function slot() {
    const out = gain(1), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; out.connect(pan || master); if (pan) pan.connect(master);
    const v = {}, B = {};
    // V · motor al ralentí (tono grave con armónicos y pulso suave) + rodadura de neumáticos
    v.V = gain(0); B.V = d => { const o = osc('sawtooth', 56), o2 = osc('sawtooth', 56.7), f = filt('lowpass', 340, .9), m = gain(.8); o.connect(f); o2.connect(f); f.connect(m); m.connect(d); lfo(8.5, .22, m.gain);
      const n = noise(), r = filt('bandpass', 620, .5), rg = gain(.22); n.connect(r); r.connect(rg); rg.connect(d); };
    // H · tumulto de gente murmurando: muchas voces graves superpuestas (pulso glótico suave + formantes anchos + algo de aire), sin vibrato ni agudos, cada una con sílabas y pausas propias → un fondo de habla indistinta
    // H · el murmullo ya no es un lecho continuo: son frases de hablantes sueltos (ver mumble())
    v.H = gain(0);
    // C · se toca con notas sueltas (eventos)
    v.C = gain(0);
    // M · oleaje suave (barrido lento de un ruido grave) + casco/motor de barco (dos senos graves)
    v.M = gain(0); B.M = d => { const n = noise(), f = filt('lowpass', 420, .6), sw = gain(.9); n.connect(f); f.connect(sw); sw.connect(d); lfo(.1, 260, f.frequency); lfo(.07, .4, sw.gain);
      const h1 = osc('sine', 41), h2 = osc('sine', 61.5), hg = gain(.32); h1.connect(hg); h2.connect(hg); hg.connect(d); lfo(.17, .12, hg.gain); };
    // N · viento: aire agudo, sin graves, con rachas lentas
    v.N = gain(0); B.N = d => { const n = noise(), hp = filt('highpass', 650, .5), f = filt('bandpass', 1500, .45), f2 = filt('bandpass', 2900, .7), g2 = gain(.45); n.connect(hp); hp.connect(f); f.connect(d); hp.connect(f2); f2.connect(g2); g2.connect(d); lfo(.07, 700, f.frequency); lfo(.13, 900, f2.frequency); };
    Object.values(v).forEach(g => g.connect(out));
    return { out, pan, v, B, run: {}, w: null, st: null };
  }
  /* fuentes continuas perezosas: solo suenan (y gastan CPU) mientras su volumen es audible; tras 3 s en silencio se detienen y se sueltan */
  function ensure(sl, c, g) { const R = sl.run[c];
    if (g > .002) { if (R) { clearTimeout(R.t); R.t = 0; return; } if (!sl.B[c]) return; const bus = gain(1); bus.connect(sl.v[c]); col = []; sl.B[c](bus); sl.run[c] = { src: col, bus, t: 0 }; col = null; }
    else if (R && !R.t) R.t = setTimeout(() => { R.src.forEach(o => { try { o.stop(); } catch (e) {} }); try { R.bus.disconnect(); } catch (e) {} delete sl.run[c]; }, 3000); }
  const stats = s => { const q = F.filter(f => f.s === s && on(f)), u = uniq(q), c = CK.map(k => q.filter(f => f.c === k).length), tot = c.reduce((a, b) => a + b, 0), top = (window.MAREA && !MAREA.srcF && MAREA.flt === 'all') ? CK.indexOf(DOM[s]) : c.indexOf(Math.max(...c));   // sin filtros, la fuente predominante es la del lugar (DOM)
    let sh = c.map((x, j) => tot ? Math.pow(x / tot, 1.5) * (j === top ? 1.7 : 1) : 0); const sm = sh.reduce((a, b) => a + b, 0) || 1; sh = sh.map(x => x / sm);   // la fuente predominante manda
    return { share: sh, top, db: u.length ? mean(u, f => f.pr) : 0, fv: u.length ? mean(u, f => f.fv) : 1, fp: u.length ? mean(u, f => f.fp) : 1, ag: agrSec(s), n: u.length }; };
  /* eventos: máximo 3 nuevos por ciclo de 120 ms, para que no se apilen voces y el procesador no se sature */
  let made = 0, nextC = 0, nextB = 0, spk = [{ f0: 150, rate: 7.5, var: .6, pan: -.6, next: 0 }, { f0: 240, rate: 8.5, var: .7, pan: .45, next: .7 }, { f0: 510, rate: 11, var: 1, pan: -.15, next: 1.4 }, { f0: 690, rate: 15, var: 1, pan: .7, next: 2.1 }]; const allow = () => made++ < 3;

  function pass(sl, g) { if (!allow()) return; const t = ctx.currentTime, d = r(2, 3.4), e = gain(0), f = filt('lowpass', 520, .8), o = ctx.createOscillator(), n = noise(), nf = filt('bandpass', 700, .6), ng = gain(.35);
    o.type = 'sawtooth'; o.frequency.setValueAtTime(r(60, 72), t); o.frequency.linearRampToValueAtTime(r(95, 120), t + d * .45); o.frequency.linearRampToValueAtTime(r(55, 68), t + d);
    o.connect(f); n.connect(nf); nf.connect(ng); ng.connect(f); f.connect(e); e.connect(sl.out); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + d * .45); e.gain.linearRampToValueAtTime(0, t + d); o.start(t); o.stop(t + d + .1); n.stop(t + d + .1); }
  function beep(sl, g) { if (!allow()) return; const t = ctx.currentTime, e = gain(0), f = filt('lowpass', 1800, .7), k = Math.random() < .4 ? 2 : 1;
    [420, 525].forEach(fr => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fr; o.connect(f); o.start(t); o.stop(t + .7); }); f.connect(e); e.connect(sl.out);
    e.gain.setValueAtTime(0, t); for (let i = 0; i < k; i++) { const a = t + i * .32; e.gain.linearRampToValueAtTime(g * .45, a + .02); e.gain.setValueAtTime(g * .45, a + .17); e.gain.linearRampToValueAtTime(0, a + .2); } }
  function note(sl, g, st, off = 0, fz = 0, dec = .9, free = false) { if (!free && !allow()) return; const t = ctx.currentTime + off, o = ctx.createOscillator(), e = gain(0), f = fz || 196 * Math.pow(2, PENT[Math.floor(Math.random() * PENT.length)] / 12); o.type = st.ag < 0 ? 'square' : 'triangle'; o.frequency.value = f;
    if (st.ag < 0) { const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 1.045; o2.connect(e); o2.start(t); o2.stop(t + dec + .1); }
    o.connect(e); e.connect(sl.out); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g * .4, t + .012); e.gain.exponentialRampToValueAtTime(.0008, t + dec); o.start(t); o.stop(t + dec + .1); }
  /* habla tipo «Animalese» (Animal Crossing): voz sintetizada, mono, formantes desplazados hacia arriba (+35 %), timbre nasal/brillante/metálico,
     sílabas de ataque 8 ms a 8–16 por segundo, pasa-altos ~400 Hz y pasa-bajos ~8,5 kHz, bitcrush muy leve. Cada hablante es una «personalidad» (tono y velocidad). */
  const VF = [[800, 1250], [520, 1900], [310, 2300], [520, 950], [330, 800]].map(v => [v[0] * 1.35, v[1] * 1.35]), ST = [-3, -1, 0, 2, 4, 5, 7, 9];
  const crush = (() => { const n = 256, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.round(x * 48) / 48; } return c; })();
  function mumble(sl, g, p) { const t0 = ctx.currentTime + .02, f0 = p.f0 * r(.97, 1.04), per = 1 / (p.rate * r(.92, 1.08)), n = Math.round(p.rate * r(.5, 1.3)) + 3, o = ctx.createOscillator(), hp = filt('highpass', 400, .5), lp = filt('lowpass', 8500, .4), nz = filt('peaking', 1200, 1.2), b1 = filt('bandpass', 900, 3.5), b2 = filt('bandpass', 2000, 3.5), d0 = gain(.3), g1 = gain(1), g2 = gain(.8), e = gain(0), ws = ctx.createWaveShaper(), pn = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    nz.gain.value = 6; ws.curve = crush; o.type = 'sawtooth'; o.connect(hp); hp.connect(nz); nz.connect(lp); lp.connect(d0); lp.connect(b1); lp.connect(b2); b1.connect(g1); b2.connect(g2); d0.connect(e); g1.connect(e); g2.connect(e); e.connect(ws);
    if (pn) { pn.pan.value = p.pan; ws.connect(pn); pn.connect(sl.out); } else ws.connect(sl.out);
    let t = t0, wl = 3 + Math.floor(Math.random() * 4); const q = Math.random() < .3; e.gain.setValueAtTime(0, t);
    for (let i = 0; i < n; i++) { const d = per * r(.55, .7), f = f0 * Math.pow(2, ST[Math.floor(Math.random() * ST.length)] / 12 * p.var) * (q && i > n - 3 ? 1.2 : 1), v = VF[Math.floor(Math.random() * VF.length)], a = g * r(.7, 1);
      o.frequency.setValueAtTime(f * r(.95, 1.0), t); o.frequency.linearRampToValueAtTime(f * r(1.0, 1.07), t + d); b1.frequency.setValueAtTime(v[0], t); b2.frequency.setValueAtTime(v[1], t);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(a, t + .008); e.gain.linearRampToValueAtTime(a * .5, t + d * .7); e.gain.linearRampToValueAtTime(0, t + d);
      t += per * r(.9, 1.05); if (--wl <= 0) { t += per * r(.6, 1.6); wl = 3 + Math.floor(Math.random() * 4); } }
    o.start(t0); o.stop(t + .1); return t + .1 - ctx.currentTime; }
  /* pájaros: frase de 2–6 píos con barrido de tono (seno agudo), a veces un trino rápido */
  function bird(sl, g) { if (!allow()) return; const t0 = ctx.currentTime, n = 2 + Math.floor(Math.random() * 5), base = r(2600, 4200), trill = Math.random() < .3, dir = Math.random() < .5 ? 1 : -1; let t = 0;
    for (let i = 0; i < n; i++) { const d = trill ? r(.03, .05) : r(.06, .16), f1 = base * r(.85, 1.2) * (1 + dir * .04 * i), f2 = f1 * (Math.random() < .5 ? r(1.15, 1.5) : r(.65, .88)), o = ctx.createOscillator(), e = gain(0), tt = t0 + t;
      o.type = 'sine'; o.frequency.setValueAtTime(f1, tt); o.frequency.exponentialRampToValueAtTime(f2, tt + d); o.connect(e); e.connect(sl.out); e.gain.setValueAtTime(0, tt); e.gain.linearRampToValueAtTime(g * .5, tt + d * .25); e.gain.linearRampToValueAtTime(0, tt + d); o.start(tt); o.stop(tt + d + .02); t += d + (trill ? r(.02, .04) : r(.07, .22)); } }
  /* caja registradora: ráfaga de teclas (2–5 golpes secos y rápidos) + «ching» de dos notas con cola larga; luego silencio */
  function register(sl, g, st) { if (!allow()) return; const n = 2 + Math.floor(Math.random() * 4), base = 196 * Math.pow(2, PENT[3 + Math.floor(Math.random() * 3)] / 12); let t = 0;
    for (let i = 0; i < n; i++) { note(sl, g * .55, st, t, base * (i % 2 ? 1.5 : 1), .13, true); t += r(.07, .12); }
    t += r(.08, .16); note(sl, g * 1.05, st, t, base * 4, 1.1, true); note(sl, g * .8, st, t + .1, base * 6, 1.4, true); }
  function vowel(sl, g) { if (!allow()) return; const t = ctx.currentTime, d = Math.random() < .25 ? r(.7, 1.2) : r(.22, .6), f0 = r(80, 165), o = ctx.createOscillator(), lp = filt('lowpass', 1100, .4), e = gain(0), F = [[640, 1190], [420, 900], [520, 1650], [380, 1100]][Math.floor(Math.random() * 4)];
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * r(.92, 1.06), t + d); o.connect(lp);
    [[F[0], 1.4, 1], [F[1], 1.8, .6]].forEach(([fr, q, m]) => { const bp = filt('bandpass', fr, q), bg = gain(m); lp.connect(bp); bp.connect(bg); bg.connect(e); });
    e.connect(sl.out); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g * .8, t + .09); e.gain.linearRampToValueAtTime(g * .45, t + d * .6); e.gain.linearRampToValueAtTime(0, t + d); o.start(t); o.stop(t + d + .05); }
  function horn(sl, g, big) { if (!allow()) return; const t = ctx.currentTime, e = gain(0), f = filt('lowpass', big ? 520 : 760, .7), base = big ? 87.3 : 155, a = big ? .6 : .35, hold = big ? 2.2 : 1.1, rel = big ? 2.4 : 1.2;
    const os = [osc('sawtooth', base), osc('sawtooth', base * 1.5), osc('sine', base / 2)]; os.forEach(o => { o.connect(f); }); const v = lfo(5, base * .006, os[0].frequency); f.connect(e); e.connect(sl.out);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + a); e.gain.setValueAtTime(g, t + a + hold); e.gain.linearRampToValueAtTime(0, t + a + hold + rel); const end = t + a + hold + rel + .1; os.forEach(o => o.stop(end)); v.stop(end); }
  function tick() { if (!active) return; made = 0; const dt = .12, now0 = ctx.currentTime; slots.forEach(sl => { if (!sl.st || sl.gain < .02) return; const st = sl.st, sh = st.share, lv = sl.gain, P = j => (st.top === j ? 1.5 : 1);
    if (sh[0] > .05 && Math.random() < dt * (.05 + .22 * (st.fv - 1)) * (.5 + 2 * sh[0])) pass(sl, .55 * lv * (.4 + sh[0]));
    if (sh[0] > .1 && Math.random() < dt * (.03 + .05 * (st.fv - 1)) * (.4 + 2 * sh[0])) beep(sl, lv * (.5 + sh[0]));
    if (sh[3] > .04 && Math.random() < dt * (.09 + .12 * sh[3]) * P(3)) horn(sl, lv * (.4 + .9 * sh[3]), Math.random() < .7);
    if (sh[3] > .25 && Math.random() < dt * .04) horn(sl, lv * .5, false); });
    if (now0 >= nextC) { let W = 0; const ws = slots.map(q => { const w = q.st && q.gain > .02 ? q.st.share[2] * q.gain : 0; W += w; return w; });
      if (W > .015) { let x = Math.random() * W, k = 0; while (k < ws.length - 1 && x > ws[k]) { x -= ws[k]; k++; } const q = slots[k]; register(q, q.gain * (.3 + q.st.share[2]), q.st); }
      nextC = now0 + r(1.6, 4.2) / (.6 + Math.min(1.2, W * 2)); }
    if (now0 >= nextB) { let W = 0; const ws = slots.map(q => { const w = q.st && q.gain > .02 ? q.st.share[4] * q.gain : 0; W += w; return w; });
      if (W > .015) { let x = Math.random() * W, k = 0; while (k < ws.length - 1 && x > ws[k]) { x -= ws[k]; k++; } const q = slots[k]; bird(q, q.gain * (.35 + 1.2 * q.st.share[4])); }
      nextB = now0 + r(1.2, 4.5) / (.6 + Math.min(1.2, W * 2)); }
    /* hablantes: 3 voces fijas (tono propio), cada una dice frases sueltas con pausas propias → murmullo de gente, sin coro */
    const now = ctx.currentTime; spk.forEach(p => { if (now < p.next) return; let W = 0; const ws = slots.map(q => { const w = q.st && q.gain > .02 ? q.st.share[1] * q.gain : 0; W += w; return w; });
      if (W > .02) { let x = Math.random() * W, k = 0; while (k < ws.length - 1 && x > ws[k]) { x -= ws[k]; k++; } const q = slots[k]; p.next = now + mumble(q, q.gain * (.7 + 1.1 * q.st.share[1]), p) + r(.4, 2.4) / (.6 + Math.min(1.2, W * 2)); } else p.next = now + .5; }); }
  /* escena: lista de [sector, paneo] y volumen general (0 en portada y en gráficas) */
  function update(sc, v) { if (!active) return; vol = v; const t = ctx.currentTime, key = JSON.stringify(sc.map(x => x[0])) + (window.MAREA ? MAREA.flt : '') + (window.MAREA ? MAREA.srcF : '');
    const k = 1 / Math.sqrt(Math.max(1, sc.length));
    slots.forEach((sl, i) => { const e = sc[i]; if (!e) { sl.gain = 0; sl.out.gain.setTargetAtTime(0, t, .4); CK.forEach(c => { sl.v[c].gain.setTargetAtTime(0, t, .4); ensure(sl, c, 0); }); return; }
      const st = stats(e[0]); sl.st = st; const lvl = Math.pow(cl((st.db - 45) / 35, 0, 1), 1.4) * k * v; sl.gain = lvl; sl.out.gain.setTargetAtTime(1, t, .4); if (sl.pan) sl.pan.pan.setTargetAtTime(e[1], t, .4);
      CK.forEach((c, j) => { const g = st.n ? st.share[j] * TRIM[c] * lvl : 0; let gg = g; if (c === 'V') gg = g * (.5 + .25 * st.fv); if (c === 'H') gg = g * (.5 + .25 * st.fp); if (c === 'N') gg = g * .4; ensure(sl, c, gg * .8); sl.v[c].gain.setTargetAtTime(gg * .8, t, .45); });
      sl.v.C.gain.setTargetAtTime(0, t, .1); }); sceneKey = key; }
  function blip(c, db) { if (!active || !ctx || vol <= .05) return; const t = ctx.currentTime, e = gain(0), g = .12 + .25 * cl((db - 45) / 40, 0, 1); let o;
    if (c === 'H') { o = filt('bandpass', r(320, 900), .7); const n = noise(); n.connect(o); o.connect(e); n.stop(t + 1); }
    else { const os = ctx.createOscillator(); os.type = c === 'C' ? 'triangle' : c === 'M' ? 'sawtooth' : c === 'N' ? 'sine' : 'sawtooth'; os.frequency.value = { V: 110, C: 523, M: 73, N: 880 }[c] || 220; const f = filt('lowpass', c === 'M' || c === 'V' ? 400 : 3000); os.connect(f); f.connect(e); os.start(t); os.stop(t + .5); }
    e.connect(master); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g * vol, t + (c === 'H' ? .12 : .02)); e.gain.exponentialRampToValueAtTime(.0005, t + (c === 'H' ? .9 : .45)); }
  function setActive(on) { if (on && !ctx) init(); active = !!on; if (ctx) { if (on) ctx.resume(); master.gain.setTargetAtTime(on ? .55 : 0, ctx.currentTime, .15); if (!on) setTimeout(() => { if (!active && ctx) ctx.suspend(); }, 600); }
    clearInterval(timer); if (on) timer = setInterval(tick, 120); document.body.classList.toggle('snd-on', !!on); return active; }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (active) ctx.resume(); });
  return { get active() { return active; }, toggle() { return setActive(!active); }, setActive, update, blip, centroid() { if (!an) return 0; const d = new Float32Array(an.frequencyBinCount); an.getFloatFrequencyData(d); let a = 0, b = 0; d.forEach((x, i) => { const p = Math.pow(10, x / 20); a += p * i; b += p; }); return b ? a / b * ctx.sampleRate / an.fftSize : 0; }, peak() { if (!an) return 0; const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); return d.reduce((m, x) => Math.max(m, Math.abs(x)), 0); }, rms() { if (!an) return 0; const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); return Math.sqrt(d.reduce((s, x) => s + x * x, 0) / d.length); }, get ctx() { return ctx; } };
})();

(() => { const b = document.querySelector('#sec .snd'); if (!b) return; b.hidden = false;
  const set = on => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Silenciar sonido' : 'Activar sonido'); b.querySelector('span').textContent = on ? 'Sonido activado' : 'Sonido silenciado'; };
  b.addEventListener('click', () => set(SND.toggle()));
  addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey || e.altKey || document.body.classList.contains('heroing') || e.key.toLowerCase() !== 'm') return; const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return; set(SND.toggle()); }); })();
