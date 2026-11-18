# Marea de resonancias · atlas sonoro del Barrio Puerto

Visualización de datos interactiva del Taller de Diseño de Servicios 2026 (Escuela de Arquitectura y Diseño PUCV).
Responde a la pregunta: **¿cómo varían las fuentes y la intensidad del sonido en el Barrio Puerto según el lugar y la hora?**

- Proyecto grupal (wiki): https://wiki.ead.pucv.cl/Proyecto_de_Visualización_-_Grupo_2
- Proyecto individual (wiki): https://wiki.ead.pucv.cl/Visualización_de_Datos_Interactiva_TDS_2026_-_Francisco_Daniou

## Cómo verlo
Es un sitio estático, sin dependencias ni compilación.
- En línea: GitHub Pages (Settings → Pages → rama `main`, carpeta `/root`).
- En local: abrir `index.html` (o `python3 -m http.server` en esta carpeta). Funciona en Safari, Firefox y Chromium; en móvil hay un layout propio.

## Estructura
| Archivo | Contenido |
|---|---|
| `index.html` | Inicio (dos secciones) y visualización |
| `about.html` | Estudio, hallazgos, criterios de datos y uso de IA |
| `app.js` | Marea orgánica (canvas 2D), escenas por scroll, interacción, panel, leyenda |
| `story.js` | Secciones de contraste y estadísticas (gráficas SVG desde `data.js`) |
| `glass.js` | Capa WebGL del vidrio líquido (con respaldo en CSS) |
| `style.css` | Estilos y diseño responsivo |
| `data.js` / `data.json` | Datos de las 40 fichas de terreno y 20 encuestas, con fuente y criterios |

## Codificación visual
Malla orgánica (tubo deformado por ruido Perlin) = el lugar: color = fuente predominante, largo = hora (09:40 → 18:50), relieve = dB.
Ficha = punto del color de su fuente (carril alrededor de la malla) que ilumina una zona: ancho = rango dB, pulso y relieve = dB promedio.
Puntos lentos = personas y estelas rápidas = vehículos (cantidad y velocidad según el flujo), sobre la malla.
Movimiento más errático = menor agrado en las encuestas.

## Recorrido (scroll)
1. Marea total: todas las fichas sobre una misma malla (tocar, filtrar, girar con el mouse).
2. Sectores: la marea se disuelve en cuatro mallas lado a lado; clic expande un sector (teclas 1–4, `Esc` vuelve).
3. Contraste y comparación: hallazgos por lugar con números y gráficas (`story.js`).
4. Estadísticas: fuentes, flujos, agrado y picos del barrio.

## Datos
Fuente: «Base de Datos – Variación Sonora Barrio Puerto» (Grupo 2). Criterios de preparación (mediciones repetidas BP-17 a 19, valor atípico de 121,4 dB, recategorización «comercial», escala de agrado, instrumentos distintos) en `data.js` y en `about.html`. Pendiente: integrar Puente de la Mujer y Plaza de Mayo (Buenos Aires).

## Uso de IA
La IA (Claude, de Anthropic) apoyó la implementación técnica (canvas, shader WebGL, interfaz, pruebas). La pregunta, la selección de datos, la codificación de base y el punto de vista son del autor; el detalle está en `about.html`.

## Autor
Francisco Daniou · Taller de Diseño de Servicios 2026.
