/* Sonido por fuentes (prototipo opt-in, silenciado por defecto). Síntesis con Web Audio, sin archivos.
   Qué suena depende de la escena: sector en foco, los dos lugares de «Comparar» (A a la izquierda, B a la derecha), o los cuatro lugares en estéreo.
   Mapa: fuente → timbre · dB promedio → volumen · flujo vehicular → frecuencia de pasadas · flujo peatonal → murmullo · agrado bajo → timbre más áspero.
   Para quitarlo: borrar audio.js, su <script> en index.html, el botón .snd en story.js y la llamada SND en app.js. */
window.SND = (() => {
  const AC = window.AudioContext || window.webkitAudioContext; let ctx, master, comp, nbuf, an, slots = [], active = false, vol = 0, timer = 0, last = 0, sceneKey = '';
  const TRIM = { V: .9, H: .75, C: .5, M: 1, N: .55 }, PENT = [0, 2, 4, 7, 9, 12, 14, 16];
  const cl = (v, a, b) => Math.max(a, Math.min(b, v)), r = (a, b) => a + Math.random() * (b - a);
  const noise = () => { const s = ctx.createBufferSource(); s.buffer = nbuf; s.loop = true; s.loopStart = 0; s.loopEnd = nbuf.duration; s.start(0, Math.random() * nbuf.duration); return s; };
  const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filt = (t, f, q = 1) => { const x = ctx.createBiquadFilter(); x.type = t; x.frequency.value = f; x.Q.value = q; return x; };
  const lfo = (f, depth, param) => { const o = ctx.createOscillator(), g = gain(depth); o.frequency.value = f; o.connect(g); g.connect(param); o.start(); return o; };
  function init() {
    ctx = new AC(); master = gain(0); comp = ctx.createDynamicsCompressor(); an = ctx.createAnalyser(); an.fftSize = 1024; master.connect(comp); comp.connect(an); comp.connect(ctx.destination);
    const len = ctx.sampleRate * 3; nbuf = ctx.createBuffer(1, len, ctx.sampleRate); const d = nbuf.getChannelData(0); let b = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b = (b + .02 * w) / 1.02; d[i] = (w * .5 + b * 6); }
    for (let i = 0; i < 4; i++) slots.push(slot());
  }
  function slot() {
    const out = gain(1), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; out.connect(pan || master); if (pan) pan.connect(master);
    const v = {}; // un canal por fuente
    v.V = gain(0); { const n = noise(), f = filt('lowpass', 170, .7); n.connect(f); f.connect(v.V); }                                   // rumor de motores
    v.H = gain(0); { const n = noise(), a = filt('bandpass', 650, 1.1), b = filt('bandpass', 1500, 1.4), m = gain(.5); n.connect(a); a.connect(m); n.connect(b); b.connect(m); m.connect(v.H); lfo(3.2 + Math.random(), .35, m.gain); }  // murmullo silábico
    v.C = gain(0);                                                                                                                       // notas sueltas (música de locales)
    v.M = gain(0); { const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), f = filt('lowpass', 210, .8), m = gain(.6); o1.type = o2.type = 'sawtooth'; o1.frequency.value = 55; o2.frequency.value = 82.6; o1.connect(f); o2.connect(f); f.connect(m); m.connect(v.M); o1.start(); o2.start(); lfo(.11, .25, m.gain); } // zumbido portuario
    v.N = gain(0); { const n = noise(), f = filt('bandpass', 900, .35); n.connect(f); f.connect(v.N); lfo(.09, 500, f.frequency); }                                       // viento
    Object.values(v).forEach(g => g.connect(out));
    return { out, pan, v, w: null, st: null };
  }
  const stats = s => { const q = F.filter(f => f.s === s && on(f)), u = uniq(q), c = CK.map(k => q.filter(f => f.c === k).length), tot = c.reduce((a, b) => a + b, 0);
    return { share: c.map(x => tot ? x / tot : 0), db: u.length ? mean(u, f => f.pr) : 0, fv: u.length ? mean(u, f => f.fv) : 1, fp: u.length ? mean(u, f => f.fp) : 1, ag: agrSec(s), n: u.length }; };
  /* eventos: pasadas de vehículos, notas comerciales, bocinas del puerto */
  function pass(sl, g, st) { const t = ctx.currentTime, n = noise(), f = filt('bandpass', r(250, 500), 2.2), e = gain(0); n.connect(f); f.connect(e); e.connect(sl.out); const d = r(1.4, 2.6);
    f.frequency.setValueAtTime(f.frequency.value, t); f.frequency.exponentialRampToValueAtTime(r(700, 1100), t + d * .5); f.frequency.exponentialRampToValueAtTime(r(200, 350), t + d);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g * .9, t + d * .45); e.gain.linearRampToValueAtTime(0, t + d); n.stop(t + d + .1); }
  function note(sl, g, st) { const t = ctx.currentTime, o = ctx.createOscillator(), e = gain(0), f = 196 * Math.pow(2, PENT[Math.floor(Math.random() * PENT.length)] / 12); o.type = st.ag < 0 ? 'square' : 'triangle'; o.frequency.value = f;
    if (st.ag < 0) { const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 1.045; o2.connect(e); o2.start(t); o2.stop(t + 1); }
    o.connect(e); e.connect(sl.out); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g * .4, t + .015); e.gain.exponentialRampToValueAtTime(.0008, t + .9); o.start(t); o.stop(t + 1); }
  function hornM(sl, g) { const t = ctx.currentTime, e = gain(0), f = filt('lowpass', 420, .7), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(); o1.type = o2.type = 'sawtooth'; o1.frequency.value = 110; o2.frequency.value = 164.8; o1.connect(f); o2.connect(f); f.connect(e); e.connect(sl.out);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g * .7, t + .35); e.gain.setValueAtTime(g * .7, t + 1.6); e.gain.linearRampToValueAtTime(0, t + 2.6); o1.start(t); o2.start(t); o1.stop(t + 2.7); o2.stop(t + 2.7); }
  function tick() { if (!active) return; const dt = .12; slots.forEach(sl => { if (!sl.st || sl.gain < .02) return; const st = sl.st, sh = st.share;
    const lv = sl.gain; if (Math.random() < dt * (.08 + .3 * (st.fv - 1)) * (sh[0] > .02 ? 1 : 0) * 1.5) pass(sl, .5 * lv * (.4 + sh[0]), st);
    if (sh[2] > .02 && Math.random() < dt * 1.6 * (.4 + sh[2])) note(sl, lv * (.3 + sh[2]), st);
    if (sh[3] > .02 && Math.random() < dt * .09) hornM(sl, lv * (.3 + sh[3])); }); }
  /* escena: lista de [sector, paneo] y volumen general (0 en portada y en gráficas) */
  function update(sc, v) { if (!active) return; vol = v; const t = ctx.currentTime, key = JSON.stringify(sc.map(x => x[0])) + (window.MAREA ? MAREA.flt : '') + (window.MAREA ? MAREA.srcF : '');
    const k = 1 / Math.sqrt(Math.max(1, sc.length));
    slots.forEach((sl, i) => { const e = sc[i]; if (!e) { sl.gain = 0; sl.out.gain.setTargetAtTime(0, t, .4); CK.forEach(c => sl.v[c].gain.setTargetAtTime(0, t, .4)); return; }
      const st = stats(e[0]); sl.st = st; const lvl = Math.pow(cl((st.db - 45) / 35, 0, 1), 1.4) * k * v; sl.gain = lvl; sl.out.gain.setTargetAtTime(1, t, .4); if (sl.pan) sl.pan.pan.setTargetAtTime(e[1], t, .4);
      CK.forEach((c, j) => { const g = st.n ? st.share[j] * TRIM[c] * lvl : 0; let gg = g; if (c === 'V') gg = g * (.5 + .25 * st.fv); if (c === 'H') gg = g * (.5 + .25 * st.fp); sl.v[c].gain.setTargetAtTime(gg * .8, t, .45); });
      sl.v.C.gain.setTargetAtTime(0, t, .1); }); sceneKey = key; }
  function blip(c, db) { if (!active || !ctx || vol <= .05) return; const t = ctx.currentTime, e = gain(0), g = .12 + .25 * cl((db - 45) / 40, 0, 1); let o;
    if (c === 'H') { o = filt('bandpass', r(500, 1400), 1.6); const n = noise(); n.connect(o); o.connect(e); n.stop(t + .5); }
    else { const os = ctx.createOscillator(); os.type = c === 'C' ? 'triangle' : c === 'M' ? 'sawtooth' : c === 'N' ? 'sine' : 'sawtooth'; os.frequency.value = { V: 110, C: 523, M: 73, N: 880 }[c] || 220; const f = filt('lowpass', c === 'M' || c === 'V' ? 400 : 3000); os.connect(f); f.connect(e); os.start(t); os.stop(t + .5); }
    e.connect(master); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g * vol, t + .02); e.gain.exponentialRampToValueAtTime(.0005, t + .45); }
  function setActive(on) { if (on && !ctx) init(); active = !!on; if (ctx) { if (on) ctx.resume(); master.gain.setTargetAtTime(on ? .55 : 0, ctx.currentTime, .15); if (!on) setTimeout(() => { if (!active && ctx) ctx.suspend(); }, 600); }
    clearInterval(timer); if (on) timer = setInterval(tick, 120); document.body.classList.toggle('snd-on', !!on); return active; }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (active) ctx.resume(); });
  return { get active() { return active; }, toggle() { return setActive(!active); }, setActive, update, blip, rms() { if (!an) return 0; const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); return Math.sqrt(d.reduce((s, x) => s + x * x, 0) / d.length); }, get ctx() { return ctx; } };
})();

(() => { const b = document.querySelector('#sec .snd'); if (!b) return; b.hidden = false;
  const set = on => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Silenciar sonido' : 'Activar sonido'); b.querySelector('span').textContent = on ? 'Sonido activado' : 'Sonido silenciado'; };
  b.addEventListener('click', () => set(SND.toggle()));
  addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey || e.altKey || document.body.classList.contains('heroing') || e.key.toLowerCase() !== 'm') return; const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return; set(SND.toggle()); }); })();
