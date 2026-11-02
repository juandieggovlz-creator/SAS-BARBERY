const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '..', 'public', 'landing');

async function createJpg(filename, svgString, width = 1200, height = 750) {
  const buffer = Buffer.from(svgString);
  await sharp(buffer)
    .resize(width, height)
    .jpeg({ quality: 95 })
    .toFile(path.join(outputDir, filename));
  console.log(`Generated: ${filename}`);
}

async function run() {
  // 1. LIGHT THEME VERSION (dashboard-barbero.jpg)
  const dashboardBarberoLightSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#F8FAFC"/>
    
    <!-- Top Barber Header Light -->
    <rect width="1200" height="76" fill="#FFFFFF"/>
    <line x1="0" y1="76" x2="1200" y2="76" stroke="#E2E8F0" stroke-width="1"/>
    
    <rect x="40" y="18" width="40" height="40" rx="12" fill="#FFF1F2" stroke="#FECDD3" stroke-width="1.5"/>
    <text x="50" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#E11D48">✂</text>
    
    <text x="96" y="38" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#0F172A">PORTAL DEL BARBERO</text>
    <text x="96" y="55" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">Carlos Ruiz · Degradados &amp; Barba · Barbería Elite SAS</text>
    
    <!-- Status Switcher Light -->
    <rect x="940" y="20" width="220" height="36" rx="18" fill="#F1F5F9" stroke="#E2E8F0"/>
    <rect x="944" y="24" width="105" height="28" rx="14" fill="#10B981"/>
    <text x="962" y="42" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">🟢 DISPONIBLE</text>
    <text x="1065" y="42" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B">En Turno</text>

    <!-- 4 Stats Cards Barber (Light) -->
    <!-- Card 1: Citas -->
    <rect x="40" y="105" width="260" height="110" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="65" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">MIS CITAS HOY</text>
    <text x="65" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#0F172A">10</text>
    <rect x="115" y="154" width="95" height="24" rx="12" fill="#DCFCE7"/>
    <text x="125" y="170" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#15803D">6 Realizadas</text>

    <!-- Card 2: Comisión -->
    <rect x="330" y="105" width="260" height="110" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="355" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">MI COMISIÓN HOY (40%)</text>
    <text x="355" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#D97706">$220,000</text>
    <text x="355" y="198" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Acumulado mes: $3,450,000</text>

    <!-- Card 3: Próximo Turno -->
    <rect x="620" y="105" width="260" height="110" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="645" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">PRÓXIMO TURNO</text>
    <text x="645" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#2563EB">15:00 PM</text>
    <text x="645" y="198" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Cliente: Mario Silva (Corte)</text>

    <!-- Card 4: Calificación -->
    <rect x="910" y="105" width="250" height="110" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="935" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">CALIFICACIÓN</text>
    <text x="935" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#0F172A">4.9 ★</text>
    <text x="1010" y="174" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">(128 reseñas)</text>

    <!-- Main Left Card: Agenda Personal en Tiempo Real -->
    <rect x="40" y="245" width="700" height="470" rx="22" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="70" y="290" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#0F172A">AGENDA PERSONAL EN TIEMPO REAL</text>

    <!-- Turn 1 -->
    <rect x="70" y="315" width="640" height="80" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="95" y="352" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#2563EB">15:00</text>
    <text x="95" y="372" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">30 min</text>
    <text x="165" y="348" font-family="system-ui, sans-serif" font-weight="800" font-size="15" fill="#0F172A">Mario Silva Gómez</text>
    <text x="165" y="370" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">Degradado Clásico + Lavado · Nota: "Piel sensible"</text>
    <rect x="580" y="338" width="110" height="35" rx="10" fill="#10B981"/>
    <text x="600" y="360" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF">INICIAR ▶</text>

    <!-- Turn 2 -->
    <rect x="70" y="410" width="640" height="80" rx="16" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="95" y="447" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#64748B">15:45</text>
    <text x="95" y="467" font-family="system-ui, sans-serif" font-size="11" fill="#94A3B8">45 min</text>
    <text x="165" y="443" font-family="system-ui, sans-serif" font-weight="800" font-size="15" fill="#0F172A">David Cárdenas</text>
    <text x="165" y="465" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">Combo Elite: Corte + Perfilado Barba Navaja</text>
    <rect x="580" y="433" width="110" height="35" rx="10" fill="#F1F5F9" stroke="#E2E8F0"/>
    <text x="600" y="455" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#64748B">ESPERA ⏳</text>

    <!-- Turn 3 -->
    <rect x="70" y="505" width="640" height="80" rx="16" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="95" y="542" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#64748B">16:45</text>
    <text x="95" y="562" font-family="system-ui, sans-serif" font-size="11" fill="#94A3B8">30 min</text>
    <text x="165" y="538" font-family="system-ui, sans-serif" font-weight="800" font-size="15" fill="#0F172A">Felipe Restrepo</text>
    <text x="165" y="560" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">Corte Tradicional Tijera</text>
    <rect x="580" y="528" width="110" height="35" rx="10" fill="#EFF6FF" stroke="#BFDBFE"/>
    <text x="595" y="550" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#1D4ED8">CONFIRMADA</text>

    <!-- Turn 4 (Bloqueo Almuerzo) -->
    <rect x="70" y="600" width="640" height="75" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="95" y="635" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#94A3B8">17:30</text>
    <text x="165" y="635" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#64748B">BLOQUEO DE DESCANSO · 30 min</text>
    <rect x="580" y="618" width="110" height="32" rx="10" fill="#F1F5F9" stroke="#E2E8F0"/>
    <text x="612" y="639" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#64748B">PAUSA</text>

    <!-- Right Side: Liquidación de Comisiones Light -->
    <rect x="770" y="245" width="390" height="470" rx="22" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="800" y="290" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#0F172A">LIQUIDACIÓN DE COMISIONES</text>

    <rect x="800" y="315" width="330" height="105" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="820" y="345" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">TOTAL A PAGAR ESTA QUINCENA</text>
    <text x="820" y="385" font-family="system-ui, sans-serif" font-weight="900" font-size="30" fill="#059669">$1,720,000</text>
    <text x="820" y="408" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">38 servicios realizados · 40% pactado</text>

    <text x="800" y="450" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#64748B" letter-spacing="1">ÚLTIMOS SERVICIOS LIQUIDADOS</text>

    <!-- Recent liquidations list -->
    <text x="800" y="480" font-family="system-ui, sans-serif" font-size="12" fill="#0F172A">12:30 · Combo Elite ($55K) <tspan font-weight="800" fill="#059669">→ +$22,000</tspan></text>
    <text x="800" y="508" font-family="system-ui, sans-serif" font-size="12" fill="#0F172A">11:15 · Corte Clásico ($35K) <tspan font-weight="800" fill="#059669">→ +$14,000</tspan></text>
    <text x="800" y="536" font-family="system-ui, sans-serif" font-size="12" fill="#0F172A">11:00 · Barba Ritual ($25K) <tspan font-weight="800" fill="#059669">→ +$10,000</tspan></text>
    <text x="800" y="564" font-family="system-ui, sans-serif" font-size="12" fill="#0F172A">10:00 · Corte Fade ($35K) <tspan font-weight="800" fill="#059669">→ +$14,000</tspan></text>

    <!-- Download PDF Button -->
    <rect x="800" y="620" width="330" height="48" rx="14" fill="#0F172A"/>
    <text x="880" y="650" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF" letter-spacing="1">DESCARGAR REPORTE PDF</text>
  </svg>`;

  // 2. DARK THEME VERSION (dashboard-barbero-dark.jpg)
  const dashboardBarberoDarkSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#09090B"/>
    
    <!-- Top Barber Header -->
    <rect width="1200" height="76" fill="#18181B"/>
    <line x1="0" y1="76" x2="1200" y2="76" stroke="#27272A" stroke-width="1"/>
    
    <rect x="40" y="18" width="40" height="40" rx="12" fill="#27272A" stroke="#3F3F46" stroke-width="1.5"/>
    <text x="50" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#F43F5E">✂</text>
    
    <text x="96" y="38" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">PORTAL DEL BARBERO</text>
    <text x="96" y="55" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Carlos Ruiz · Degradados &amp; Barba · Barbería Elite SAS</text>
    
    <!-- Status Switcher -->
    <rect x="940" y="20" width="220" height="36" rx="18" fill="#27272A" stroke="#3F3F46"/>
    <rect x="944" y="24" width="105" height="28" rx="14" fill="#10B981"/>
    <text x="962" y="42" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">🟢 DISPONIBLE</text>
    <text x="1065" y="42" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#71717A">En Turno</text>

    <!-- 4 Stats Cards Barber -->
    <rect x="40" y="105" width="260" height="110" rx="20" fill="#18181B" stroke="#27272A"/>
    <text x="65" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#A1A1AA" letter-spacing="1">MIS CITAS HOY</text>
    <text x="65" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#FFFFFF">10</text>
    <text x="120" y="174" font-family="system-ui, sans-serif" font-size="12" fill="#34D399">6 Realizadas</text>

    <rect x="330" y="105" width="260" height="110" rx="20" fill="#18181B" stroke="#27272A"/>
    <text x="355" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#A1A1AA" letter-spacing="1">MI COMISIÓN HOY (40%)</text>
    <text x="355" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#FBBF24">$220,000</text>
    <text x="355" y="198" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">Acumulado mes: $3,450,000</text>

    <rect x="620" y="105" width="260" height="110" rx="20" fill="#18181B" stroke="#27272A"/>
    <text x="645" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#A1A1AA" letter-spacing="1">PRÓXIMO TURNO</text>
    <text x="645" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#38BDF8">15:00 PM</text>
    <text x="645" y="198" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">Cliente: Mario Silva (Corte)</text>

    <rect x="910" y="105" width="250" height="110" rx="20" fill="#18181B" stroke="#27272A"/>
    <text x="935" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#A1A1AA" letter-spacing="1">CALIFICACIÓN</text>
    <text x="935" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#FFFFFF">4.9 ★</text>
    <text x="1010" y="174" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">(128 reseñas)</text>

    <!-- Main Upcoming Focus Card -->
    <rect x="40" y="245" width="700" height="470" rx="22" fill="#18181B" stroke="#27272A"/>
    <text x="70" y="290" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#FFFFFF">AGENDA PERSONAL EN TIEMPO REAL</text>

    <!-- Appointment Item 1 -->
    <rect x="70" y="315" width="640" height="80" rx="16" fill="#27272A" stroke="#3F3F46"/>
    <text x="95" y="352" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#38BDF8">15:00</text>
    <text x="95" y="372" font-family="system-ui, sans-serif" font-size="11" fill="#A1A1AA">30 min</text>
    <text x="165" y="348" font-family="system-ui, sans-serif" font-weight="800" font-size="15" fill="#FFFFFF">Mario Silva Gómez</text>
    <text x="165" y="370" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Degradado Clásico + Lavado · Nota: "Piel sensible"</text>
    <rect x="580" y="338" width="110" height="35" rx="10" fill="#10B981"/>
    <text x="600" y="360" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF">INICIAR ▶</text>

    <!-- Appointment Item 2 -->
    <rect x="70" y="410" width="640" height="80" rx="16" fill="#18181B" stroke="#27272A"/>
    <text x="95" y="447" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#A1A1AA">15:45</text>
    <text x="95" y="467" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">45 min</text>
    <text x="165" y="443" font-family="system-ui, sans-serif" font-weight="800" font-size="15" fill="#FFFFFF">David Cárdenas</text>
    <text x="165" y="465" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Combo Elite: Corte + Perfilado Barba Navaja</text>
    <rect x="580" y="433" width="110" height="35" rx="10" fill="#27272A" stroke="#3F3F46"/>
    <text x="600" y="455" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#A1A1AA">ESPERA ⏳</text>

    <!-- Appointment Item 3 -->
    <rect x="70" y="505" width="640" height="80" rx="16" fill="#18181B" stroke="#27272A"/>
    <text x="95" y="542" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#A1A1AA">16:45</text>
    <text x="95" y="562" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">30 min</text>
    <text x="165" y="538" font-family="system-ui, sans-serif" font-weight="800" font-size="15" fill="#FFFFFF">Felipe Restrepo</text>
    <text x="165" y="560" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Corte Tradicional Tijera</text>
    <rect x="580" y="528" width="110" height="35" rx="10" fill="#27272A" stroke="#3F3F46"/>
    <text x="595" y="550" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#A1A1AA">CONFIRMADA</text>

    <!-- Right Side: Commission Wallet & History -->
    <rect x="770" y="245" width="390" height="470" rx="22" fill="#18181B" stroke="#27272A"/>
    <text x="800" y="290" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#FFFFFF">LIQUIDACIÓN DE COMISIONES</text>

    <rect x="800" y="315" width="330" height="105" rx="16" fill="#27272A"/>
    <text x="820" y="345" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#A1A1AA">TOTAL A PAGAR ESTA QUINCENA</text>
    <text x="820" y="385" font-family="system-ui, sans-serif" font-weight="900" font-size="30" fill="#34D399">$1,720,000</text>
    <text x="820" y="408" font-family="system-ui, sans-serif" font-size="11" fill="#94A3B8">38 servicios realizados · 40% pactado</text>

    <text x="800" y="450" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#71717A" letter-spacing="1">ÚLTIMOS SERVICIOS LIQUIDADOS</text>
    <text x="800" y="480" font-family="system-ui, sans-serif" font-size="12" fill="#E4E4E7">12:30 · Combo Elite ($55K) <tspan font-weight="800" fill="#34D399">→ +$22,000</tspan></text>
    <text x="800" y="508" font-family="system-ui, sans-serif" font-size="12" fill="#E4E4E7">11:15 · Corte Clásico ($35K) <tspan font-weight="800" fill="#34D399">→ +$14,000</tspan></text>
    <text x="800" y="536" font-family="system-ui, sans-serif" font-size="12" fill="#E4E4E7">11:00 · Barba Ritual ($25K) <tspan font-weight="800" fill="#34D399">→ +$10,000</tspan></text>
    <text x="800" y="564" font-family="system-ui, sans-serif" font-size="12" fill="#E4E4E7">10:00 · Corte Fade ($35K) <tspan font-weight="800" fill="#34D399">→ +$14,000</tspan></text>

    <!-- Download PDF Button -->
    <rect x="800" y="620" width="330" height="48" rx="14" fill="#27272A" stroke="#3F3F46"/>
    <text x="880" y="650" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF" letter-spacing="1">DESCARGAR REPORTE PDF</text>
  </svg>`;

  await createJpg('dashboard-barbero.jpg', dashboardBarberoLightSvg);
  await createJpg('dashboard-barbero-dark.jpg', dashboardBarberoDarkSvg);
}

run().catch(console.error);
