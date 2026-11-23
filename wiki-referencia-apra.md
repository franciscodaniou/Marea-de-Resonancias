# Referencia de Buenos Aires: APrA 2018

**Aviso:** las mediciones propias de Plaza de Mayo y Puente de la Mujer no tienen decibeles. El dB que muestra el modelo para esos lugares es una referencia oficial modelada, no una medición del equipo.

## Origen
- Mapa Estratégico de Ruido 2018, Agencia de Protección Ambiental (APrA), Gobierno de la Ciudad de Buenos Aires.
- Archivos usados: `medicion_de_ruido_diurno_2018.csv` y `medicion_de_ruido_nocturno_2018.csv` (polígonos WKT con `rango_db`, bandas de 5 dB).
- Modelo de simulación acústica validado con mediciones de largo plazo (5 estaciones, 162 puntos). Solo fuentes móviles: vehículos y trenes. Período diurno 07:01–22:00; nocturno 22:01–07:00.

## Método de cruce
1. Se fijaron coordenadas aproximadas de cada lugar.
2. Se cruzó una rejilla de ~±150 m (25 × 25 puntos) con los polígonos (punto en polígono, con huecos).
3. Se tomó la banda diurna más frecuente.

| Lugar | Día | Noche |
|---|---|---|
| Plaza de Mayo | 70–75 dB | 65–70 dB |
| Puente de la Mujer | 65–70 dB | 55–60 dB (30–50 hacia el agua) |

## Tratamiento en el sitio
- Dos fichas aparte en el registro de cada lugar: «APrA 2018 · día · modelo» y «· noche · modelo», con rango de banda y procedencia.
- En el recorrido «Cada lugar, a cada hora», estos dos lugares pasan de Día a Noche al hacer scroll (número, barra, relieve y luz de la malla); los demás recorren mañana, tarde y hora punta.
- Etiqueta «modelo APrA» en el dB de la vista general y de las tarjetas.
- No entra en «más ruidoso/más tranquilo», hallazgos del Barrio Puerto, promedios por hora ni gráficos.

## Límites
- ~70 % de los puntos de la rejilla no cae en ningún polígono.
- La banda depende del punto elegido; datos de 2018.
- No incluye personas, música ni obras; no hay flujos.
