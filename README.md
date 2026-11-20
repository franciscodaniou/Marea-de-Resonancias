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
| `story.js` | Contraste por lugar y franja, gráficas que se transforman, estadísticas y consola (desde `data.js`) |
| `audio.js` | Sonido por fuentes (prototipo opcional, síntesis Web Audio; se quita borrando el archivo y su `<script>`) |
| `glass.js` | Capa WebGL del glassmorfismo (con respaldo en CSS) |
| `style.css` | Estilos y diseño responsivo |
| `data.js` / `data.json` | Datos de 47 fichas de terreno (40 mediciones únicas) y 20 encuestas, con fuente y criterios; incluye Plaza de Mayo (BA-PI-01) y Puente de la Mujer (BA-M-02), Buenos Aires, ambos sin dB |

## Codificación visual
Malla orgánica (tubo deformado por ruido Perlin) = el lugar: color = fuente predominante, largo = hora (09:40 → 18:50), relieve = dB.
Ficha = punto del color de su fuente (carril alrededor de la malla) que ilumina una zona: ancho = rango dB, pulso y relieve = dB promedio.
Puntos lentos = personas y estelas rápidas = vehículos (cantidad y velocidad según el flujo), sobre la malla.
Movimiento más errático = menor agrado en las encuestas. Anillo = respuestas de agrado (incomoda · da igual · gusta un poco · gusta).

## Recorrido (scroll)
1. Marea total: todas las fichas sobre una misma malla (tocar, filtrar por franja o fuente, girar con el mouse).
2. Sectores: la marea se disuelve en seis mallas lado a lado; clic expande un sector (teclas 1–6, `Esc` vuelve).
3. Contraste y comparación (recorrido): título y leyenda fijos; cada lugar dura tres tramos de scroll (mañana → tarde → hora punta) que filtran la malla; luego pasa al siguiente lugar y reinicia en mañana. Al salir se restaura el filtro previo.
3b. Modo comparar: se eligen dos lugares (A, B) y una franja; mallas con la misma escala, barras divergentes (dB, máximo, flujos, agrado, n) y lectura automática. El agrado no se filtra por franja (la encuesta no registra hora).
4. Gráficas que se transforman: intensidad (por lugar / por hora) y agrado (agrado vs dB / respuestas), con el mismo botón; partitura (cada ficha es una nota: línea = fuente, posición = hora, tamaño = dB; todo el barrio o por lugar).
5. Estadísticas y consola «Cómo funciona»: fuentes, flujos, picos y malla en vivo.

Navegación: indicador lateral de secciones, enlace que restaura la vista (`#sec=…&f=…&A=…&B=…&cf=…`) y atajos de teclado (← →, A/B, N/P, 1–6, ?). Anillos finos en las mallas = relieve de referencia (55–85 dB); anillo exterior = agrado.

Wireframes: `wireframe.svg/png` (escritorio) y `wireframe-movil.svg/png`.

## Datos
Fuente: «Base de Datos – Variación Sonora Barrio Puerto» (Grupo 2). Criterios de preparación (mediciones repetidas BP-17 a 19, valor atípico de 121,4 dB, recategorización «comercial», escala de agrado, instrumentos distintos) en `data.js` y en `about.html`. Pendiente: integrar Puente de la Mujer y Plaza de Mayo (Buenos Aires).

## Uso de IA
La IA (Claude, de Anthropic) apoyó la implementación técnica (canvas, shader WebGL, interfaz, pruebas). La pregunta, la selección de datos, la codificación de base y el punto de vista son del autor; el detalle está en `about.html`.

## Autor
Francisco Daniou · Taller de Diseño de Servicios 2026.
