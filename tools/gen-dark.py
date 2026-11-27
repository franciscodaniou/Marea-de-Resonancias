#!/usr/bin/env python3
"""Genera dark.css a partir de style.css.
El modo oscuro invierte la página (invert + hue-rotate 180°); eso voltea también las luces y sombras del vidrio
(brillos especulares quedan negros y sombras blancas). Aquí se copian solo las declaraciones de sombra y borde
(box-shadow, text-shadow, border*, outline*) intercambiando la polaridad de los colores casi blancos / casi oscuros:
un brillo blanco pasa a negro (que el filtro vuelve blanco) y una sombra oscura pasa a blanca (que el filtro vuelve oscura).
Los colores intermedios (tintes rojo/azul de los bordes) no se tocan. Ejecutar de nuevo cada vez que cambie style.css:  python3 tools/gen-dark.py"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'style.css').read_text()
src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
PROPS = re.compile(r'^(box-shadow|text-shadow|border(-[a-z]+)*|outline(-[a-z]+)?|-webkit-box-shadow)$')
col = re.compile(r'rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)|#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
def swap(m, dark=.45):
    if m.group(5):
        h = m.group(5); h = ''.join(c*2 for c in h) if len(h) == 3 else h; r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16); a = 1.0
    else:
        r, g, b = float(m.group(1)), float(m.group(2)), float(m.group(3)); a = float(m.group(4)) if m.group(4) is not None else 1.0
    L = (.2126 * r + .7152 * g + .0722 * b) / 255
    if L > .75: return f'rgba(0,0,0,{a:g})'
    if L < dark: return f'rgba(255,255,255,{a:g})'
    return m.group(0)
def split_decls(body):
    out, depth, cur = [], 0, ''
    for ch in body:
        if ch == '(': depth += 1
        elif ch == ')': depth -= 1
        if ch == ';' and depth == 0: out.append(cur); cur = ''
        else: cur += ch
    if cur.strip(): out.append(cur)
    return out
def parse(s, i=0, end=None):
    """devuelve lista de (prelude, body|None-> lista de hijos)"""
    out = []; n = len(s) if end is None else end
    while i < n:
        j = s.find('{', i)
        if j < 0 or j >= n: break
        pre = s[i:j].strip(); depth = 1; k = j + 1
        while k < n and depth:
            if s[k] == '{': depth += 1
            elif s[k] == '}': depth -= 1
            k += 1
        body = s[j + 1:k - 1]
        out.append((pre, body)); i = k
    return out
def build(rules):
    res = []
    for pre, body in rules:
        if pre.startswith('@font-face'): continue
        if pre.startswith('@'):
            kids = build(parse(body))
            if kids and not pre.startswith('@keyframes'): res.append(f'{pre}{{{kids}}}')
            continue
        ds = []
        for d in split_decls(body):
            if ':' not in d: continue
            p, v = d.split(':', 1); p = p.strip()
            if PROPS.match(p) and ('rgb' in v or '#' in v):
                imp = '!important' if '!important' in v else ''
                f = swap if p.endswith('shadow') else (lambda m: swap(m, .3))  # bordes/contornos: los tonos medios (olivas de líneas, chevrons, puntos) no se invierten
                v2 = col.sub(f, v.replace('!important', '').strip())
                ds.append(f'{p}:{v2}{imp}')
            elif p in ('backdrop-filter', '-webkit-backdrop-filter'):  # sin saturate/brightness: sobre el fondo azul tiñen el vidrio (tras el filtro se ve marrón); el blur se conserva
                imp = '!important' if '!important' in v else ''
                v2 = re.sub(r'\s*(saturate|brightness)\([^)]*\)', '', v.replace('!important', '')).strip()
                ds.append(f'{p}:{v2}{imp}')
            elif p in ('box-shadow', 'text-shadow'):  # none / reinicios conservan el orden de cascada
                ds.append(f'{p}:{v.strip()}')
        if ds: res.append(f'{pre}{{{";".join(ds)}}}')
    return ''.join(res)
css = build(parse(src))
(root / 'dark.css').write_text('/* generado por tools/gen-dark.py — no editar a mano */\n' + css.replace('}', '}\n'))
print(len(css), 'bytes')
