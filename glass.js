/* Glassmorfismo para la interfaz · WebGL1 + fragment shader (Safari, Firefox y Chromium)
   Los contenedores y botones del DOM se pasan al shader como cajas redondeadas que se funden
   (unión suave, como metabolas). Sobre ese campo de distancia se aplica la receta del glassmorfismo:
   refracción de borde (bisel), separación cromática por canal (R 1.10 · G 1.00 · B 0.90),
   desenfoque, luz de borde y, al acercar el cursor, un brillo especular que lo sigue y un
   crecimiento con resorte (con resorte).
   Si WebGL no está disponible, la hoja de estilos usa un vidrio CSS equivalente (fallback). */
(function () {
  // pills contenedores: en pantallas táctiles se abren con un toque
  document.addEventListener('click', e => { const l = e.target.closest && e.target.closest('.morph .lbl'); if (l) l.parentElement.classList.toggle('open'); else document.querySelectorAll('.morph.open').forEach(m => { if (!m.contains(e.target)) m.classList.remove('open'); }); document.body.classList.toggle('navopen', !!document.querySelector('#nav.open')); });
  let src = document.getElementById('c'), bgDraw = null;
  const gc = document.createElement('canvas'); gc.id = 'glass';
  if (src) src.parentNode.insertBefore(gc, src.nextSibling);
  else { src = document.createElement('canvas'); bgDraw = makeBg(src); document.body.insertBefore(gc, document.body.firstChild); }
  // fondo para páginas sin visualización: polígonos string-art lentos que el vidrio refracta
  function makeBg(cv) {            // fondo de about: la "marea total" del modelo (tubo anillado, un cuarto por sector)
    const c = cv.getContext('2d'), COLS = ['#1A5E89', '#D20A2E', '#E2AC2C', '#6150A2'], NU = 64, NV = 22, TAU = 6.2832;
    const nz = (x, y, z, t) => (Math.sin(1.7 * x + t * .3 + Math.sin(2.1 * y + t * .2)) + Math.sin(2.3 * y - 1.3 * z + t * .25) + Math.sin(1.1 * z + 1.9 * x - t * .2)) / 3;
    return t => {
      const W = innerWidth, H = innerHeight; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      c.fillStyle = '#DCDDD3'; c.fillRect(0, 0, W, H);
      const R0 = Math.min(W, H) * .30, FP = R0 * 4.2, cx = W * .5, cy = H * .5, ry = t * .06, rx = -.9 + .12 * Math.sin(t * .1), cY = Math.cos(ry), sY = Math.sin(ry), cX = Math.cos(rx), sX = Math.sin(rx);
      const P = [];
      for (let u = 0; u <= NU; u++) { const th = u / NU * TAU, row = []; for (let v = 0; v < NV; v++) { const ph = v / NV * TAU;
          const k = nz(Math.cos(th) * 1.4, Math.sin(th) * 1.4, Math.cos(ph) * .9, t), r = R0 * (.26 + .22 * (.5 + .5 * Math.sin(u / NU * TAU * 2 + t * .2)) + .16 * k);
          let x = (R0 + r * Math.cos(ph)) * Math.cos(th), y = (R0 + r * Math.cos(ph)) * Math.sin(th), z = r * Math.sin(ph) * 1.6;
          const x1 = x * cY + z * sY, z1 = -x * sY + z * cY, y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX, s = FP / (FP + z2 + R0);
          row.push([cx + x1 * s, cy + y2 * s]); } P.push(row); }
      c.lineWidth = 1; c.lineJoin = 'round';
      for (let q = 0; q < 4; q++) {
        c.strokeStyle = COLS[q] + '66'; c.beginPath();
        for (let u = q * NU / 4; u <= (q + 1) * NU / 4; u++) for (let v = 0; v < NV; v++) { const p = P[u][v]; if (u === q * NU / 4) { v ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } }
        c.stroke(); c.beginPath();
        for (let v = 0; v < NV; v += 1) { for (let u = q * NU / 4; u <= (q + 1) * NU / 4; u++) { const p = P[u][v]; u === q * NU / 4 ? c.moveTo(p[0], p[1]) : c.lineTo(p[0], p[1]); } }
        c.stroke(); c.beginPath();
        for (let u = q * NU / 4; u <= (q + 1) * NU / 4; u += 2) { for (let v = 0; v <= NV; v++) { const p = P[u][v % NV]; v ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } }
        c.stroke();
      }
    };
  }
  let gl = null; try { gl = gc.getContext('webgl', { antialias: false, alpha: false }) || gc.getContext('experimental-webgl'); } catch (e) { }
  const fail = m => { if (m) console.warn('glass:', m); gc.remove(); document.body.classList.remove('gl'); };
  if (!gl) return fail('sin WebGL');

  const VERT = 'attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.,1.);}';
  const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uDens, uT;
uniform vec4 uR[16];
uniform float uRr[16];
uniform float uE[16];
uniform vec2 uM;
uniform float uHero;
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float sdBox(vec2 p, vec2 c, vec2 hs, float r){
  vec2 q = abs(p - c) - hs + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float scene(vec2 p){
  float d = 100000.0;
  for (int i = 0; i < 16; i++) {
    if (uR[i].z > 0.5) {
      vec2 hs = uR[i].zw * 0.5;
      d = smin(d, sdBox(p, uR[i].xy + hs, hs, uRr[i]), 6.0);
    }
  }
  return d;
}
float energyAt(vec2 p){
  float best = 100000.0, e = 0.0;
  for (int i = 0; i < 16; i++) {
    if (uR[i].z > 0.5) {
      vec2 hs = uR[i].zw * 0.5;
      float di = sdBox(p, uR[i].xy + hs, hs, uRr[i]);
      if (di < best) { best = di; e = uE[i]; }
    }
  }
  return e;
}
vec3 blurSample(vec2 p){
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.0471976;
    acc += texture2D(uTex, (p + vec2(cos(a), sin(a)) * 2.5) / uRes).rgb;
  }
  return mix(acc / 6.0, vec3(0.863, 0.867, 0.827), 0.72 * uHero);
}
vec3 bgSample(vec2 p){
  vec3 c = texture2D(uTex, p / uRes).rgb;
  if (uHero > 0.01) {
    vec3 w = vec3(0.0);
    for (int i = 0; i < 6; i++) {
      float a = float(i) * 1.0471976;
      w += texture2D(uTex, (p + vec2(cos(a), sin(a)) * 10.0) / uRes).rgb + texture2D(uTex, (p + vec2(cos(a + 0.5), sin(a + 0.5)) * 22.0) / uRes).rgb;
    }
    c = mix(mix(c, w / 12.0, uHero), vec3(0.863, 0.867, 0.827), 0.72 * uHero);
  }
  return c;
}
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDens - gl_FragCoord.y) / uDens;
  vec3 base = bgSample(p);
  float d = scene(p);
  base *= 1.0 - 0.2 * (1.0 - smoothstep(-6.0, 24.0, scene(p - vec2(5.0, 11.0))));   // sombra suave sobre el fondo claro
  if (d > 1.5) { gl_FragColor = vec4(base, 1.0); return; }

  float t = max(-d, 0.0);
  vec2 e = vec2(1.5, 0.0);
  vec2 n = normalize(vec2(scene(p + e.xy) - scene(p - e.xy), scene(p + e.yx) - scene(p - e.yx)) + 1e-5);
  float en = energyAt(p);
  float st = pow(clamp(1.0 - t / 16.0, 0.0, 1.0), 2.0);
  vec2 off = n * st * (40.0 + 16.0 * en);
  vec3 col = vec3(blurSample(p + off * 1.10).r, blurSample(p + off).g, blurSample(p + off * 0.90).b);

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 1.15);
  col = mix(col, vec3(1.0), 0.16 + 0.12 * (1.0 - smoothstep(0.0, 36.0, t)));   // vidrio esmerilado neutro
  vec2 mv = p - uM;
  col += vec3(1.0) * exp(-dot(mv, mv) / 9800.0) * en * 0.22;            // brillo especular que sigue al cursor

  vec2 Ld = normalize(vec2(-0.55, -0.83));
  float s1 = pow(max(dot(n, Ld), 0.0), 3.0);
  float s2 = pow(max(dot(n, -Ld), 0.0), 3.0);
  float rim = 1.0 - smoothstep(0.0, 9.0, t);
  float line = 1.0 - smoothstep(0.0, 1.6, t);
  col += vec3(1.0) * (s1 * 0.9 * rim + line * (0.35 + 0.5 * s1)) * (1.0 + 1.4 * en);
  col -= vec3(0.17, 0.15, 0.11) * (s2 * rim * 0.9 + line * 0.12);

  float a = 1.0 - smoothstep(-0.8, 0.8, d);
  gl_FragColor = vec4(mix(base, col, a), 1.0);
}`;

  function sh(type, s) { const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : (console.warn(gl.getShaderInfoLog(o)), null); }
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG); if (!vs || !fs) return fail('shader');
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return fail(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(pr, 'aPos'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(a => gl.texParameteri(gl.TEXTURE_2D, a[0], a[1]));
  const U = n => gl.getUniformLocation(pr, n), uTex = U('uTex'), uRes = U('uRes'), uDens = U('uDens'), uT = U('uT'), uR = U('uR'), uRr = U('uRr'), uE = U('uE'), uM = U('uM'), uHero = U('uHero');
  gl.uniform1i(uTex, 0);

  const SEL = []; // v69: los elementos ya no se dibujan en WebGL (evita ghosting); la capa solo desenfoca el fondo del hero
  const eo = el => { let o = 1; while (el && el !== document.body) { o *= parseFloat(getComputedStyle(el).opacity); el = el.parentElement; } return o; };
  let mx = -99, my = -99, lt = performance.now() / 1000;
  document.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  ['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, e => { if (e.pointerType === 'touch') { mx = -99; my = -99; } }, { passive: true }));

  function frame() {
    try {
      const W = innerWidth, H = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, W < 760 ? 1.5 : 2), now = performance.now() / 1000, dt = Math.min(.05, now - lt); lt = now, hero = document.getElementById('hero'), ho = hero ? eo(hero) : 0;
      if (gc.width !== Math.round(W * dpr) || gc.height !== Math.round(H * dpr)) { gc.width = Math.round(W * dpr); gc.height = Math.round(H * dpr); gl.viewport(0, 0, gc.width, gc.height); }
      const R = new Float32Array(64), Rr = new Float32Array(16), E = new Float32Array(16); let n = 0;
      SEL.forEach(s => document.querySelectorAll(s).forEach(el => {
        if (n >= 16 || el.closest('.card, #story') || (document.body.classList.contains('about') && el.matches('.btn'))) return; const b = el.getBoundingClientRect(); if (b.width < 4 || b.height < 4 || b.bottom < -40 || b.top > innerHeight + 40) return;
        const cs = getComputedStyle(el); if ((document.body.classList.contains('heroing') || document.body.classList.contains('deep')) && el.closest('#bar')) return; if (el.matches('.mb') && b.width < 28) return; if (cs.display === 'none' || cs.visibility === 'hidden' || eo(el) < .05) return;
        const inside = mx >= b.left && mx <= b.right && my >= b.top && my <= b.bottom; let s = el._e || 0, v = el._v || 0; v += ((inside ? 1 : 0) - s) * 170 * dt; v *= Math.exp(-13 * dt); s += v * dt; el._e = s; el._v = v; // resorte: crece con un leve rebote
        const sp = Math.max(0, s), g = (b.width > 420 || b.height > 220 ? 3 : 6) * sp + (el.classList.contains('on') ? 2 : 0), w = b.width + 2 * g, h = b.height + 2 * g;
        R.set([b.left - g, b.top - g, w, h], n * 4); Rr[n] = Math.min(parseFloat(cs.borderTopLeftRadius) || 20, h / 2, w / 2) + g * .5; E[n] = Math.min(1, sp); n++;
      }));
      if (bgDraw) bgDraw(now);
      if (src.width && src.height) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); }
      gl.uniform2f(uRes, W, H); gl.uniform1f(uDens, dpr); gl.uniform1f(uT, now % 1000);
      gl.uniform4fv(uR, R); gl.uniform1fv(uRr, Rr); gl.uniform1fv(uE, E); gl.uniform2f(uM, mx, my); gl.uniform1f(uHero, ho);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      document.body.classList.add('gl');
      requestAnimationFrame(frame);
    } catch (err) { fail(err); }
  }
  requestAnimationFrame(frame);
})();
