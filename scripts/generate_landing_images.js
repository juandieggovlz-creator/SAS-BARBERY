const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '..', 'public', 'landing');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to wrap SVG in sharp and output jpg
async function createJpg(filename, svgString, width = 1200, height = 750) {
  const buffer = Buffer.from(svgString);
  await sharp(buffer)
    .resize(width, height)
    .jpeg({ quality: 92 })
    .toFile(path.join(outputDir, filename));
  console.log(`Generated: ${filename}`);
}

async function run() {
  // 1. dashboard-admin.jpg
  const dashboardAdminSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#F8FAFC"/>
    
    <!-- Top Bar -->
    <rect width="1200" height="64" fill="#FFFFFF"/>
    <line x1="0" y1="64" x2="1200" y2="64" stroke="#E2E8F0" stroke-width="1"/>
    
    <!-- Logo & Title -->
    <rect x="32" y="16" width="32" height="32" rx="8" fill="#0F172A"/>
    <text x="76" y="38" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#0F172A">BARBER<tspan font-weight="300" fill="#64748B">OS</tspan></text>
    <rect x="200" y="20" width="130" height="24" rx="12" fill="#F1F5F9"/>
    <text x="215" y="36" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#475569">BARBERÍA ELITE SAS</text>
    
    <!-- Search / User -->
    <rect x="900" y="18" width="180" height="28" rx="8" fill="#F1F5F9" stroke="#E2E8F0"/>
    <text x="920" y="36" font-family="system-ui, sans-serif" font-size="12" fill="#94A3B8">Buscar cliente, cita...</text>
    <circle cx="1120" cy="32" r="16" fill="#0F172A"/>
    <text x="1114" y="37" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">AD</text>

    <!-- Sidebar -->
    <rect y="64" width="220" height="686" fill="#FFFFFF"/>
    <line x1="220" y1="64" x2="220" y2="750" stroke="#E2E8F0" stroke-width="1"/>
    
    <!-- Nav Items -->
    <rect x="16" y="90" width="188" height="38" rx="10" fill="#0F172A"/>
    <text x="48" y="114" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#FFFFFF">📊 Dashboard</text>
    <text x="48" y="156" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#64748B">📅 Citas &amp; Agenda</text>
    <text x="48" y="196" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#64748B">✂️ Barberos (3)</text>
    <text x="48" y="236" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#64748B">💈 Servicios</text>
    <text x="48" y="276" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#64748B">👥 Clientes</text>
    <text x="48" y="316" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#64748B">💰 Finanzas &amp; Caja</text>
    <text x="48" y="356" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#64748B">📈 Reportes</text>
    <text x="48" y="396" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#64748B">🌐 Página Web</text>

    <!-- Main Content Area -->
    <text x="250" y="112" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#0F172A">PANEL DE CONTROL GENERAL</text>
    <text x="250" y="132" font-family="system-ui, sans-serif" font-size="13" fill="#64748B">Métricas en tiempo real · Hoy, Bogotá</text>

    <!-- 4 Stats Cards -->
    <!-- Card 1: Ingresos -->
    <rect x="250" y="150" width="210" height="96" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="270" y="176" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">INGRESOS HOY</text>
    <text x="270" y="210" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#0F172A">$1,480,000</text>
    <rect x="390" y="165" width="56" height="20" rx="10" fill="#DCFCE7"/>
    <text x="398" y="179" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#15803D">+18.4%</text>

    <!-- Card 2: Citas Hoy -->
    <rect x="480" y="150" width="210" height="96" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="500" y="176" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">CITAS HOY</text>
    <text x="500" y="210" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#0F172A">28 citas</text>
    <text x="500" y="230" font-family="system-ui, sans-serif" font-size="11" fill="#16A34A">22 Confirmadas · 6 Pend.</text>

    <!-- Card 3: Ocupación -->
    <rect x="710" y="150" width="210" height="96" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="730" y="176" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">OCUPACIÓN EQUIPO</text>
    <text x="730" y="210" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#0F172A">92%</text>
    <text x="730" y="230" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">3 de 3 barberos activos</text>

    <!-- Card 4: Clientes Nuevos -->
    <rect x="940" y="150" width="220" height="96" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="960" y="176" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">NUEVOS CLIENTES</text>
    <text x="960" y="210" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#0F172A">+14 esta sem.</text>
    <text x="960" y="230" font-family="system-ui, sans-serif" font-size="11" fill="#2563EB">85% por página web</text>

    <!-- Bottom Left: Agenda Citas en Vivo -->
    <rect x="250" y="265" width="560" height="450" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="275" y="300" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#0F172A">CITAS PRÓXIMAS DE HOY</text>
    
    <!-- Row 1 -->
    <rect x="270" y="320" width="520" height="60" rx="12" fill="#F8FAFC" stroke="#F1F5F9"/>
    <circle cx="300" cy="350" r="18" fill="#0F172A"/>
    <text x="294" y="355" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">CR</text>
    <text x="330" y="343" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#0F172A">Camilo Restrepo</text>
    <text x="330" y="360" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Corte Fade + Barba Ritual · 45 min</text>
    <text x="590" y="344" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">$55,000</text>
    <text x="590" y="360" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Barbero: Carlos</text>
    <rect x="680" y="338" width="90" height="24" rx="12" fill="#DCFCE7"/>
    <text x="696" y="354" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#166534">EN SERVICIO</text>

    <!-- Row 2 -->
    <rect x="270" y="390" width="520" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
    <circle cx="300" cy="420" r="18" fill="#3B82F6"/>
    <text x="294" y="425" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">JP</text>
    <text x="330" y="413" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#0F172A">Juan Pérez</text>
    <text x="330" y="430" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Corte Clásico Navaja · 30 min</text>
    <text x="590" y="414" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">$35,000</text>
    <text x="590" y="430" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Barbero: Mateo</text>
    <rect x="680" y="408" width="90" height="24" rx="12" fill="#DBEAFE"/>
    <text x="702" y="424" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#1E40AF">CONFIRMADA</text>

    <!-- Row 3 -->
    <rect x="270" y="460" width="520" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
    <circle cx="300" cy="490" r="18" fill="#6366F1"/>
    <text x="294" y="495" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">AM</text>
    <text x="330" y="483" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#0F172A">Alejandro Morales</text>
    <text x="330" y="500" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Combo Premium Total · 60 min</text>
    <text x="590" y="484" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">$75,000</text>
    <text x="590" y="500" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Barbero: Julian</text>
    <rect x="680" y="478" width="90" height="24" rx="12" fill="#FEF3C7"/>
    <text x="705" y="494" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#92400E">PENDIENTE</text>

    <!-- Row 4 -->
    <rect x="270" y="530" width="520" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
    <circle cx="300" cy="560" r="18" fill="#10B981"/>
    <text x="294" y="565" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">SG</text>
    <text x="330" y="553" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#0F172A">Sebastián Gómez</text>
    <text x="330" y="570" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Perfilado Barba Toalla Caliente · 25 min</text>
    <text x="590" y="554" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">$25,000</text>
    <text x="590" y="570" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Barbero: Carlos</text>
    <rect x="680" y="548" width="90" height="24" rx="12" fill="#E2E8F0"/>
    <text x="705" y="564" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#475569">15:30 PM</text>

    <!-- Bottom Right: Barbers & Financial Summary -->
    <rect x="830" y="265" width="330" height="450" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="855" y="300" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#0F172A">EQUIPO &amp; COMISIONES</text>

    <!-- Barber 1 -->
    <rect x="850" y="325" width="290" height="75" rx="14" fill="#F8FAFC" stroke="#E2E8F0"/>
    <circle cx="880" cy="362" r="18" fill="#0F172A"/>
    <text x="874" y="367" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">CR</text>
    <text x="910" y="355" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">Carlos Ruiz</text>
    <text x="910" y="372" font-family="system-ui, sans-serif" font-size="11" fill="#16A34A">10 citas hoy · 40% com.</text>
    <text x="1060" y="362" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#0F172A">$220K</text>

    <!-- Barber 2 -->
    <rect x="850" y="415" width="290" height="75" rx="14" fill="#FFFFFF" stroke="#E2E8F0"/>
    <circle cx="880" cy="452" r="18" fill="#475569"/>
    <text x="874" y="457" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">ME</text>
    <text x="910" y="445" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">Mateo Estilista</text>
    <text x="910" y="462" font-family="system-ui, sans-serif" font-size="11" fill="#16A34A">8 citas hoy · 35% com.</text>
    <text x="1060" y="452" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#0F172A">$155K</text>

    <!-- Barber 3 -->
    <rect x="850" y="505" width="290" height="75" rx="14" fill="#FFFFFF" stroke="#E2E8F0"/>
    <circle cx="880" cy="542" r="18" fill="#64748B"/>
    <text x="875" y="547" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">JF</text>
    <text x="910" y="535" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">Julian Fade</text>
    <text x="910" y="552" font-family="system-ui, sans-serif" font-size="11" fill="#16A34A">6 citas hoy · 40% com.</text>
    <text x="1060" y="542" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#0F172A">$130K</text>

    <!-- Cash Balance Badge -->
    <rect x="850" y="600" width="290" height="90" rx="16" fill="#0F172A"/>
    <text x="875" y="630" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#94A3B8" letter-spacing="1">CIERRE DE CAJA EN VIVO</text>
    <text x="875" y="665" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#38BDF8">$1,480,000</text>
    <text x="1030" y="662" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#4ADE80">✓ Arqueo OK</text>
  </svg>`;

  // 2. dashboard-barbero.jpg (Light Theme)
  const dashboardBarberoSvg = `
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
    <rect x="40" y="105" width="260" height="110" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="65" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">MIS CITAS HOY</text>
    <text x="65" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#0F172A">10</text>
    <rect x="115" y="154" width="95" height="24" rx="12" fill="#DCFCE7"/>
    <text x="125" y="170" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#15803D">6 Realizadas</text>

    <rect x="330" y="105" width="260" height="110" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="355" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">MI COMISIÓN HOY (40%)</text>
    <text x="355" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#D97706">$220,000</text>
    <text x="355" y="198" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Acumulado mes: $3,450,000</text>

    <rect x="620" y="105" width="260" height="110" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="645" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" letter-spacing="1">PRÓXIMO TURNO</text>
    <text x="645" y="176" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#2563EB">15:00 PM</text>
    <text x="645" y="198" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Cliente: Mario Silva (Corte)</text>

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

    <text x="800" y="480" font-family="system-ui, sans-serif" font-size="12" fill="#0F172A">12:30 · Combo Elite ($55K) <tspan font-weight="800" fill="#059669">→ +$22,000</tspan></text>
    <text x="800" y="508" font-family="system-ui, sans-serif" font-size="12" fill="#0F172A">11:15 · Corte Clásico ($35K) <tspan font-weight="800" fill="#059669">→ +$14,000</tspan></text>
    <text x="800" y="536" font-family="system-ui, sans-serif" font-size="12" fill="#0F172A">11:00 · Barba Ritual ($25K) <tspan font-weight="800" fill="#059669">→ +$10,000</tspan></text>
    <text x="800" y="564" font-family="system-ui, sans-serif" font-size="12" fill="#0F172A">10:00 · Corte Fade ($35K) <tspan font-weight="800" fill="#059669">→ +$14,000</tspan></text>

    <!-- Download PDF Button -->
    <rect x="800" y="620" width="330" height="48" rx="14" fill="#0F172A"/>
    <text x="880" y="650" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF" letter-spacing="1">DESCARGAR REPORTE PDF</text>
  </svg>`;

  // 3. finanzas.jpg
  const finanzasSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#F8FAFC"/>
    <!-- Top Header -->
    <rect width="1200" height="70" fill="#FFFFFF"/>
    <line x1="0" y1="70" x2="1200" y2="70" stroke="#E2E8F0" stroke-width="1"/>
    <text x="40" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#0F172A">FINANZAS, CAJA &amp; CIERRE DIARIO</text>
    
    <!-- Big 3 Metric Cards -->
    <rect x="40" y="100" width="360" height="120" rx="18" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="65" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#64748B">INGRESOS TOTALES MES</text>
    <text x="65" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#0F172A">$34,850,000</text>
    <text x="65" y="205" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#16A34A">+24.8% vs mes anterior</text>

    <rect x="420" y="100" width="360" height="120" rx="18" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="445" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#64748B">GASTOS OPERATIVOS MES</text>
    <text x="445" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#EF4444">$6,450,000</text>
    <text x="445" y="205" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Arriendo, insumos, servicios</text>

    <rect x="800" y="100" width="360" height="120" rx="18" fill="#0F172A"/>
    <text x="825" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#94A3B8">UTILIDAD NETA DISPONIBLE</text>
    <text x="825" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#38BDF8">$14,560,000</text>
    <text x="825" y="205" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#4ADE80">Margen neto: 41.8%</text>

    <!-- Cash Close Box -->
    <rect x="40" y="250" width="700" height="460" rx="20" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="70" y="295" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#0F172A">HISTORIAL DE CIERRES DE CAJA (ARQUEO)</text>
    
    <rect x="70" y="325" width="640" height="60" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="90" y="360" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">Hoy · Cierre Turno Tarde</text>
    <text x="320" y="360" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">Efectivo: $820K | Bancolombia: $660K</text>
    <text x="560" y="360" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#16A34A">Diferencia: $0 COP ✓</text>

    <rect x="70" y="400" width="640" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="90" y="435" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">Ayer · Cierre General</text>
    <text x="320" y="435" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">Efectivo: $1.2M | Nequi: $940K</text>
    <text x="560" y="435" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#16A34A">Diferencia: $0 COP ✓</text>

    <rect x="70" y="475" width="640" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="90" y="510" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">Sábado · Cierre Fin de Semana</text>
    <text x="320" y="510" font-family="system-ui, sans-serif" font-size="12" fill="#64748B">Efectivo: $2.1M | Tarjeta: $1.4M</text>
    <text x="560" y="510" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#16A34A">Diferencia: $0 COP ✓</text>

    <!-- Payment Methods Breakdown -->
    <rect x="770" y="250" width="390" height="460" rx="20" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="800" y="295" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#0F172A">MÉTODOS DE PAGO</text>
    
    <text x="800" y="340" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#0F172A">Efectivo en Caja (48%)</text>
    <rect x="800" y="350" width="330" height="12" rx="6" fill="#E2E8F0"/>
    <rect x="800" y="350" width="160" height="12" rx="6" fill="#10B981"/>

    <text x="800" y="395" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#0F172A">Transferencia Bancolombia / Nequi (34%)</text>
    <rect x="800" y="405" width="330" height="12" rx="6" fill="#E2E8F0"/>
    <rect x="800" y="405" width="112" height="12" rx="6" fill="#3B82F6"/>

    <text x="800" y="450" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#0F172A">Datafono / Tarjetas Débito &amp; Crédito (18%)</text>
    <rect x="800" y="460" width="330" height="12" rx="6" fill="#E2E8F0"/>
    <rect x="800" y="460" width="60" height="12" rx="6" fill="#F59E0B"/>

    <rect x="800" y="520" width="330" height="160" rx="16" fill="#F1F5F9"/>
    <text x="825" y="555" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">CONTROL ANTI-FUGAS</text>
    <text x="825" y="580" font-family="system-ui, sans-serif" font-size="12" fill="#475569">Cada cita debe tener medio de pago registrado antes de cerrarse. Cero pérdidas entre barberos y recepción.</text>
  </svg>`;

  // 4. reportes.jpg
  const reportesSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#F8FAFC"/>
    <rect width="1200" height="70" fill="#FFFFFF"/>
    <line x1="0" y1="70" x2="1200" y2="70" stroke="#E2E8F0" stroke-width="1"/>
    <text x="40" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#0F172A">REPORTES &amp; ANALÍTICA AVANZADA</text>

    <!-- Visual Chart Mockup -->
    <rect x="40" y="100" width="740" height="420" rx="20" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="70" y="145" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#0F172A">EVOLUCIÓN MENSUAL DE FACTURACIÓN (COP)</text>
    
    <!-- Bar charts -->
    <!-- Jan -->
    <rect x="90" y="320" width="50" height="150" rx="8" fill="#E2E8F0"/>
    <text x="100" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">ENE</text>
    <!-- Feb -->
    <rect x="180" y="280" width="50" height="190" rx="8" fill="#E2E8F0"/>
    <text x="190" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">FEB</text>
    <!-- Mar -->
    <rect x="270" y="240" width="50" height="230" rx="8" fill="#E2E8F0"/>
    <text x="280" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">MAR</text>
    <!-- Apr -->
    <rect x="360" y="210" width="50" height="260" rx="8" fill="#E2E8F0"/>
    <text x="370" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">ABR</text>
    <!-- May -->
    <rect x="450" y="190" width="50" height="280" rx="8" fill="#93C5FD"/>
    <text x="460" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">MAY</text>
    <!-- Jun -->
    <rect x="540" y="150" width="50" height="320" rx="8" fill="#3B82F6"/>
    <text x="550" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">JUN</text>
    <!-- Jul (current) -->
    <rect x="630" y="120" width="50" height="350" rx="8" fill="#0F172A"/>
    <text x="640" y="490" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#0F172A">JUL 🔥</text>
    <text x="630" y="105" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#0F172A">$34.8M</text>

    <!-- Side metrics -->
    <rect x="810" y="100" width="350" height="420" rx="20" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="835" y="145" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#0F172A">KPIs DE RETENCIÓN</text>
    
    <rect x="835" y="170" width="300" height="70" rx="12" fill="#F8FAFC"/>
    <text x="850" y="195" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Tasa de Recurrencia</text>
    <text x="850" y="225" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#0F172A">78.4% de clientes vuelven</text>

    <rect x="835" y="255" width="300" height="70" rx="12" fill="#F8FAFC"/>
    <text x="850" y="280" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Ticket Promedio</text>
    <text x="850" y="310" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#0F172A">$52,400 COP por cita</text>

    <rect x="835" y="340" width="300" height="70" rx="12" fill="#F8FAFC"/>
    <text x="850" y="365" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Horas Pico Más Rentables</text>
    <text x="850" y="395" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#0F172A">Viernes &amp; Sábado 3-7 PM</text>

    <!-- Bottom Services Table -->
    <rect x="40" y="540" width="1120" height="180" rx="20" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="70" y="575" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#0F172A">TOP SERVICIOS MÁS VENDIDOS</text>
    <text x="70" y="615" font-family="system-ui, sans-serif" font-size="13" fill="#0F172A">1. Corte Degradado &amp; Fade — 480 citas este mes ($16,800,000)</text>
    <text x="70" y="645" font-family="system-ui, sans-serif" font-size="13" fill="#0F172A">2. Combo Elite (Corte + Barba Vaporizada) — 210 citas ($11,550,000)</text>
    <text x="70" y="675" font-family="system-ui, sans-serif" font-size="13" fill="#0F172A">3. Perfilado de Barba Ritual Navaja — 190 citas ($4,750,000)</text>
  </svg>`;

  // 5. agenda.jpg
  const agendaSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#F8FAFC"/>
    <rect width="1200" height="70" fill="#FFFFFF"/>
    <line x1="0" y1="70" x2="1200" y2="70" stroke="#E2E8F0" stroke-width="1"/>
    <text x="40" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#0F172A">AGENDA MULTI-BARBERO INTELIGENTE</text>

    <!-- Calendar Columns Mockup -->
    <!-- Header days -->
    <rect x="40" y="100" width="1120" height="60" rx="14" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="80" y="135" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">HORA</text>
    <text x="240" y="135" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">CARLOS RUIZ (Puesto 1)</text>
    <text x="560" y="135" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">MATEO ESTILISTA (Puesto 2)</text>
    <text x="880" y="135" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">JULIAN FADE (Puesto 3)</text>

    <!-- Time slot 09:00 -->
    <rect x="40" y="180" width="1120" height="110" rx="14" fill="#FFFFFF" stroke="#F1F5F9"/>
    <text x="60" y="235" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#64748B">09:00 AM</text>
    <!-- Slot Barber 1 -->
    <rect x="200" y="190" width="290" height="90" rx="12" fill="#DBEAFE" stroke="#93C5FD"/>
    <text x="215" y="215" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#1E40AF">Andrés Gómez · $35K</text>
    <text x="215" y="235" font-family="system-ui, sans-serif" font-size="11" fill="#1E40AF">Corte Degradado · 09:00-09:30</text>
    <rect x="215" y="245" width="80" height="20" rx="6" fill="#2563EB"/>
    <text x="225" y="258" font-family="system-ui, sans-serif" font-weight="800" font-size="9" fill="#FFFFFF">CONFIRMADA</text>

    <!-- Slot Barber 2 -->
    <rect x="520" y="190" width="290" height="90" rx="12" fill="#FEF3C7" stroke="#FDE68A"/>
    <text x="535" y="215" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#92400E">Luis Martínez · $55K</text>
    <text x="535" y="235" font-family="system-ui, sans-serif" font-size="11" fill="#92400E">Combo Elite · 09:00-09:50</text>
    <rect x="535" y="245" width="80" height="20" rx="6" fill="#D97706"/>
    <text x="548" y="258" font-family="system-ui, sans-serif" font-weight="800" font-size="9" fill="#FFFFFF">EN CURSO</text>

    <!-- Slot Barber 3 (Libre) -->
    <rect x="840" y="190" width="290" height="90" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-dasharray="4"/>
    <text x="940" y="240" font-family="system-ui, sans-serif" font-weight="600" font-size="12" fill="#94A3B8">+ Turno Libre</text>

    <!-- Time slot 10:00 -->
    <rect x="40" y="310" width="1120" height="110" rx="14" fill="#FFFFFF" stroke="#F1F5F9"/>
    <text x="60" y="365" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#64748B">10:00 AM</text>
    <!-- Slot Barber 1 -->
    <rect x="200" y="320" width="290" height="90" rx="12" fill="#DCFCE7" stroke="#86EFAC"/>
    <text x="215" y="345" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#166534">Camilo Sossa · $55K</text>
    <text x="215" y="365" font-family="system-ui, sans-serif" font-size="11" fill="#166534">Corte + Barba · 10:00-10:45</text>
    <rect x="215" y="375" width="80" height="20" rx="6" fill="#16A34A"/>
    <text x="225" y="388" font-family="system-ui, sans-serif" font-weight="800" font-size="9" fill="#FFFFFF">COMPLETADA</text>

    <!-- Slot Barber 2 -->
    <rect x="520" y="320" width="290" height="90" rx="12" fill="#DBEAFE" stroke="#93C5FD"/>
    <text x="535" y="345" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#1E40AF">Jorge Rojas · $25K</text>
    <text x="535" y="365" font-family="system-ui, sans-serif" font-size="11" fill="#1E40AF">Perfilado Barba · 10:00-10:30</text>

    <!-- Slot Barber 3 -->
    <rect x="840" y="320" width="290" height="90" rx="12" fill="#F3E8FF" stroke="#D8B4FE"/>
    <text x="855" y="345" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#6B21A8">David Pardo · $35K</text>
    <text x="855" y="365" font-family="system-ui, sans-serif" font-size="11" fill="#6B21A8">Corte Fade · 10:00-10:30</text>
  </svg>`;

  // 6. pagina-web.jpg
  const paginaWebSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#0F172A"/>
    <!-- Web Header -->
    <rect width="1200" height="70" fill="#1E293B"/>
    <text x="50" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#F8FAFC">BARBERÍA ELITE BOGOTÁ</text>
    <text x="800" y="44" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#94A3B8">Servicios   ·   Equipo   ·   Ubicación</text>
    <rect x="1020" y="18" width="130" height="34" rx="17" fill="#F59E0B"/>
    <text x="1040" y="40" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#0F172A">RESERVAR CITA</text>

    <!-- Hero of Public Page -->
    <rect x="50" y="110" width="1100" height="280" rx="24" fill="#1E293B" stroke="#334155"/>
    <text x="90" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="38" fill="#FFFFFF">EXPERIENCIA PREMIUM EN CADA CORTE</text>
    <text x="90" y="215" font-family="system-ui, sans-serif" font-size="16" fill="#CBD5E1">Atención personalizada, toalla vaporizada y perfilado a navaja en Calle 85 # 14-20.</text>
    <rect x="90" y="250" width="180" height="48" rx="14" fill="#F59E0B"/>
    <text x="120" y="280" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#0F172A">AGENDAR AHORA</text>
    
    <!-- Services Grid on Public Page -->
    <rect x="50" y="430" width="340" height="260" rx="18" fill="#1E293B" stroke="#334155"/>
    <text x="80" y="475" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">Corte Clásico Navaja</text>
    <text x="80" y="505" font-family="system-ui, sans-serif" font-size="13" fill="#94A3B8">30 minutos · Terminación perfecta</text>
    <text x="80" y="550" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#F59E0B">$35,000</text>
    <rect x="80" y="600" width="280" height="40" rx="10" fill="#334155"/>
    <text x="160" y="625" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">Seleccionar</text>

    <rect x="430" y="430" width="340" height="260" rx="18" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
    <text x="460" y="475" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">Combo Elite + Barba</text>
    <text x="460" y="505" font-family="system-ui, sans-serif" font-size="13" fill="#94A3B8">50 minutos · Ritual completo</text>
    <text x="460" y="550" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#F59E0B">$55,000</text>
    <rect x="460" y="600" width="280" height="40" rx="10" fill="#F59E0B"/>
    <text x="540" y="625" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#0F172A">Seleccionar</text>

    <rect x="810" y="430" width="340" height="260" rx="18" fill="#1E293B" stroke="#334155"/>
    <text x="840" y="475" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">Diseño &amp; Fade Master</text>
    <text x="840" y="505" font-family="system-ui, sans-serif" font-size="13" fill="#94A3B8">40 minutos · Líneas personalizadas</text>
    <text x="840" y="550" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#F59E0B">$45,000</text>
    <rect x="840" y="600" width="280" height="40" rx="10" fill="#334155"/>
    <text x="920" y="625" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">Seleccionar</text>
  </svg>`;

  // 7. reservas.jpg
  const reservasSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#F8FAFC"/>
    <rect width="1200" height="70" fill="#FFFFFF"/>
    <line x1="0" y1="70" x2="1200" y2="70" stroke="#E2E8F0" stroke-width="1"/>
    <text x="40" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#0F172A">SISTEMA DE RESERVAS ONLINE EN 3 CLICS</text>

    <!-- Step 1: Barber Selection -->
    <rect x="40" y="110" width="350" height="580" rx="20" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="70" y="150" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#0F172A">1. ELIGE BARBERO</text>
    
    <rect x="65" y="180" width="300" height="90" rx="16" fill="#0F172A"/>
    <text x="85" y="215" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">Carlos Ruiz</text>
    <text x="85" y="235" font-family="system-ui, sans-serif" font-size="11" fill="#94A3B8">Especialista Fade &amp; Barba · 4.9 ★</text>
    <text x="85" y="252" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#4ADE80">SELECCIONADO ✓</text>

    <rect x="65" y="290" width="300" height="90" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="85" y="325" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#0F172A">Mateo Estilista</text>
    <text x="85" y="345" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Corte Clásico Tijera · 4.8 ★</text>

    <rect x="65" y="400" width="300" height="90" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="85" y="435" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#0F172A">Cualquier Profesional</text>
    <text x="85" y="455" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Asignación automática del primer turno</text>

    <!-- Step 2: Time Selection -->
    <rect x="420" y="110" width="350" height="580" rx="20" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="450" y="150" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#0F172A">2. FECHA Y HORA</text>
    
    <rect x="445" y="180" width="300" height="70" rx="14" fill="#F1F5F9"/>
    <text x="470" y="210" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">Jueves, 12 de Octubre</text>
    <text x="470" y="230" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">7 turnos disponibles hoy</text>

    <!-- Slots -->
    <rect x="445" y="270" width="90" height="44" rx="10" fill="#0F172A"/>
    <text x="468" y="297" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF">14:00</text>

    <rect x="550" y="270" width="90" height="44" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="573" y="297" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#0F172A">14:30</text>

    <rect x="655" y="270" width="90" height="44" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="678" y="297" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#0F172A">15:00</text>

    <rect x="445" y="330" width="90" height="44" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="468" y="357" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#0F172A">15:30</text>

    <rect x="550" y="330" width="90" height="44" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="573" y="357" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#0F172A">16:00</text>

    <rect x="655" y="330" width="90" height="44" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="678" y="357" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#0F172A">16:30</text>

    <!-- Step 3: Confirmation -->
    <rect x="800" y="110" width="360" height="580" rx="20" fill="#FFFFFF" stroke="#E2E8F0"/>
    <text x="830" y="150" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#0F172A">3. CONFIRMACIÓN</text>

    <rect x="825" y="180" width="310" height="200" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="845" y="215" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#64748B">RESUMEN DE RESERVA</text>
    <text x="845" y="245" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#0F172A">Combo Elite (Corte + Barba)</text>
    <text x="845" y="270" font-family="system-ui, sans-serif" font-size="12" fill="#475569">Jueves 12 Oct · 14:00 PM (50 min)</text>
    <text x="845" y="295" font-family="system-ui, sans-serif" font-size="12" fill="#475569">Barbero: Carlos Ruiz</text>
    <text x="845" y="335" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#0F172A">Total: $55,000 COP</text>

    <rect x="825" y="410" width="310" height="48" rx="12" fill="#16A34A"/>
    <text x="890" y="440" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF">CONFIRMAR VÍA WHATSAPP</text>

    <text x="825" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">El cliente recibe confirmación inmediata y recordatorio automático antes de su cita.</text>
  </svg>`;

  await createJpg('dashboard-admin.jpg', dashboardAdminSvg);
  await createJpg('dashboard-barbero.jpg', dashboardBarberoSvg);
  await createJpg('finanzas.jpg', finanzasSvg);
  await createJpg('reportes.jpg', reportesSvg);
  await createJpg('agenda.jpg', agendaSvg);
  await createJpg('pagina-web.jpg', paginaWebSvg);
  await createJpg('reservas.jpg', reservasSvg);

  console.log('All 7 landing images successfully generated in public/landing/!');
}

run().catch(console.error);
