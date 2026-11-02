const sharp = require('sharp');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'landing');

async function createJpg(filename, svgString, width = 1200, height = 750) {
  const buffer = Buffer.from(svgString);
  await sharp(buffer)
    .resize(width, height)
    .jpeg({ quality: 92 })
    .toFile(path.join(outputDir, filename));
  console.log(`Generated: ${filename}`);
}

async function createPng(filename, svgString, width = 1200, height = 750) {
  const buffer = Buffer.from(svgString);
  await sharp(buffer)
    .resize(width, height)
    .png({ quality: 95 })
    .toFile(path.join(outputDir, filename));
  console.log(`Generated: ${filename}`);
}

async function run() {
  // 1. dashboard-barbero-dark.jpg
  const barberoSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#09090B"/>
    
    <!-- Top Header -->
    <rect width="1200" height="70" fill="#121215"/>
    <line x1="0" y1="70" x2="1200" y2="70" stroke="#27272A" stroke-width="1"/>
    
    <rect x="40" y="16" width="38" height="38" rx="10" fill="#18181B" stroke="#F59E0B" stroke-width="1.5"/>
    <text x="52" y="41" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#F59E0B">✂</text>
    
    <text x="90" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">PORTAL DEL BARBERO · MI AGENDA PRIVADA</text>
    
    <rect x="940" y="17" width="220" height="36" rx="10" fill="#18181B" stroke="#27272A"/>
    <circle cx="960" cy="35" r="5" fill="#10B981"/>
    <text x="975" y="40" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">Carlos Ruiz · Puesto #1</text>

    <!-- 3 Metrics -->
    <rect x="40" y="100" width="360" height="120" rx="18" fill="#121215" stroke="#27272A"/>
    <text x="65" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#A1A1AA">CITAS AGENDADAS HOY</text>
    <text x="65" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#FFFFFF">7 Citas</text>
    <text x="65" y="205" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#34D399">4 completadas · 3 pendientes</text>

    <rect x="420" y="100" width="360" height="120" rx="18" fill="#121215" stroke="#27272A"/>
    <text x="445" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#A1A1AA">MI COMISIÓN DEL DÍA (45%)</text>
    <text x="445" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#FBBF24">$168,750</text>
    <text x="445" y="205" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">COP acumulados hoy</text>

    <rect x="800" y="100" width="360" height="120" rx="18" fill="#121215" stroke="#27272A"/>
    <text x="825" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#A1A1AA">PROPINAS REGISTRADAS</text>
    <text x="825" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#38BDF8">$35,000</text>
    <text x="825" y="205" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#7DD3FC">100% tuyas en efectivo/transferencia</text>

    <!-- Schedule List Table -->
    <rect x="40" y="250" width="1120" height="460" rx="20" fill="#121215" stroke="#27272A"/>
    <text x="70" y="295" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">CRONOGRAMA DE TURNOS DE HOY</text>

    <!-- Row 1 -->
    <rect x="70" y="325" width="1060" height="65" rx="12" fill="#18181B" stroke="#27272A"/>
    <text x="95" y="362" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">09:00 AM</text>
    <text x="210" y="362" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">Andrés Gómez · 312 450 8890</text>
    <text x="510" y="362" font-family="system-ui, sans-serif" font-size="13" fill="#A1A1AA">Corte Degradado + Fade ($35,000)</text>
    <text x="790" y="362" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#FBBF24">Tu comisión: $15,750</text>
    <rect x="970" y="342" width="130" height="30" rx="8" fill="#065F46"/>
    <text x="990" y="362" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#A7F3D0">COMPLETADO ✓</text>

    <!-- Row 2 -->
    <rect x="70" y="405" width="1060" height="65" rx="12" fill="#1A180E" stroke="#D97706"/>
    <text x="95" y="442" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FBBF24">10:00 AM</text>
    <text x="210" y="442" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">Camilo Sossa · 320 890 1234</text>
    <text x="510" y="442" font-family="system-ui, sans-serif" font-size="13" fill="#FCD34D">Combo Elite (Corte + Barba) ($55,000)</text>
    <text x="790" y="442" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#FBBF24">Tu comisión: $24,750</text>
    <rect x="970" y="422" width="130" height="30" rx="8" fill="#D97706"/>
    <text x="998" y="442" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">EN TURNO 🔥</text>

    <!-- Row 3 -->
    <rect x="70" y="485" width="1060" height="65" rx="12" fill="#18181B" stroke="#27272A"/>
    <text x="95" y="522" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">11:30 AM</text>
    <text x="210" y="522" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">Felipe Restrepo · 310 998 4433</text>
    <text x="510" y="522" font-family="system-ui, sans-serif" font-size="13" fill="#A1A1AA">Ritual Barba Navaja ($25,000)</text>
    <text x="790" y="522" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#FBBF24">Tu comisión: $11,250</text>
    <rect x="970" y="502" width="130" height="30" rx="8" fill="#1E3A8A"/>
    <text x="1000" y="522" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#BFDBFE">CONFIRMADA</text>

    <!-- Row 4 -->
    <rect x="70" y="565" width="1060" height="65" rx="12" fill="#18181B" stroke="#27272A"/>
    <text x="95" y="602" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#71717A">01:00 PM</text>
    <text x="210" y="602" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#71717A">BLOQUEO DE DESCANSO</text>
    <text x="510" y="602" font-family="system-ui, sans-serif" font-size="13" fill="#71717A">Almuerzo / Pausa Activa (1h)</text>
    <rect x="970" y="582" width="130" height="30" rx="8" fill="#27272A"/>
    <text x="1008" y="602" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#A1A1AA">PAUSA</text>

    <!-- Row 5 -->
    <rect x="70" y="645" width="1060" height="50" rx="12" fill="#18181B" stroke="#27272A"/>
    <text x="95" y="677" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">02:30 PM</text>
    <text x="210" y="677" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">David Morales · 315 221 8877</text>
    <text x="510" y="677" font-family="system-ui, sans-serif" font-size="13" fill="#A1A1AA">Combo Elite ($55,000)</text>
    <rect x="970" y="655" width="130" height="30" rx="8" fill="#1E3A8A"/>
    <text x="1000" y="675" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#BFDBFE">CONFIRMADA</text>
  </svg>`;

  // 2. pagina-web-real-dark.png (1200x750)
  const webDarkSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#09090B"/>
    
    <!-- Navbar -->
    <rect width="1200" height="74" fill="#121215"/>
    <line x1="0" y1="74" x2="1200" y2="74" stroke="#27272A" stroke-width="1"/>
    
    <text x="50" y="47" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#FFFFFF">BARBERÍA <tspan fill="#F59E0B">ELITE</tspan></text>
    
    <text x="550" y="45" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#D4D4D8">Servicios</text>
    <text x="640" y="45" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#D4D4D8">Barberos</text>
    <text x="730" y="45" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#D4D4D8">Galería</text>
    <text x="810" y="45" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#D4D4D8">Ubicación</text>

    <rect x="960" y="16" width="190" height="42" rx="12" fill="#F59E0B"/>
    <text x="1000" y="42" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#09090B">AGENDAR CITA</text>

    <!-- Hero Showcase Section -->
    <rect x="50" y="105" width="1100" height="260" rx="20" fill="#121215" stroke="#27272A"/>
    
    <rect x="80" y="130" width="170" height="26" rx="8" fill="#F59E0B" fill-opacity="0.15"/>
    <text x="95" y="148" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#FBBF24">★ 4.9 DE CALIFICACIÓN (420+ RESEÑAS)</text>
    
    <text x="80" y="195" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#FFFFFF">CORTE CLÁSICO &amp; BARBA DE ALTA GAMA</text>
    <text x="80" y="230" font-family="system-ui, sans-serif" font-size="15" fill="#A1A1AA">La mejor experiencia de barbería en Bogotá. Reserva tu turno online en 30 segundos sin llamadas.</text>
    
    <rect x="80" y="265" width="220" height="48" rx="14" fill="#F59E0B"/>
    <text x="120" y="295" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#09090B">RESERVAR TURNO ONLINE</text>
    
    <rect x="320" y="265" width="180" height="48" rx="14" fill="#18181B" stroke="#27272A"/>
    <text x="355" y="295" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#FFFFFF">Ver Catálogo</text>

    <!-- Services Grid -->
    <text x="50" y="415" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">NUESTROS SERVICIOS MÁS POPULARES</text>

    <rect x="50" y="440" width="345" height="265" rx="18" fill="#121215" stroke="#27272A"/>
    <rect x="75" y="465" width="40" height="40" rx="10" fill="#18181B" stroke="#27272A"/>
    <text x="87" y="490" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#F59E0B">✂</text>
    <text x="75" y="535" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">Corte Degradado &amp; Fade</text>
    <text x="75" y="560" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Lavado premium, fade personalizado con navaja y peinado profesional.</text>
    <text x="75" y="615" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#FBBF24">$35,000 <tspan font-size="12" fill="#71717A">COP · 40 min</tspan></text>
    <rect x="75" y="640" width="295" height="40" rx="10" fill="#18181B" stroke="#F59E0B"/>
    <text x="180" y="665" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FBBF24">Reservar</text>

    <rect x="425" y="440" width="345" height="265" rx="18" fill="#121215" stroke="#F59E0B" stroke-width="1.5"/>
    <rect x="450" y="465" width="40" height="40" rx="10" fill="#F59E0B" fill-opacity="0.2"/>
    <text x="462" y="490" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#F59E0B">★</text>
    <text x="450" y="535" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">Combo Elite (Corte + Barba)</text>
    <text x="450" y="560" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Corte completo, toalla caliente al vapor, delineado de barba y mascarilla negra.</text>
    <text x="450" y="615" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#FBBF24">$55,000 <tspan font-size="12" fill="#71717A">COP · 60 min</tspan></text>
    <rect x="450" y="640" width="295" height="40" rx="10" fill="#F59E0B"/>
    <text x="560" y="665" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#09090B">Reservar Favorito</text>

    <rect x="800" y="440" width="350" height="265" rx="18" fill="#121215" stroke="#27272A"/>
    <rect x="825" y="465" width="40" height="40" rx="10" fill="#18181B" stroke="#27272A"/>
    <text x="837" y="490" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#38BDF8">⚡</text>
    <text x="825" y="535" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">Perfilado Ritual Navaja</text>
    <text x="825" y="560" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Aceites esenciales, toallas calientes y afeitado tradicional con navaja libre.</text>
    <text x="825" y="615" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#FBBF24">$25,000 <tspan font-size="12" fill="#71717A">COP · 30 min</tspan></text>
    <rect x="825" y="640" width="300" height="40" rx="10" fill="#18181B" stroke="#27272A"/>
    <text x="945" y="665" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">Reservar</text>
  </svg>`;

  // 3. pagina-web-mobile-dark.png (450x900)
  const webMobileDarkSvg = `
  <svg width="450" height="900" viewBox="0 0 450 900" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="450" height="900" fill="#09090B"/>
    
    <!-- Top Notch Area -->
    <rect width="450" height="44" fill="#121215"/>
    <rect x="175" y="10" width="100" height="24" rx="12" fill="#09090B"/>
    
    <!-- Brand Header -->
    <rect y="44" width="450" height="60" fill="#121215"/>
    <line x1="0" y1="104" x2="450" y2="104" stroke="#27272A" stroke-width="1"/>
    <text x="24" y="80" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">BARBERÍA <tspan fill="#F59E0B">ELITE</tspan></text>
    <rect x="310" y="58" width="115" height="32" rx="8" fill="#F59E0B"/>
    <text x="330" y="79" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#09090B">AGENDAR</text>

    <!-- Mobile Hero -->
    <rect x="20" y="125" width="410" height="220" rx="18" fill="#121215" stroke="#27272A"/>
    <text x="40" y="160" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#FBBF24">★ 4.9 EN GOOGLE (420+ RESEÑAS)</text>
    <text x="40" y="200" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#FFFFFF">CORTE CLÁSICO &amp;</text>
    <text x="40" y="230" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#F59E0B">BARBA DE ÉLITE</text>
    <text x="40" y="260" font-family="system-ui, sans-serif" font-size="11" fill="#A1A1AA">Elige tu barbero favorito y reserva en 3 clics.</text>
    <rect x="40" y="280" width="370" height="44" rx="12" fill="#F59E0B"/>
    <text x="140" y="308" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#09090B">RESERVAR TURNO AHORA</text>

    <!-- Step Barbero -->
    <text x="20" y="380" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">1. ELIGE BARBERO</text>
    
    <rect x="20" y="400" width="410" height="70" rx="14" fill="#18181B" stroke="#D97706" stroke-width="1.5"/>
    <rect x="35" y="415" width="40" height="40" rx="10" fill="#F59E0B" fill-opacity="0.2"/>
    <text x="46" y="440" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#F59E0B">C</text>
    <text x="85" y="435" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#FFFFFF">Carlos Ruiz</text>
    <text x="85" y="452" font-family="system-ui, sans-serif" font-size="10" fill="#A1A1AA">Fade Master · 4.9 ★</text>
    <text x="320" y="442" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#34D399">ELEGIDO ✓</text>

    <rect x="20" y="480" width="410" height="65" rx="14" fill="#121215" stroke="#27272A"/>
    <rect x="35" y="492" width="40" height="40" rx="10" fill="#27272A"/>
    <text x="46" y="517" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#A1A1AA">M</text>
    <text x="85" y="512" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#FFFFFF">Mateo Estilista</text>
    <text x="85" y="528" font-family="system-ui, sans-serif" font-size="10" fill="#71717A">Clásico Tijera · 4.8 ★</text>

    <!-- Step Servicio -->
    <text x="20" y="580" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">2. SERVICIOS DESTACADOS</text>

    <rect x="20" y="600" width="410" height="75" rx="14" fill="#18181B" stroke="#27272A"/>
    <text x="40" y="630" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#FFFFFF">Corte Degradado &amp; Fade</text>
    <text x="40" y="650" font-family="system-ui, sans-serif" font-size="10" fill="#71717A">40 min de duración</text>
    <text x="320" y="640" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FBBF24">$35,000</text>

    <rect x="20" y="685" width="410" height="75" rx="14" fill="#18181B" stroke="#F59E0B" stroke-width="1.5"/>
    <text x="40" y="715" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#FFFFFF">Combo Elite (Corte + Barba)</text>
    <text x="40" y="735" font-family="system-ui, sans-serif" font-size="10" fill="#FBBF24">Más popular · 60 min</text>
    <text x="320" y="725" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FBBF24">$55,000</text>

    <!-- Bottom WhatsApp Bar -->
    <rect y="810" width="450" height="90" fill="#121215"/>
    <line x1="0" y1="810" x2="450" y2="810" stroke="#27272A" stroke-width="1"/>
    <rect x="20" y="828" width="410" height="50" rx="14" fill="#10B981"/>
    <text x="120" y="859" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF">CONFIRMAR VÍA WHATSAPP</text>
  </svg>`;

  await createJpg('dashboard-barbero-dark.jpg', barberoSvg);
  await createPng('pagina-web-real-dark.png', webDarkSvg);
  await createPng('pagina-web-mobile-dark.png', webMobileDarkSvg, 450, 900);

  console.log('Finished generating missing dark landing mockups!');
}

run().catch(console.error);
