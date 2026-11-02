const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '..', 'public', 'landing');

async function createJpg(filename, svgString, width = 1200, height = 750) {
  const buffer = Buffer.from(svgString);
  await sharp(buffer)
    .resize(width, height)
    .jpeg({ quality: 92 })
    .toFile(path.join(outputDir, filename));
  console.log(`Generated dark mockup: ${filename}`);
}

async function run() {
  // 1. finanzas-dark.jpg
  const finanzasSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#09090B"/>
    <!-- Top Header -->
    <rect width="1200" height="70" fill="#121215"/>
    <line x1="0" y1="70" x2="1200" y2="70" stroke="#27272A" stroke-width="1"/>
    <text x="40" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">FINANZAS, CAJA &amp; CIERRE DIARIO</text>
    
    <!-- Big 3 Metric Cards -->
    <rect x="40" y="100" width="360" height="120" rx="18" fill="#121215" stroke="#27272A"/>
    <text x="65" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#A1A1AA">INGRESOS TOTALES MES</text>
    <text x="65" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#FFFFFF">$34,850,000</text>
    <text x="65" y="205" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#34D399">+24.8% vs mes anterior</text>

    <rect x="420" y="100" width="360" height="120" rx="18" fill="#121215" stroke="#27272A"/>
    <text x="445" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#A1A1AA">GASTOS OPERATIVOS MES</text>
    <text x="445" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#FB7185">$6,450,000</text>
    <text x="445" y="205" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">Arriendo, insumos, servicios</text>

    <rect x="800" y="100" width="360" height="120" rx="18" fill="#062013" stroke="#047857"/>
    <text x="825" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#A7F3D0">UTILIDAD NETA DISPONIBLE</text>
    <text x="825" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#34D399">$14,560,000</text>
    <text x="825" y="205" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#6EE7B7">Margen neto: 41.8%</text>

    <!-- Cash Close Box -->
    <rect x="40" y="250" width="700" height="460" rx="20" fill="#121215" stroke="#27272A"/>
    <text x="70" y="295" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">HISTORIAL DE CIERRES DE CAJA (ARQUEO)</text>
    
    <rect x="70" y="325" width="640" height="60" rx="12" fill="#18181B" stroke="#27272A"/>
    <text x="90" y="360" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#FFFFFF">Hoy · Cierre Turno Tarde</text>
    <text x="320" y="360" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Efectivo: $820K | Bancolombia: $660K</text>
    <text x="560" y="360" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#34D399">Diferencia: $0 COP ✓</text>

    <rect x="70" y="400" width="640" height="60" rx="12" fill="#18181B" stroke="#27272A"/>
    <text x="90" y="435" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#FFFFFF">Ayer · Cierre General</text>
    <text x="320" y="435" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Efectivo: $1.2M | Nequi: $940K</text>
    <text x="560" y="435" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#34D399">Diferencia: $0 COP ✓</text>

    <rect x="70" y="475" width="640" height="60" rx="12" fill="#18181B" stroke="#27272A"/>
    <text x="90" y="510" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#FFFFFF">Sábado · Cierre Fin de Semana</text>
    <text x="320" y="510" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Efectivo: $2.1M | Tarjeta: $1.4M</text>
    <text x="560" y="510" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#34D399">Diferencia: $0 COP ✓</text>

    <!-- Payment Methods Breakdown -->
    <rect x="770" y="250" width="390" height="460" rx="20" fill="#121215" stroke="#27272A"/>
    <text x="800" y="295" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">MÉTODOS DE PAGO</text>
    
    <text x="800" y="340" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#FFFFFF">Efectivo en Caja (48%)</text>
    <rect x="800" y="350" width="330" height="12" rx="6" fill="#27272A"/>
    <rect x="800" y="350" width="160" height="12" rx="6" fill="#10B981"/>

    <text x="800" y="395" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#FFFFFF">Transferencia Bancolombia / Nequi (34%)</text>
    <rect x="800" y="405" width="330" height="12" rx="6" fill="#27272A"/>
    <rect x="800" y="405" width="112" height="12" rx="6" fill="#3B82F6"/>

    <text x="800" y="450" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#FFFFFF">Datafono / Tarjetas Débito &amp; Crédito (18%)</text>
    <rect x="800" y="460" width="330" height="12" rx="6" fill="#27272A"/>
    <rect x="800" y="460" width="60" height="12" rx="6" fill="#F59E0B"/>

    <rect x="800" y="520" width="330" height="160" rx="16" fill="#18181B" stroke="#27272A"/>
    <text x="825" y="555" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#38BDF8">CONTROL ANTI-FUGAS</text>
    <text x="825" y="580" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Cada cita debe tener medio de pago registrado antes de cerrarse. Cero pérdidas entre barberos y recepción.</text>
  </svg>`;

  // 2. reportes-dark.jpg
  const reportesSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#09090B"/>
    <rect width="1200" height="70" fill="#121215"/>
    <line x1="0" y1="70" x2="1200" y2="70" stroke="#27272A" stroke-width="1"/>
    <text x="40" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">REPORTES &amp; ANALÍTICA AVANZADA</text>

    <!-- Visual Chart Mockup -->
    <rect x="40" y="100" width="740" height="420" rx="20" fill="#121215" stroke="#27272A"/>
    <text x="70" y="145" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">EVOLUCIÓN MENSUAL DE FACTURACIÓN (COP)</text>
    
    <!-- Bar charts -->
    <rect x="90" y="320" width="50" height="150" rx="8" fill="#27272A"/>
    <text x="100" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">ENE</text>
    <rect x="180" y="280" width="50" height="190" rx="8" fill="#27272A"/>
    <text x="190" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">FEB</text>
    <rect x="270" y="240" width="50" height="230" rx="8" fill="#27272A"/>
    <text x="280" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">MAR</text>
    <rect x="360" y="210" width="50" height="260" rx="8" fill="#3F3F46"/>
    <text x="370" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#A1A1AA">ABR</text>
    <rect x="450" y="190" width="50" height="280" rx="8" fill="#1D4ED8"/>
    <text x="460" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#93C5FD">MAY</text>
    <rect x="540" y="150" width="50" height="320" rx="8" fill="#2563EB"/>
    <text x="550" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#93C5FD">JUN</text>
    <rect x="630" y="120" width="50" height="350" rx="8" fill="#F59E0B"/>
    <text x="640" y="490" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FBBF24">JUL 🔥</text>
    <text x="630" y="105" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#FBBF24">$34.8M</text>

    <!-- Side metrics -->
    <rect x="810" y="100" width="350" height="420" rx="20" fill="#121215" stroke="#27272A"/>
    <text x="835" y="145" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">KPIs DE RETENCIÓN</text>
    
    <rect x="835" y="170" width="300" height="70" rx="12" fill="#18181B" stroke="#27272A"/>
    <text x="850" y="195" font-family="system-ui, sans-serif" font-size="11" fill="#A1A1AA">Tasa de Recurrencia</text>
    <text x="850" y="225" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#34D399">78.4% de clientes vuelven</text>

    <rect x="835" y="255" width="300" height="70" rx="12" fill="#18181B" stroke="#27272A"/>
    <text x="850" y="280" font-family="system-ui, sans-serif" font-size="11" fill="#A1A1AA">Ticket Promedio</text>
    <text x="850" y="310" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#FBBF24">$52,400 COP por cita</text>

    <rect x="835" y="340" width="300" height="70" rx="12" fill="#18181B" stroke="#27272A"/>
    <text x="850" y="365" font-family="system-ui, sans-serif" font-size="11" fill="#A1A1AA">Horas Pico Más Rentables</text>
    <text x="850" y="395" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#38BDF8">Viernes &amp; Sábado 3-7 PM</text>

    <!-- Bottom Services Table -->
    <rect x="40" y="540" width="1120" height="180" rx="20" fill="#121215" stroke="#27272A"/>
    <text x="70" y="575" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF">TOP SERVICIOS MÁS VENDIDOS</text>
    <text x="70" y="615" font-family="system-ui, sans-serif" font-size="13" fill="#D4D4D8">1. Corte Degradado &amp; Fade — 480 citas este mes (<tspan font-weight="800" fill="#34D399">$16,800,000</tspan>)</text>
    <text x="70" y="645" font-family="system-ui, sans-serif" font-size="13" fill="#D4D4D8">2. Combo Elite (Corte + Barba Vaporizada) — 210 citas (<tspan font-weight="800" fill="#34D399">$11,550,000</tspan>)</text>
    <text x="70" y="675" font-family="system-ui, sans-serif" font-size="13" fill="#D4D4D8">3. Perfilado de Barba Ritual Navaja — 190 citas (<tspan font-weight="800" fill="#34D399">$4,750,000</tspan>)</text>
  </svg>`;

  // 3. agenda-dark.jpg
  const agendaSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#09090B"/>
    <rect width="1200" height="70" fill="#121215"/>
    <line x1="0" y1="70" x2="1200" y2="70" stroke="#27272A" stroke-width="1"/>
    <text x="40" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">AGENDA MULTI-BARBERO INTELIGENTE</text>

    <!-- Header days -->
    <rect x="40" y="100" width="1120" height="60" rx="14" fill="#121215" stroke="#27272A"/>
    <text x="80" y="135" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#A1A1AA">HORA</text>
    <text x="240" y="135" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">CARLOS RUIZ (Puesto 1)</text>
    <text x="560" y="135" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">MATEO ESTILISTA (Puesto 2)</text>
    <text x="880" y="135" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">JULIAN FADE (Puesto 3)</text>

    <!-- Time slot 09:00 -->
    <rect x="40" y="180" width="1120" height="110" rx="14" fill="#121215" stroke="#27272A"/>
    <text x="60" y="235" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#71717A">09:00 AM</text>
    <!-- Slot Barber 1 -->
    <rect x="200" y="190" width="290" height="90" rx="12" fill="#1E3A8A" stroke="#3B82F6"/>
    <text x="215" y="215" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#BFDBFE">Andrés Gómez · $35K</text>
    <text x="215" y="235" font-family="system-ui, sans-serif" font-size="11" fill="#93C5FD">Corte Degradado · 09:00-09:30</text>
    <rect x="215" y="245" width="80" height="20" rx="6" fill="#2563EB"/>
    <text x="225" y="258" font-family="system-ui, sans-serif" font-weight="800" font-size="9" fill="#FFFFFF">CONFIRMADA</text>

    <!-- Slot Barber 2 -->
    <rect x="520" y="190" width="290" height="90" rx="12" fill="#78350F" stroke="#F59E0B"/>
    <text x="535" y="215" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FDE68A">Luis Martínez · $55K</text>
    <text x="535" y="235" font-family="system-ui, sans-serif" font-size="11" fill="#FCD34D">Combo Elite · 09:00-09:50</text>
    <rect x="535" y="245" width="80" height="20" rx="6" fill="#D97706"/>
    <text x="548" y="258" font-family="system-ui, sans-serif" font-weight="800" font-size="9" fill="#FFFFFF">EN CURSO</text>

    <!-- Slot Barber 3 (Libre) -->
    <rect x="840" y="190" width="290" height="90" rx="12" fill="#18181B" stroke="#27272A" stroke-dasharray="4"/>
    <text x="940" y="240" font-family="system-ui, sans-serif" font-weight="600" font-size="12" fill="#71717A">+ Turno Libre</text>

    <!-- Time slot 10:00 -->
    <rect x="40" y="310" width="1120" height="110" rx="14" fill="#121215" stroke="#27272A"/>
    <text x="60" y="365" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#71717A">10:00 AM</text>
    <!-- Slot Barber 1 -->
    <rect x="200" y="320" width="290" height="90" rx="12" fill="#064E3B" stroke="#10B981"/>
    <text x="215" y="345" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#A7F3D0">Camilo Sossa · $55K</text>
    <text x="215" y="365" font-family="system-ui, sans-serif" font-size="11" fill="#6EE7B7">Corte + Barba · 10:00-10:45</text>
    <rect x="215" y="375" width="80" height="20" rx="6" fill="#059669"/>
    <text x="225" y="388" font-family="system-ui, sans-serif" font-weight="800" font-size="9" fill="#FFFFFF">COMPLETADA</text>

    <!-- Slot Barber 2 -->
    <rect x="520" y="320" width="290" height="90" rx="12" fill="#1E3A8A" stroke="#3B82F6"/>
    <text x="535" y="345" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#BFDBFE">Jorge Rojas · $25K</text>
    <text x="535" y="365" font-family="system-ui, sans-serif" font-size="11" fill="#93C5FD">Perfilado Barba · 10:00-10:30</text>

    <!-- Slot Barber 3 -->
    <rect x="840" y="320" width="290" height="90" rx="12" fill="#581C87" stroke="#A855F7"/>
    <text x="855" y="345" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#E9D5FF">David Pardo · $35K</text>
    <text x="855" y="365" font-family="system-ui, sans-serif" font-size="11" fill="#D8B4FE">Corte Fade · 10:00-10:30</text>
  </svg>`;

  // 4. reservas-dark.jpg
  const reservasSvg = `
  <svg width="1200" height="750" viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="750" fill="#09090B"/>
    <rect width="1200" height="70" fill="#121215"/>
    <line x1="0" y1="70" x2="1200" y2="70" stroke="#27272A" stroke-width="1"/>
    <text x="40" y="44" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">SISTEMA DE RESERVAS ONLINE EN 3 CLICS</text>

    <!-- Step 1 -->
    <rect x="40" y="110" width="350" height="580" rx="20" fill="#121215" stroke="#27272A"/>
    <text x="70" y="150" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF">1. ELIGE BARBERO</text>
    
    <rect x="65" y="180" width="300" height="90" rx="16" fill="#18181B" stroke="#D97706"/>
    <text x="85" y="215" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FBBF24">Carlos Ruiz</text>
    <text x="85" y="235" font-family="system-ui, sans-serif" font-size="11" fill="#A1A1AA">Especialista Fade &amp; Barba · 4.9 ★</text>
    <text x="85" y="252" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#34D399">SELECCIONADO ✓</text>

    <rect x="65" y="290" width="300" height="90" rx="16" fill="#18181B" stroke="#27272A"/>
    <text x="85" y="325" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">Mateo Estilista</text>
    <text x="85" y="345" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">Corte Clásico Tijera · 4.8 ★</text>

    <rect x="65" y="400" width="300" height="90" rx="16" fill="#18181B" stroke="#27272A"/>
    <text x="85" y="435" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">Cualquier Profesional</text>
    <text x="85" y="455" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">Asignación automática del primer turno</text>

    <!-- Step 2 -->
    <rect x="420" y="110" width="350" height="580" rx="20" fill="#121215" stroke="#27272A"/>
    <text x="450" y="150" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF">2. FECHA Y HORA</text>
    
    <rect x="445" y="180" width="300" height="70" rx="14" fill="#18181B" stroke="#27272A"/>
    <text x="470" y="210" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">Jueves, 12 de Octubre</text>
    <text x="470" y="230" font-family="system-ui, sans-serif" font-size="11" fill="#34D399">7 turnos disponibles hoy</text>

    <!-- Slots -->
    <rect x="445" y="270" width="90" height="44" rx="10" fill="#D97706"/>
    <text x="468" y="297" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF">14:00</text>

    <rect x="550" y="270" width="90" height="44" rx="10" fill="#18181B" stroke="#27272A"/>
    <text x="573" y="297" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#D4D4D8">14:30</text>

    <rect x="655" y="270" width="90" height="44" rx="10" fill="#18181B" stroke="#27272A"/>
    <text x="678" y="297" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#D4D4D8">15:00</text>

    <rect x="445" y="330" width="90" height="44" rx="10" fill="#18181B" stroke="#27272A"/>
    <text x="468" y="357" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#D4D4D8">15:30</text>

    <rect x="550" y="330" width="90" height="44" rx="10" fill="#18181B" stroke="#27272A"/>
    <text x="573" y="357" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#D4D4D8">16:00</text>

    <rect x="655" y="330" width="90" height="44" rx="10" fill="#18181B" stroke="#27272A"/>
    <text x="678" y="357" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#D4D4D8">16:30</text>

    <!-- Step 3 -->
    <rect x="800" y="110" width="360" height="580" rx="20" fill="#121215" stroke="#27272A"/>
    <text x="830" y="150" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF">3. CONFIRMACIÓN</text>

    <rect x="825" y="180" width="310" height="200" rx="16" fill="#18181B" stroke="#27272A"/>
    <text x="845" y="215" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#A1A1AA">RESUMEN DE RESERVA</text>
    <text x="845" y="245" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">Combo Elite (Corte + Barba)</text>
    <text x="845" y="270" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Jueves 12 Oct · 14:00 PM (50 min)</text>
    <text x="845" y="295" font-family="system-ui, sans-serif" font-size="12" fill="#A1A1AA">Barbero: Carlos Ruiz</text>
    <text x="845" y="335" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#FBBF24">Total: $55,000 COP</text>

    <rect x="825" y="410" width="310" height="48" rx="12" fill="#10B981"/>
    <text x="890" y="440" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF">CONFIRMAR VÍA WHATSAPP</text>

    <text x="825" y="490" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">El cliente recibe confirmación inmediata y recordatorio automático antes de su cita.</text>
  </svg>`;

  await createJpg('finanzas-dark.jpg', finanzasSvg);
  await createJpg('reportes-dark.jpg', reportesSvg);
  await createJpg('agenda-dark.jpg', agendaSvg);
  await createJpg('reservas-dark.jpg', reservasSvg);

  console.log('Generated all dark mockups successfully!');
}

run().catch(console.error);
