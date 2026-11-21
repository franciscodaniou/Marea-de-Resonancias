# Marea de resonancias · atlas sonoro del Barrio Puerto

Visualización de datos interactiva del Taller de Diseño de Servicios 2026 (Escuela de Arquitectura y Diseño PUCV).
Responde a la pregunta: **¿cómo varían las fuentes y la intensidad del sonido en el Barrio Puerto según el lugar y la hora?**

- Proyecto grupal (wiki): https://wiki.ead.pucv.cl/Proyecto_de_Visualización_-_Grupo_2
- Proyecto individual (wiki): https://wiki.ead.pucv.cl/Visualización_de_Datos_Interactiva_TDS_2026_-_Francisco_Daniou

## Cómo verlo
Es un sitio estático, sin dependencias ni compilación.
- En línea: https://franciscodaniou.github.io/Marea-de-Resonancias/ (GitHub Pages, rama `main`, carpeta `/root`).
- En local: abrir `index.html` (o `python3 -m http.server` en esta carpeta). Funciona en Safari, Firefox y Chromium; en móvil hay un layout propio.

## Estructura
| Archivo | Contenido |
|---|---|
| `index.html` | Una sola pantalla de inicio (pregunta, descripción, «Explora el Barrio Puerto») y visualización |
| `about.html` | Estudio, hallazgos, criterios de datos y uso de IA |
| `app.js` | Marea orgánica (canvas 2D), escenas por scroll, interacción, panel, leyenda |
| `story.js` | Hallazgos («Lo que dice el Barrio Puerto» y «Lectura de los datos»), recorrido por lugar y hora, comparación A/B, gráficas que se transforman, estadísticas y consola (desde `data.js`) |
| `vita.js` | Vitalidad: contadores y barras que se animan al entrar en pantalla (`data-n`, `data-w`, `data-reveal`); respeta `prefers-reduced-motion`. Las gráficas SVG (`story.js`) crecen en cascada al entrar en pantalla y el anillo de agrado se dibuja al acoplarse |
| `audio.js` | Sonido por fuentes (prototipo opcional, síntesis Web Audio; se quita borrando el archivo y su `<script>`) |
| `glass.js` | Capa WebGL del glassmorfismo (con respaldo en CSS) |
| `style.css` | Estilos y diseño responsivo |
| `data.js` / `data.json` | Datos de 50 mediciones de terreno (41 únicas, 38 con dB) y 2 referencias APrA y 20 encuestas, con fuente y criterios; incluye Plaza de Mayo (BA-PI-01) y Puente de la Mujer (BA-M-02), Buenos Aires, con dB solo como referencia oficial (APrA 2018, modelo) |

## Codificación visual
Malla orgánica (tubo deformado por ruido Perlin) = el lugar: color = fuente predominante, largo = hora (09:40 → 18:50), relieve = dB.
Medición = punto del color de su fuente (carril alrededor de la malla) que ilumina una zona: ancho = rango dB, pulso y relieve = dB promedio.
Puntos lentos = personas y estelas rápidas = vehículos (cantidad y velocidad según el flujo), sobre la malla.
Movimiento más errático = menor agrado en las encuestas. Anillo = respuestas de agrado (incomoda · da igual · gusta un poco · gusta).

## Recorrido (scroll)
1. **El Barrio Puerto:** la pregunta orientadora como título, una respuesta corta y una sola malla con todas las mediciones (tocar, filtrar por «Hora del día» o «Fuente», girar con el mouse).
2. **Sectores:** la malla se disuelve en seis mallas lado a lado, cada una con dB promedio en barra, «más ruidoso / más tranquilo», fuente y agrado. Clic expande el sector en una tarjeta con dB, fuentes, agrado, flujos, perfil por hora y el registro de cada medición (teclas 1–6, `Esc` vuelve).
3. **Hallazgos:** «Lo que dice el Barrio Puerto» (según el lugar, la fuente y la hora), gráfico de dB por hora y «Lectura de los datos», la tesis del autor: el ruido se juzga por qué lo produce, no por cuántos decibeles tiene.
4. **Lugares, a cada hora:** título y leyenda fijos; cada lugar dura tres tramos de scroll (mañana → tarde → hora punta) que filtran la malla.
5. **Comparar:** dos lugares (A, B) y una hora del día; mallas con la misma escala, barras divergentes y lectura automática. El agrado no se filtra por hora (la encuesta no la registra).
6. **Gráficas que se transforman:** intensidad (por lugar / por hora) y agrado (frente a dB / respuestas), con el mismo botón; partitura (cada medición es una nota).
7. **Estadísticas y consola «Cómo funciona».**

Navegación: indicador lateral de secciones, enlace que restaura la vista (`#sec=…&f=…&A=…&B=…&cf=…`) y atajos de teclado (← →, A/B, N/P, 1–6, ?). Anillos finos en las mallas = relieve de referencia (55–85 dB); anillo exterior = agrado.

## Cómo se llegó al modelo
1. Se partió de la pregunta orientadora y de un criterio del estudio grupal: la forma del espacio filtra el sonido, así que cada lugar es una malla y no una barra.
2. Primero un solo conjunto («marea total») y luego seis figuras lado a lado, para que la diferencia entre lugares se vea de un vistazo.
3. Se probó con personas ajenas al tema: la pregunta pasó a ser el título, se agregó una respuesta corta y los hallazgos quedaron antes del detalle.
4. Se unificó el estilo de las tarjetas (sector y comparación) y se cuidó que el vidrio no tape el modelo de fondo.
5. Buenos Aires se integró sin dB propio: aparece por fuente y flujos, y su dB es una referencia oficial modelada (APrA 2018) con ficha de procedencia, fuera de promedios y rankings.

Wireframes: `wireframe.svg/png` (escritorio) y `wireframe-movil.svg/png`, con los seis sectores.

## Datos
Fuente: «Base de Datos – Variación Sonora Barrio Puerto» (Grupo 2). Criterios de preparación (mediciones repetidas BP-17 a 19, valor atípico de 121,4 dB, recategorización «comercial», escala de agrado, instrumentos distintos) en `data.js` y en `about.html`. Plaza de Mayo y Puente de la Mujer (Buenos Aires) se integraron sin dB.

## Uso de IA
La IA (Claude, de Anthropic) apoyó la implementación técnica (canvas, shader WebGL, interfaz, pruebas). La pregunta, la selección de datos, la codificación de base y el punto de vista son del autor; el detalle está en `about.html`.

## Autor
Francisco Daniou · Taller de Diseño de Servicios 2026.

## Referencia de Buenos Aires: APrA 2018 (aviso)
- Plaza de Mayo y Puente de la Mujer no tienen dB propios. Su cifra en el modelo viene del Mapa Estratégico de Ruido 2018 (APrA, GCBA): modelo de simulación, solo tránsito vehicular y ferroviario, bandas de 5 dB.
- Plaza de Mayo: 70–75 dB de día. Puente de la Mujer: 65–70 dB de día. Cruce propio con los polígonos del CSV en ~150 m alrededor del lugar.
- Se muestra como dos fichas aparte («APrA 2018 · día · modelo» y «· noche · modelo»), con rango de banda y procedencia; no entra en promedios, rankings, hallazgos ni gráficos por hora. En «Cada lugar, a cada hora», Plaza de Mayo y Puente de la Mujer recorren Día → Noche en vez de mañana/tarde/hora punta.
- Detalle completo en `about.html#apra` y en `wiki-referencia-apra.md`.
