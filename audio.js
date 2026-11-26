/* Sonido por fuentes (prototipo opt-in, silenciado por defecto). Síntesis con Web Audio, sin archivos.
   Qué suena depende de la escena: sector en foco, los dos lugares de «Comparar» (A a la izquierda, B a la derecha), o los cinco lugares en estéreo.
   Mapa: fuente → timbre · dB promedio → volumen · flujo vehicular → frecuencia de pasadas · flujo peatonal → murmullo · agrado bajo → timbre más áspero.
   Para quitarlo: borrar audio.js, su <script> en index.html, el botón .snd en story.js y la llamada SND en app.js. */
window.SND = (() => {
  const AC = window.AudioContext || window.webkitAudioContext; let ctx, master, comp, nbuf, an, slots = [], active = false, vol = 0, timer = 0, last = 0, sceneKey = '';
  const TRIM = { V: .85, H: .7, C: .5, M: 1.15, N: .42 }, PENT = [0, 2, 4, 7, 9, 12, 14, 16];
  const cl = (v, a, b) => Math.max(a, Math.min(b, v)), r = (a, b) => a + Math.random() * (b - a);
  const noise = () => { const s = ctx.createBufferSource(); s.buffer = nbuf; s.loop = true; s.loopStart = 0; s.loopEnd = nbuf.duration; s.start(0, Math.random() * nbuf.duration); return s; };
  const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filt = (t, f, q = 1) => { const x = ctx.createBiquadFilter(); x.type = t; x.frequency.value = f; x.Q.value = q; return x; };
  const lfo = (f, depth, param) => { const o = ctx.createOscillator(), g = gain(depth); o.frequency.value = f; o.connect(g); g.connect(param); o.start(); return o; };
  function init() {
    ctx = new AC(); master = gain(0); comp = ctx.createDynamicsCompressor(); an = ctx.createAnalyser(); an.fftSize = 2048; master.connect(comp); comp.connect(an); comp.connect(ctx.destination);
    // ruido marrón-blanco con bucle sin costura (el empalme de los extremos producía un golpe cada 3 s)
    const sr = ctx.sampleRate, len = sr * 3, X = Math.floor(sr * .4), tmp = new Float32Array(len + X); let b = 0; for (let i = 0; i < tmp.length; i++) { const w = Math.random() * 2 - 1; b = (b + .02 * w) / 1.02; tmp[i] = w * .5 + b * 6; }
    nbuf = ctx.createBuffer(1, len, sr); const d = nbuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = tmp[i]; for (let i = 0; i < X; i++) { const t = i / X; d[i] = d[i] * Math.sin(t * Math.PI / 2) + tmp[len + i] * Math.cos(t * Math.PI / 2); }
    for (let i = 0; i < NS; i++) slots.push(slot());
  }
  const osc = (type, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(); return o; };
  function slot() {
    const out = gain(1), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; out.connect(pan || master); if (pan) pan.connect(master);
    const v = {};
    // V · motor al ralentí (tono grave con armónicos y pulso suave) + rodadura de neumáticos
    v.V = gain(0); { const o = osc('sawtooth', 56), o2 = osc('sawtooth', 56.7), f = filt('lowpass', 340, .9), m = gain(.8); o.connect(f); o2.connect(f); f.connect(m); m.connect(v.V); lfo(8.5, .22, m.gain);
      const n = noise(), r = filt('bandpass', 620, .5), rg = gain(.22); n.connect(r); r.connect(rg); rg.connect(v.V); }
    // H · tumulto de gente murmurando: varias voces graves y agudas (pulso glótico + formantes de vocal), cada una con su ritmo de sílabas y pausas, más un soplo de consonantes
    v.H = gain(0); { const bus = gain(1.2), lp = filt('lowpass', 3400, .4); bus.connect(lp); lp.connect(v.H);
      const FM = [[730, 1090, 2440], [270, 2290, 3010], [300, 870, 2240], [530, 1840, 2480], [660, 1720, 2410]];
      for (let i = 0; i < 8; i++) { const f0 = i % 3 === 0 ? r(190, 250) : r(95, 165), o = osc('sawtooth', f0), amp = gain(.5), fm = FM[i % 5];
        lfo(r(4.5, 6), f0 * .012, o.frequency); lfo(r(.15, .6), f0 * .07, o.frequency);
        lfo(r(2.2, 4.8), .28, amp.gain); lfo(r(.1, .3), .2, amp.gain);   // sílabas + pausas de frase (la ganancia no baja de 0)
        fm.forEach((fr, k) => { const bp = filt('bandpass', fr * r(.92, 1.08), k ? 7 : 5), bg = gain([1.3, .8, .4][k]); o.connect(bp); bp.connect(bg); bg.connect(amp); lfo(r(.2, .6), fr * .16, bp.frequency); });
        if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = r(-.7, .7); amp.connect(pn); pn.connect(bus); } else amp.connect(bus); }
      const nz = noise(), nb = filt('bandpass', 2900, .8), ng = gain(.05); nz.connect(nb); nb.connect(ng); ng.connect(bus); lfo(5, .04, ng.gain); }
    // C · se toca con notas sueltas (eventos)
    v.C = gain(0);
    // M · oleaje suave (barrido lento de un ruido grave) + casco/motor de barco (dos senos graves)
    v.M = gain(0); { const n = noise(), f = filt('lowpass', 420, .6), sw = gain(.9); n.connect(f); f.connect(sw); sw.connect(v.M); lfo(.1, 260, f.frequency); lfo(.07, .4, sw.gain);
      const h1 = osc('sine', 41), h2 = osc('sine', 61.5), hg = gain(.32); h1.connect(hg); h2.connect(hg); hg.connect(v.M); lfo(.17, .12, hg.gain); }
    // N · viento: aire agudo, sin graves, con rachas lentas
    v.N = gain(0); { const n = noise(), hp = filt('highpass', 650, .5), f = filt('bandpass', 1500, .45), f2 = filt('bandpass', 2900, .7), g2 = gain(.45); n.connect(hp); hp.connect(f); f.connect(v.N); hp.connect(f2); f2.connect(g2); g2.connect(v.N); lfo(.07, 700, f.frequency); lfo(.13, 900, f2.frequency); }
    Object.values(v).forEach(g => g.connect(out));
    return { out, pan, v, w: null, st: null };
  }
  const stats = s => { const q = F.filter(f => f.s === s && on(f)), u = uniq(q), c = CK.map(k => q.filter(f => f.c === k).length), tot = c.reduce((a, b) => a + b, 0), top = (window.MAREA && !MAREA.srcF && MAREA.flt === 'all') ? CK.indexOf(DOM[s]) : c.indexOf(Math.max(...c));   // sin filtros, la fuente predominante es la del lugar (DOM)
    let sh = c.map((x, j) => tot ? Math.pow(x / tot, 1.5) * (j === top ? 1.7 : 1) : 0); const sm = sh.reduce((a, b) => a + b, 0) || 1; sh = sh.map(x => x / sm);   // la fuente predominante manda
    return { share: sh, top, db: u.length ? mean(u, f => f.pr) : 0, fv: u.length ? mean(u, f => f.fv) : 1, fp: u.length ? mean(u, f => f.fp) : 1, ag: agrSec(s), n: u.length }; };
  /* eventos */
  function pass(sl, g) { const t = ctx.currentTime, d = r(2, 3.4), e = gain(0), f = filt('lowpass', 520, .8), o = ctx.createOscillator(), n = noise(), nf = filt('bandpass', 700, .6), ng = gain(.35);
    o.type = 'sawtooth'; o.frequency.setValueAtTime(r(60, 72), t); o.frequency.linearRampToValueAtTime(r(95, 120), t + d * .45); o.frequency.linearRampToValueAtTime(r(55, 68), t + d);
    o.connect(f); n.connect(nf); nf.connect(ng); ng.connect(f); f.connect(e); e.connect(sl.out); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + d * .45); e.gain.linearRampToValueAtTime(0, t + d); o.start(t); o.stop(t + d + .1); n.stop(t + d + .1); }
  function beep(sl, g) { const t = ctx.currentTime, e = gain(0), f = filt('lowpass', 1800, .7), k = Math.random() < .4 ? 2 : 1;
    [420, 525].forEach(fr => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fr; o.connect(f); o.start(t); o.stop(t + .7); }); f.connect(e); e.connect(sl.out);
    e.gain.setValueAtTime(0, t); for (let i = 0; i < k; i++) { const a = t + i * .32; e.gain.linearRampToValueAtTime(g * .45, a + .02); e.gain.setValueAtTime(g * .45, a + .17); e.gain.linearRampToValueAtTime(0, a + .2); } }
  function note(sl, g, st) { const t = ctx.currentTime, o = ctx.createOscillator(), e = gain(0), f = 196 * Math.pow(2, PENT[Math.floor(Math.random() * PENT.length)] / 12); o.type = st.ag < 0 ? 'square' : 'triangle'; o.frequency.value = f;
    if (st.ag < 0) { const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 1.045; o2.connect(e); o2.start(t); o2.stop(t + 1); }
    o.connect(e); e.connect(sl.out); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g * .4, t + .015); e.gain.exponentialRampToValueAtTime(.0008, t + .9); o.start(t); o.stop(t + 1); }
  function vowel(sl, g) { const t = ctx.currentTime, d = r(.3, .6), f0 = r(100, 230), o = ctx.createOscillator(), e = gain(0), F = [[730, 1090], [300, 870], [530, 1840], [660, 1720]][Math.floor(Math.random() * 4)];
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * r(.88, 1.12), t + d);
    [[F[0], 5, 1], [F[1], 7, .6]].forEach(([fr, q, m]) => { const bp = filt('bandpass', fr, q), bg = gain(m); o.connect(bp); bp.connect(bg); bg.connect(e); });
    e.connect(sl.out); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g * .9, t + .07); e.gain.linearRampToValueAtTime(g * .5, t + d * .6); e.gain.linearRampToValueAtTime(0, t + d); o.start(t); o.stop(t + d + .05); }
  function horn(sl, g, big) { const t = ctx.currentTime, e = gain(0), f = filt('lowpass', big ? 520 : 760, .7), base = big ? 87.3 : 155, a = big ? .6 : .35, hold = big ? 2.2 : 1.1, rel = big ? 2.4 : 1.2;
    const os = [osc('sawtooth', base), osc('sawtooth', base * 1.5), osc('sine', base / 2)]; os.forEach(o => { o.connect(f); }); const v = lfo(5, base * .006, os[0].frequency); f.connect(e); e.connect(sl.out);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + a); e.gain.setValueAtTime(g, t + a + hold); e.gain.linearRampToValueAtTime(0, t + a + hold + rel); const end = t + a + hold + rel + .1; os.forEach(o => o.stop(end)); v.stop(end); }
  function tick() { if (!active) return; const dt = .12; slots.forEach(sl => { if (!sl.st || sl.gain < .02) return; const st = sl.st, sh = st.share, lv = sl.gain, P = j => (st.top === j ? 1.5 : 1);
    if (sh[0] > .05 && Math.random() < dt * (.05 + .22 * (st.fv - 1)) * (.5 + 2 * sh[0])) pass(sl, .55 * lv * (.4 + sh[0]));
    if (sh[0] > .1 && Math.random() < dt * (.03 + .05 * (st.fv - 1)) * (.4 + 2 * sh[0])) beep(sl, lv * (.5 + sh[0]));
    if (sh[1] > .05 && Math.random() < dt * 1.2 * (.3 + 1.5 * sh[1]) * (.4 + .3 * st.fp)) vowel(sl, lv * (.35 + sh[1]));
    if (sh[2] > .05 && Math.random() < dt * 1.6 * (.3 + 1.5 * sh[2])) note(sl, lv * (.3 + sh[2]), st);
    if (sh[3] > .04 && Math.random() < dt * (.09 + .12 * sh[3]) * P(3)) horn(sl, lv * (.4 + .9 * sh[3]), Math.random() < .7);
    if (sh[3] > .25 && Math.random() < dt * .04) horn(sl, lv * .5, false); }); }
  /* escena: lista de [sector, paneo] y volumen general (0 en portada y en gráficas) */
  function update(sc, v) { if (!active) return; vol = v; const t = ctx.currentTime, key = JSON.stringify(sc.map(x => x[0])) + (window.MAREA ? MAREA.flt : '') + (window.MAREA ? MAREA.srcF : '');
    const k = 1 / Math.sqrt(Math.max(1, sc.length));
    slots.forEach((sl, i) => { const e = sc[i]; if (!e) { sl.gain = 0; sl.out.gain.setTargetAtTime(0, t, .4); CK.forEach(c => sl.v[c].gain.setTargetAtTime(0, t, .4)); return; }
      const st = stats(e[0]); sl.st = st; const lvl = Math.pow(cl((st.db - 45) / 35, 0, 1), 1.4) * k * v; sl.gain = lvl; sl.out.gain.setTargetAtTime(1, t, .4); if (sl.pan) sl.pan.pan.setTargetAtTime(e[1], t, .4);
      CK.forEach((c, j) => { const g = st.n ? st.share[j] * TRIM[c] * lvl : 0; let gg = g; if (c === 'V') gg = g * (.5 + .25 * st.fv); if (c === 'H') gg = g * (.5 + .25 * st.fp); sl.v[c].gain.setTargetAtTime(gg * .8, t, .45); });
      sl.v.C.gain.setTargetAtTime(0, t, .1); }); sceneKey = key; }
  function blip(c, db) { if (!active || !ctx || vol <= .05) return; const t = ctx.currentTime, e = gain(0), g = .12 + .25 * cl((db - 45) / 40, 0, 1); let o;
    if (c === 'H') { o = filt('bandpass', r(320, 900), .7); const n = noise(); n.connect(o); o.connect(e); n.stop(t + 1); }
    else { const os = ctx.createOscillator(); os.type = c === 'C' ? 'triangle' : c === 'M' ? 'sawtooth' : c === 'N' ? 'sine' : 'sawtooth'; os.frequency.value = { V: 110, C: 523, M: 73, N: 880 }[c] || 220; const f = filt('lowpass', c === 'M' || c === 'V' ? 400 : 3000); os.connect(f); f.connect(e); os.start(t); os.stop(t + .5); }
    e.connect(master); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g * vol, t + (c === 'H' ? .12 : .02)); e.gain.exponentialRampToValueAtTime(.0005, t + (c === 'H' ? .9 : .45)); }
  function setActive(on) { if (on && !ctx) init(); active = !!on; if (ctx) { if (on) ctx.resume(); master.gain.setTargetAtTime(on ? .55 : 0, ctx.currentTime, .15); if (!on) setTimeout(() => { if (!active && ctx) ctx.suspend(); }, 600); }
    clearInterval(timer); if (on) timer = setInterval(tick, 120); document.body.classList.toggle('snd-on', !!on); return active; }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (active) ctx.resume(); });
  return { get active() { return active; }, toggle() { return setActive(!active); }, setActive, update, blip, centroid() { if (!an) return 0; const d = new Float32Array(an.frequencyBinCount); an.getFloatFrequencyData(d); let a = 0, b = 0; d.forEach((x, i) => { const p = Math.pow(10, x / 20); a += p * i; b += p; }); return b ? a / b * ctx.sampleRate / an.fftSize : 0; }, rms() { if (!an) return 0; const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); return Math.sqrt(d.reduce((s, x) => s + x * x, 0) / d.length); }, get ctx() { return ctx; } };
})();

(() => { const b = document.querySelector('#sec .snd'); if (!b) return; b.hidden = false;
  const set = on => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Silenciar sonido' : 'Activar sonido'); b.querySelector('span').textContent = on ? 'Sonido activado' : 'Sonido silenciado'; };
  b.addEventListener('click', () => set(SND.toggle()));
  addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey || e.altKey || document.body.classList.contains('heroing') || e.key.toLowerCase() !== 'm') return; const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return; set(SND.toggle()); }); })();
