/* Datos · Marea de resonancias (Barrio Puerto)
   Fuente: «Base de Datos – Variación Sonora Barrio Puerto» (Grupo 2 · Taller de Diseño de Servicios 2026).
   · FICHAS  = fichas del Barrio Puerto + las de Buenos Aires (tabla general BA)
   · ENCUESTAS = 20 encuestas de percepción (tercera página del PDF)
   Criterios de preparación (documentados también en about.html):
   · Tipo de fuente: V vehicular · H humana · C comercial · M portuaria/mecánica · N natural. La categoría «comercial»
     separa captadores, música de locales, cortinas y locatarios de las voces humanas (8 fichas recategorizadas por el equipo).
   · Las fichas BP-17, BP-18 y BP-19 son UNA misma medición (15:30, Muelle Prat; 10,0 / 69,5 / 121,4 dB) con tres fuentes
     simultáneas: cuentan en las tres categorías de fuente, pero sus decibeles y flujos se cuentan una sola vez.
   · Agrado de encuestas: «me gusta» = 2 · «me gusta un poco» = 1 · «me da igual» = 0 · «me incomoda un poco» = −1.
   · Flujos: bajo/medio/alto → 1/2/3.
   · Buenos Aires (lugares homólogos): 8 mediciones de terreno con dB propios, tomadas de «tabla-general_BA_registros-grupo2» (19 y 21/11/2026):
     Plaza de Mayo (BA-PI-11, BA-PI-01, BA-PI-12) y Puente de la Mujer (BA-M-11, BA-M-02, BA-M-12, BA-M-13, BA-M-14).
     Se tratan como mediciones normales. Cada tipo de fuente de la ficha es una fila; la primera es la predominante.
     La medición BA-M-14 (00:20, noche) se ubica al final del recorrido horario (hora 24:20) y queda fuera de las franjas mañana/tarde/hora punta.
     Los rankings y hallazgos del «Barrio Puerto» usan solo los cuatro lugares de Valparaíso; Buenos Aires se compara lugar por lugar.
     Sin encuestas de agrado en Buenos Aires. */
const SECT = ['Muelle Prat', 'Plaza Sotomayor', 'Calle Serrano', 'Plaza Echaurren', 'Plaza de Mayo', 'Puente de la Mujer'];
const SHORT = ['Prat', 'Sotomayor', 'Serrano', 'Echaurren', 'Mayo', 'Puente'];
const APRA = 'Mapa Estratégico de Ruido 2018 · Agencia de Protección Ambiental (APrA), Gobierno de la Ciudad de Buenos Aires';
const PRED = {}; // fuente predominante fijada por el equipo cuando las fichas empatan (hoy ninguna: se cuenta por fichas)
const NS = SECT.length;
const SUB = ['borde abierto al mar', 'explanada de bordes duros', 'corredor encerrado', 'claro rodeado de muros', 'plaza abierta junto a avenida', 'borde costero junto al río'];
const QUOTE = [
  'Aunque estén varias cosas pasando... resulta muy agradable estar aquí tranquilo y ver el mar.',
  'Son muchos sonidos pasando a la vez.',
  'En Serrano hay más tranquilidad comparado con el tránsito y bocinazos de Sotomayor.',
  'Bajó el sonido ambiental, más viento.',
  'Hay cambios repentinos según el tránsito: con el semáforo en rojo los autos se detienen y se escucha un lapso de silencio.',
  'La gente pasa muy a la rápida, todos están al paso; es una zona agradable para pasar el rato en la sombra, pero es muy al paso.'
];
// FICHAS: [hora, sector (0-4), dB mín, dB prom, dB máx, flujo peatonal 1-3, flujo vehicular 1-3, tipo de fuente, fuente, fenómeno observado, intensidad percibida 1-5 (solo si no hay dB), código]
const FICHAS = [
  ['14:40', 0, 53, 64, 79, 2, 1, 'M', 'Ruido portuario / camiones', 'Competencia entre fondo difuso portuario y picos mecánicos'],
  ['10:08', 0, 50, 54, 70, 1, 2, 'M', 'Camiones portuarios', 'Ampliación sonora al salir de barreras TPV'],
  ['17:36', 0, 58, 67, 89, 3, 2, 'M', 'Motores de camión', 'Gran barco atracado genera sonidos inusuales de carga'],
  ['17:15', 0, 25, 65.4, 80.5, 3, 2, 'H', 'Lancheros gritando', 'Gritos de ofertas rompen el murmullo'],
  ['14:56', 1, 62, 72, 80, 3, 3, 'V', 'Tránsito / micros', 'El semáforo dirige el volumen de las conversaciones'],
  ['10:35', 1, 54, 55, 75, 2, 3, 'V', 'Vehículos', 'Pausas en rojo dejan oír pisadas y banda lejana'],
  ['17:34', 1, 25, 71.1, 84.5, 2, 3, 'V', 'Tránsito pesado / bocinazos', 'Caja de resonancia: fachadas continuas amplifican'],
  ['15:09', 2, 57, 62, 68, 1, 1, 'V', 'Rodaje de adoquín', 'Tubo sonoro íntimo; el adoquín frena al auto'],
  ['10:51', 2, 50, 55, 60, 2, 1, 'C', 'Música y conversaciones', 'Poco tránsito: se oyen carretilla y gaviotas'],
  ['15:17', 3, 66, 69, 72, 2, 1, 'H', 'Voces / canto', 'Pileta seca proyecta el canto en el anillo de bancas'],
  ['11:02', 3, 55, 62, 77, 2, 1, 'H', 'Música y conversaciones', 'Desplazarse al interior atenúa el ruido de esquinas'],
  ['15:40', 0, 59, 66, 81, 3, 1, 'H', 'Turistas / zumbido portuario', 'El pico cambia de origen mecánico a grupo humano'],
  ['11:30', 0, 56, 62, 78, 3, 1, 'H', 'Conversaciones de grupo', 'Más voces atenúan la atención a los camiones'],
  ['15:55', 1, 62, 73, 87, 3, 3, 'V', 'Micros / comercio', 'El comercio de esquina marca el pico'],
  ['16:06', 2, 65, 74, 86, 1, 3, 'V', 'Rodaje rápido sobre adoquín', 'Pasillo íntimo → corredor exprés'],
  ['16:16', 3, 65, 70, 79, 2, 1, 'H', 'Voces / camiones de esquina', 'La curva obliga paso lento; las voces sostienen el nivel'],
  ['15:30', 0, 10, 69.5, 121.4, 3, 2, 'H', 'Voces de lancheros', 'Ofertas de paseos dominan la explanada (142 peatones/10 min)'],
  ['15:30', 0, 10, 69.5, 121.4, 3, 2, 'V', 'Tránsito vehicular / camión', 'Eventos móviles de alta intensidad (26 vehículos/10 min)'],
  ['15:30', 0, 10, 69.5, 121.4, 3, 2, 'M', 'Grúas y maquinaria', 'Fondo mecánico continuo'],
  ['16:40', 2, 66, 76, 87, 2, 3, 'V', 'Traqueteo vehicular', 'Calzada estrechada obliga marcha rápida peatonal'],
  ['17:10', 0, 56, 69, 82, 3, 1, 'C', 'Captadores / motores náuticos', 'El altoparlante polariza al público hacia la baranda'],
  ['17:40', 1, 64, 75, 85, 3, 3, 'V', 'Tránsito pesado hora punta', 'Atochamiento genera eco envolvente'],
  ['18:05', 2, 61, 72, 81, 3, 3, 'C', 'Cierre de cortinas metálicas', 'Peak seco marca el apagado comercial'],
  ['18:30', 0, 58, 70, 83, 1, 3, 'M', 'Camiones / alarmas de retroceso', 'El muelle pasa de turístico a cierre industrial'],
  ['18:50', 1, 67, 78, 88, 3, 3, 'V', 'Congestión de buses', 'Colapso acústico en paraderos; se anula la condición cívica'],
  ['10:45', 2, 53, 59, 67, 2, 1, 'C', 'Intercambio vocal de locatarios', 'Abastecimiento matinal y desaceleración de furgón'],
  ['11:15', 0, 54, 63, 74, 2, 1, 'M', 'Actividad portuaria / camiones', 'Casco de barcos refleja el sonido hacia la explanada'],
  ['11:40', 1, 58, 71, 81, 3, 3, 'V', 'Micros en aceleración', 'Losas deterioradas amplifican de forma percusiva'],
  ['11:55', 2, 55, 62, 70, 3, 1, 'C', 'Murmullo de transeúntes', 'Zaguanes funcionan como cámaras de eco'],
  ['12:15', 0, 52, 60, 69, 2, 1, 'H', 'Guías con megáfono', 'La voz reorganiza espacialmente al grupo'],
  ['12:35', 1, 54, 64, 73, 2, 2, 'N', 'Fuente de agua / tránsito difuso', 'La fuente delimita un radio de enmascaramiento'],
  ['11:00', 0, 55, 75, 79, 1, 1, 'H', 'Canto / intervención musical', 'La música delimita el radio y atrae público'],
  ['11:20', 1, 59, 77, 81, 3, 3, 'V', 'Frenos de micros / sirena', 'Paso de ambulancia quiebra el fondo'],
  ['11:35', 2, 54, 66, 78, 1, 1, 'C', 'Música de locales', 'Superposición gradual entre fachadas continuas'],
  ['15:00', 0, 56, 65, 77, 1, 2, 'H', 'Títeres y música', 'Risas infantiles concentran la atención vecinal'],
  ['15:15', 1, 60, 75, 87, 3, 3, 'V', 'Bocinazos', 'Bocinazos simultáneos superponen el fondo'],
  ['13:50', 2, 54, 62, 70, 2, 1, 'C', 'Captadores de restaurantes', 'Captadores compiten entre sí ofreciendo menús'],
  ['09:40', 0, 54, 62, 70, 1, 1, 'M', 'Camiones y persona cantando', 'Alternan con la actividad de borde costero'],
  ['10:00', 1, 60, 69, 82, 1, 1, 'V', 'Frenos, micros y bocinazos', 'Dominan la esquina con Cochrane'],
  ['10:18', 2, 54, 62, 68, 1, 1, 'C', 'Música de locales', 'Música y paso peatonal a la altura de pasaje Goñi'],
  // Buenos Aires · BA-PI-11 · Plaza de Mayo · 19/11/2026 10:30–10:40 · 5 fuentes simultáneas · dB medidos (59 / 70 / 84)
  ['10:30', 4, 59, 70, 84, 2, 3, 'V', 'Colectivos frenando y arrancando', 'Soleado, viento bajo. Actividades: tránsito peatonal, trabajo en vía pública, turismo / fotografía.', 4, 'BA-PI-11'],
  ['10:30', 4, 59, 70, 84, 2, 3, 'H', 'Personas', 'Fuente secundaria registrada en la ficha (humana); sin descripción detallada.', 4, 'BA-PI-11'],
  ['10:30', 4, 59, 70, 84, 2, 3, 'N', 'Naturaleza', 'Fuente secundaria registrada en la ficha (natural); sin descripción detallada.', 4, 'BA-PI-11'],
  // Buenos Aires · BA-M-11 · Puente de la Mujer · 19/11/2026 11:30–11:40 · 4 fuentes simultáneas · dB medidos (57 / 66 / 78)
  ['11:30', 5, 57, 66, 78, 2, 1, 'V', 'Vehículos en la ciudad', 'Soleado, viento medio. Actividades: tránsito peatonal, trabajo en vía pública.', 2, 'BA-M-11'],
  ['11:30', 5, 57, 66, 78, 2, 1, 'H', 'Personas', 'Fuente secundaria registrada en la ficha (humana); sin descripción detallada.', 2, 'BA-M-11'],
  ['11:30', 5, 57, 66, 78, 2, 1, 'N', 'Naturaleza', 'Fuente secundaria registrada en la ficha (natural); sin descripción detallada.', 2, 'BA-M-11'],
  ['11:30', 5, 57, 66, 78, 2, 1, 'M', 'Maquinaria', 'Fuente secundaria registrada en la ficha (portuaria / mecánica); sin descripción detallada.', 2, 'BA-M-11'],
  // Buenos Aires · BA-M-02 · Puente de la Mujer · 19/11/2026 12:29–12:40 · 4 fuentes simultáneas · dB medidos (62 / 73 / 84)
  ['12:29', 5, 62, 73, 84, 2, 1, 'V', 'Vehículos en la ciudad', 'Zumbido constante de autos que llega desde la ciudad, como un aura de fondo', 4, 'BA-M-02'],
  ['12:29', 5, 62, 73, 84, 2, 1, 'M', 'Trabajos en el puente', 'Maquinaria que se siente de a momentos', null, 'BA-M-02'],
  ['12:29', 5, 62, 73, 84, 2, 1, 'H', 'Gente caminando y conversando', 'La gente pasa muy a la rápida, todos van de paso', 2, 'BA-M-02'],
  ['12:29', 5, 62, 73, 84, 2, 1, 'N', 'Aves', 'Los árboles cercanos atraen aves que a ratos llenan el ambiente con su canto', 2, 'BA-M-02'],
  // Buenos Aires · BA-PI-01 · Plaza de Mayo · 19/11/2026 12:50–13:00 · 3 fuentes simultáneas · dB medidos (61 / 72 / 85)
  ['12:50', 4, 61, 72, 85, 3, 3, 'V', 'Bocinazo', 'Un auto tocó la bocina y dos personas se dieron vuelta a mirar', 2, 'BA-PI-01'],
  ['12:50', 4, 61, 72, 85, 3, 3, 'V', 'Autos pasando', 'Con el semáforo en rojo los autos se detienen y se oye un lapso de silencio', 4, 'BA-PI-01'],
  ['12:50', 4, 61, 72, 85, 3, 3, 'H', 'Personas hablando', 'Flujo peatonal alto; sin reacciones visibles ante el tránsito de la calle de atrás', 2, 'BA-PI-01'],
  // Buenos Aires · BA-M-12 · Puente de la Mujer · 19/11/2026 16:10–16:20 · 5 fuentes simultáneas · dB medidos (60 / 70 / 82)
  ['16:10', 5, 60, 70, 82, 3, 1, 'H', 'Conversaciones de turistas', 'Soleado, viento alto. Actividades: turismo / fotografía, conversaciones, tránsito peatonal, atención en locales.', 3, 'BA-M-12'],
  ['16:10', 5, 60, 70, 82, 3, 1, 'V', 'Vehículos', 'Fuente secundaria registrada en la ficha (vehicular); sin descripción detallada.', 3, 'BA-M-12'],
  ['16:10', 5, 60, 70, 82, 3, 1, 'M', 'Maquinaria', 'Fuente secundaria registrada en la ficha (portuaria / mecánica); sin descripción detallada.', 3, 'BA-M-12'],
  ['16:10', 5, 60, 70, 82, 3, 1, 'N', 'Naturaleza', 'Fuente secundaria registrada en la ficha (natural); sin descripción detallada.', 3, 'BA-M-12'],
  // Buenos Aires · BA-M-13 · Puente de la Mujer · 19/11/2026 17:16–17:26 · 5 fuentes simultáneas · dB medidos (61 / 71 / 85)
  ['17:16', 5, 61, 71, 85, 3, 2, 'C', 'Gente conversando en terrazas', 'Nublado, viento medio. Actividades: atención en locales, conversaciones, descanso / espera, turismo / fotografía.', 3, 'BA-M-13'],
  ['17:16', 5, 61, 71, 85, 3, 2, 'H', 'Personas', 'Fuente secundaria registrada en la ficha (humana); sin descripción detallada.', 3, 'BA-M-13'],
  ['17:16', 5, 61, 71, 85, 3, 2, 'V', 'Vehículos', 'Fuente secundaria registrada en la ficha (vehicular); sin descripción detallada.', 3, 'BA-M-13'],
  ['17:16', 5, 61, 71, 85, 3, 2, 'N', 'Naturaleza', 'Fuente secundaria registrada en la ficha (natural); sin descripción detallada.', 3, 'BA-M-13'],
  // Buenos Aires · BA-PI-12 · Plaza de Mayo · 19/11/2026 17:45–17:55 · 5 fuentes simultáneas · dB medidos (63 / 74 / 87)
  ['17:45', 4, 63, 74, 87, 3, 3, 'V', 'Autos pasando', 'Soleado, viento medio. Actividades: tránsito peatonal, comercio ambulante, turismo / fotografía, conversaciones.', 4, 'BA-PI-12'],
  ['17:45', 4, 63, 74, 87, 3, 3, 'C', 'Comercio y música', 'Fuente secundaria registrada en la ficha (comercial); sin descripción detallada.', 4, 'BA-PI-12'],
  ['17:45', 4, 63, 74, 87, 3, 3, 'H', 'Personas', 'Fuente secundaria registrada en la ficha (humana); sin descripción detallada.', 4, 'BA-PI-12'],
  // Buenos Aires · BA-M-14 · Puente de la Mujer · 21/11/2026 00:20–00:30 · 4 fuentes simultáneas · dB medidos (70 / 82 / 96)
  ['00:20', 5, 70, 82, 96, 3, 1, 'C', 'Música de bares', 'Nublado, viento bajo. Actividades: atención en locales, conversaciones, interacción / juego, música / espectáculo callejero.', 5, 'BA-M-14'],
  ['00:20', 5, 70, 82, 96, 3, 1, 'H', 'Personas', 'Fuente secundaria registrada en la ficha (humana); sin descripción detallada.', 5, 'BA-M-14'],
];
// ENCUESTAS: [sector (0-3; Plaza de Mayo aún sin encuestas), agrado (−1…2), dB medido durante la encuesta (si se registró)]
const ENCUESTAS = [[0,1,71.4],[0,1,75],[3,1,54],[3,-1,75.4],[2,0,74.3],[0,1],[0,2],[0,1],[0,1],[1,-1],[1,-1],[1,0],[1,-1],[1,-1],[2,0],[2,2],[2,2],[2,2],[0,2],[1,2]];
