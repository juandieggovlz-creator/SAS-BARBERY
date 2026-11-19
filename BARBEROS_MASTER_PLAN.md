# 📐 BARBEROS MASTER PLAN — ADAPTACIÓN RESPONSIVE COMPLETA

Este documento define la hoja de ruta, auditoría técnica, desglose por fases y estado de verificación de la adaptación responsive de la plataforma interna de **BarberOS**.

---

## 1. Dispositivos y Breakpoints Objetivo

| Dispositivo / Pantalla | Ancho Referencia | Breakpoint Tailwind | Enfoque de Diseño |
|---|---|---|---|
| **Celular Pequeño** | 360 px (Galaxy S8/A-series) | Base (`< 640px`) | Mobile-First: 1 col, touch targets ≥ 44px, drawer lateral, bottom nav ergonómico |
| **Celular Habitual** | 390 px (iPhone 12/13/14/15) | Base (`< 640px`) | Tarjetas apiladas, acciones táctiles con pulgar, viewport con safe-areas |
| **Celular Grande** | 430 px (iPhone Pro Max, Pixel) | Base (`< 640px`) | Mayor amplitud de datos, tablas adaptadas en tarjetas, modales fluidos |
| **Tablet Vertical** | 768 px (iPad Mini / Air) | `md` (`≥ 768px`) | 2 columnas en KPI, sidebar colapsable/drawer, tablas con scroll controlado |
| **Portátil / Tablet H.** | 1024 px (iPad Pro, Laptops) | `lg` (`≥ 1024px`) | Sidebar fija permanente, grids de 3-4 columnas, controles extendidos |
| **Escritorio Completo** | 1280 px – 1920 px | `xl` / `2xl` | Diseño holgado, max-width controlado (`max-w-7xl`), sin compresión |

---

## 2. Metodología de Ejecución por Grupos

```
┌────────────────────────────────────────────────────────┐
│ Grupo 1: Sistema Global, Navegación y Layouts          │  ◄── [VERIFICADO ✅]
├────────────────────────────────────────────────────────┤
│ Grupo 2: Dashboard Propietario y Dashboard Barbero     │  ◄── [VERIFICADO ✅]
├────────────────────────────────────────────────────────┤
│ Grupo 3: Agenda y Citas                                │  ◄── [EN PROGRESO 🎯]
├────────────────────────────────────────────────────────┤
│ Grupo 4: Clientes, Barberos y Servicios                │  ◄── [PENDIENTE]
├────────────────────────────────────────────────────────┤
│ Grupo 5: Finanzas y Reportes                           │  ◄── [PENDIENTE]
├────────────────────────────────────────────────────────┤
│ Grupo 6: Chat Interno y Notas                          │  ◄── [PENDIENTE]
├────────────────────────────────────────────────────────┤
│ Grupo 7: Configuración y Membresía                     │  ◄── [PENDIENTE]
├────────────────────────────────────────────────────────┤
│ Grupo 8: Super Admin                                   │  ◄── [PENDIENTE]
├────────────────────────────────────────────────────────┤
│ Grupo 9: Página Pública de Reservas y Revisión Final   │  ◄── [PENDIENTE]
└────────────────────────────────────────────────────────┘
```

---

## 3. Estado de Módulos y Grupos

| Grupo | Módulos Comprendidos | Estado | Verificación Técnica |
|---|---|---|---|
| **Grupo 1: Sistema Global & Layouts** | `app/layout.tsx`, `OwnerSidebar`, `TopBar`, `OwnerBottomNav`, `OwnerLayoutWrapper`, `BarberLayout`, `BarberTopBar`, `BarberBottomNav`, `SuperAdminLayout`, `SuperAdminSidebar`, `SuperAdminTopBar`, `GlobalSearchModal` | 🟢 **VERIFICADO** | TypeScript ✅ (0 errores), Build ✅ (133/133 páginas), Drawers ✅, Bottom Navs ✅ |
| **Grupo 2: Dashboards** | `/dashboard`, `/barber/dashboard` | 🟢 **VERIFICADO** | TypeScript ✅ (0 errores), Build ✅ (133/133 páginas), Donut responsive ✅, Mobile cards ✅, Modales con max-h + backdrop ✅ |
| **Grupo 3: Agenda & Citas** | `/calendar`, `/appointments`, `/barber/calendar`, `/barber/appointments` | ⚪ Pendiente | Requiere aprobación G2 |
| **Grupo 4: Clientes, Barberos & Servicios** | `/clients`, `/clients/[id]`, `/barbers`, `/services`, `/barber/services` | ⚪ Pendiente | Requiere aprobación G3 |
| **Grupo 5: Finanzas & Reportes** | `/finances`, `/reports`, `/barber/commissions`, `/barber/performance` | ⚪ Pendiente | Requiere aprobación G4 |
| **Grupo 6: Chat & Notas** | `/chat`, `/notes`, `/barber/chat` | ⚪ Pendiente | Requiere aprobación G5 |
| **Grupo 7: Configuración & Membresía** | `/settings`, `/subscription`, `/integrations`, `/branches`, `/support`, `/barber/profile`, `/barber/settings` | ⚪ Pendiente | Requiere aprobación G6 |
| **Grupo 8: Super Admin** | `/superadmin/*` (16 subpáginas administrativas) | ⚪ Pendiente | Requiere aprobación G7 |
| **Grupo 9: Reservas & Cierre** | `/(public)/b/[slug]`, `/reserve/[slug]`, Auditoría global final | ⚪ Pendiente | Requiere aprobación G8 |

---

## 4. Auditoría Inicial y Soluciones Implementadas en Grupo 1

### A. Sistema Global & Viewport
- **Problema previo:** En `app/layout.tsx` no se exportaba la configuración de `viewport`, lo cual provocaba zoom accidental en iOS al enfocar inputs de texto y falta de control sobre insets de pantalla completa.
- **Solución implementada:** Se exportó `export const viewport: Viewport` con `width: 'device-width'`, `initialScale: 1`, `maximumScale: 5` y soporte para tema claro/oscuro.
- **Anti-overflow y Safe Areas en `app/globals.css`:** Se crearon utilidades CSS para `.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe`, `.touch-manipulation`, `.no-scrollbar` y regla global anti-overflow horizontal `html, body { overflow-x: hidden; max-width: 100vw; }`.

### B. Navegación del Propietario (`OwnerSidebar` + `TopBar` + `OwnerBottomNav`)
- **Problema previo:** `OwnerSidebar` renderizaba un botón flotante `fixed top-3 left-4` que se montaba encima del título en `TopBar` en pantallas móviles y tenía fondo blanco forzado que rompía el modo oscuro.
- **Solución implementada:**
  1. Se eliminó el botón flotante huérfano.
  2. Se integró el disparador de menú móvil directamente dentro de `TopBar` en el extremo izquierdo (`md:hidden`), con touch target ergonómico de 40px y soporte dark mode.
  3. Los controles derechos de `TopBar` se adaptaron: búsqueda compacta icon-only en móvil, botón "Nueva Cita" reducido a `+` en `< 640px` y completo en `sm+`, evitando cualquier desborde horizontal en 360px.
  4. Se creó `OwnerBottomNav` (Barra inferior móvil) fija con acceso rápido a 4 secciones clave: Inicio, Agenda, Citas, Finanzas y botón "Menú" para abrir el drawer completo.
  5. Se creó `OwnerLayoutWrapper` para encapsular la estructura y se aplicó de forma atómica a las 16 rutas del propietario mediante `scripts/write-layouts.js`.
  6. Se implementó bloqueo de scroll de fondo (`body scroll lock`) y cierre con tecla `Escape` en el drawer móvil.

### C. Navegación del Barbero (`BarberLayout` + `BarberTopBar` + `BarberBottomNav`)
- **Problema previo:** En pantallas móviles se renderizaba una cabecera fija de 56px (`md:hidden fixed top-0`) y justo debajo se renderizaba `BarberTopBar` sticky de 64px, duplicando toggles de tema, campanas de notificación y robando más de 120px verticales de pantalla.
- **Solución implementada:**
  1. Se eliminó la cabecera móvil duplicada en `BarberLayout`.
  2. Se integró el botón de menú móvil dentro de `BarberTopBar`, unificando en una sola barra responsive de 64px el título, avatar de barbero, tema y notificaciones.
  3. Se creó `BarberBottomNav` para acceso con un solo pulgar a: Inicio, Mi Agenda, Horarios, Comisiones y Menú.
  4. Se añadió `pb-24 md:pb-8` en el contenedor principal para que los controles inferiores nunca queden tapados.
  5. Se implementó bloqueo de scroll de fondo y tecla `Escape` en el drawer de barbero.

### D. Navegación de SuperAdmin (`SuperAdminLayout` + `SuperAdminSidebar` + `SuperAdminTopBar`)
- **Problema previo:** `SuperAdminSidebar` tenía una cabecera fija móvil que colisionaba con `SuperAdminTopBar` (que no tenía offset `pt`), aplastando la barra superior y ocultando la búsqueda de administradores en móvil.
- **Solución implementada:**
  1. Se unificó la cabecera en `SuperAdminTopBar`, integrando el botón de menú móvil y badge de modo Master.
  2. Se añadió botón de búsqueda móvil (`sm:hidden`) con overlay desplegable para buscar barberías, usuarios y correos en pantallas móviles.
  3. Se añadió bloqueo de scroll y animación fluida al drawer de SuperAdmin.

### E. Búsqueda Global (`GlobalSearchModal`)
- **Problema previo:** El espaciado superior `pt-20` forzado empujaba el modal fuera de pantalla en celulares pequeños (360px) al abrirse el teclado virtual.
- **Solución implementada:** Se ajustó a `pt-4 sm:pt-20`, `max-h-[60vh] sm:max-h-96` en la lista de resultados, esquinas `rounded-2xl sm:rounded-3xl` y bloqueo de scroll de fondo.

---

## 5. Registro de Pruebas y Validación Técnica

- **`npx tsc --noEmit`:** ✅ 0 errores de TypeScript.
- **`npm run build`:** ✅ Compilación exitosa de 134/134 páginas en modo producción Next.js 16.2.2 Turbopack.
- **Breakpoints Auditados Estáticamente en Layout:**
  - `360 px`: TopBar sin overflow horizontal, drawer fluido (ancho máximo 85vw), bottom nav 5 botones accesibles, espacio libre vertical optimizado.
  - `390 px`: Títulos legibles con truncate preventivo, botones táctiles ≥ 40px, safe areas activas.
  - `430 px`: Margen cómodo para acciones de TopBar.
  - `768 px` (Tablet): Ocultamiento automático de bottom nav, sidebar colapsable en drawer o fija según modo.
  - `1024 px` (Laptop) & `1280 px+` (Desktop): Sidebar fija permanente a 256px (`w-64`), navegación desktop intacta con jerarquía y shortcuts visibles (`Ctrl K`).

---

## 6. MÓDULO DE ANTICIPOS Y PAGOS MANUALES (NEQUI, BRE-B, TRANSFERENCIA) — PLAN TÉCNICO

### Objetivo
Sistema integral de anticipos de reserva mediante Nequi, Bre-B y transferencias bancarias con verificación manual humana, integrado nativamente con reservas públicas, agenda, finanzas, cierres de caja, notificaciones y multi-sede.

### Estructura de Fases del Módulo
1. **Fase 1 — Configuración:** Activación, porcentaje/fijo, alcance (todos/específicos), Nequi, Bre-B, bancos, subida de QRs oficiales, plazos y políticas de devolución.
2. **Fase 2 — Reservas Públicas:** Desglose precio total/anticipo/saldo, selector de método con datos y QR, subida de comprobante, retención temporal de horario y consulta de estado seguro.
3. **Fase 3 — Integración con Pagos y Finanzas:** Registro atómico del anticipo y del saldo restante sin duplicidad de ingresos, trazabilidad de auditoría, impacto exacto en cierres de caja.
4. **Fase 4 — Centro de Verificación:** Bandeja "Anticipos por verificar" con previsualización de comprobante, confirmación con advertencia de verificación bancaria, rechazo y solicitud de corrección.
5. **Fase 5 — Notificaciones:** Contador e indicador en campana de TopBar, correos automáticos vía Resend (recibido, confirmado, rechazado).
6. **Fase 6 — Agenda y Citas:** Chips visuales de estado de anticipo (reloj, verificación, check, alerta) y modal con desglose total/anticipo/saldo.
7. **Fase 7 — Seguridad y Control:** Aislamiento multi-tenant y por sede, validación estricta de comprobantes en Cloudinary, prevención de colisiones.
8. **Fase 8 — Responsive y Experiencia:** Adaptación ergonómica en móvil (360px a 430px) para propietarios, barberos y clientes.
9. **Fase 9 — Pruebas Integrales:** Simulación del ciclo completo de punta a punta.

**Estado Actual:** Auditoría Técnica completada. Esperando autorización para inicio de Fase 1.

---

## 7. MOTION SITES CINEMATIC WEB EXPERIENCE (`/b/[slug]` & `/webpage`)

### Objetivo
Transformar las páginas públicas individuales de cada barbería en experiencias web editoriales y cinematográficas de alto impacto (inspiradas en Motion Sites), preservando los 10 temas, las 5 familias tipográficas, la velocidad en móviles y la claridad del flujo de reservas.

### Estado de Fases
| Fase | Descripción | Estado | Verificación |
|---|---|---|---|
| **Fase 1** | **Hero Cinematográfico Definitivo & Dirección Artística** (`lib/motion-presets.ts`, `components/public/CinematicHero.tsx`, `components/public/CanvasScrollSequence.tsx`, integración en `app/(public)/b/[slug]/page.tsx`): Composición editorial multicapa (Motion Sites / 21st.dev), fotografía protagonista de 2048px nítida desde la carga sin overlays negros masivos, monograma arquitectónico en capa parallax desacoplada, tipografía display `clamp()` balanceada, pill de eslogan en cristal pulido, descripción breve editable, CTAs unificados con microinteracciones y dock operativo inferior en vivo con estado, dirección y scroll suave. | 🟢 **COMPLETADO Y VERIFICADO** | TypeScript ✅ (0 errores), GSAP + ScrollTrigger con `useGSAP()` y `matchMedia()` cleanup ✅, `prefers-reduced-motion` ✅, Responsive `360px`–`1440px` ✅ |
| **Fase 2** | **Transiciones Narrativas entre Secciones** (`components/public/NarrativeSection.tsx`: `NarrativeSection`, `CinematicStatementBand`, capítulos `01` a `06` con `clip-reveal`, `elevation-overlap`, `editorial-frame`, parallax diferencial y anclas `#ubicacion` / `#horarios`) | 🟢 **COMPLETADO Y VERIFICADO** | TypeScript ✅ (0 errores), `useGSAP()` + `gsap.matchMedia()` ✅, `prefers-reduced-motion` ✅, Reservas intactas ✅ |
| **Fase 3** | **Servicios, Barberos y Galería Inmersivos** (`components/public/ImmersiveCatalog.tsx`: `EditorialServicesShowcase`, `EditorialBarbersShowcase`, `ImmersiveGalleryShowcase` con mosaico asimétrico y Lightbox navegable) | 🟢 **COMPLETADO Y VERIFICADO** | TypeScript ✅ (0 errores), Spotlight interactivo ✅, Retrato 4:5 ✅, Lightbox con teclado ✅, Multi-selección y reserva directa ✅ |
| **Fase 4** | **Modernización Visual de Reservas** (`components/public/CinematicBookingWidget.tsx`: barra de progreso arquitectónica, resumen persistente en vivo, transiciones ágiles entre pasos y soporte estructural de anticipos manuales Nequi/Bre-B/Transferencia) | 🟢 **COMPLETADO Y VERIFICADO** | TypeScript ✅ (0 errores), 5 pasos verificados ✅, Resumen en vivo ✅, Preparación para anticipos ✅ |
| **Fase 5** | **Controles de Personalización en el Constructor (`/webpage`)** (`app/webpage/page.tsx`, `app/api/owner/webpage/route.ts`, `app/api/public/b/[slug]/route.ts`, `lib/motion-presets.ts`: Selector de estilo Elegante / Cinematográfico / Dinámico en vivo + Modo Avanzado de Secuencia por Scroll sin migración destructiva) | 🟢 **COMPLETADO Y VERIFICADO** | TypeScript ✅ (0 errores), Vista previa en vivo (`postMessage`) ✅, Persistencia retrocompatible ✅ |
| **Fase 6** | **Refinamiento Editorial Integral, Contenido 100% Dinámico y Sincronización Total (`/b/[slug]` & `/webpage`)**: Hero equilibrado y nítido en escritorio y móvil (`CinematicHero.tsx`), servicios en lista editorial vertical sin huecos (`ImmersiveCatalog.tsx`), barberos centrados automáticamente según cantidad (`1`, `2`, `3`, `4+`), banda intermedia de alta resolución sin zoom pixelado (`NarrativeSection.tsx`), galería con categorías personalizadas + vinculación a servicio real + reordenamiento + aviso de baja resolución (`lib/gallery.ts`, `app/api/owner/webpage/gallery/route.ts`), testimonios editoriales reales, sección `#contacto`/`#horarios`/`#ubicacion` siempre presente con mapa interactivo, consola de reservas a 2 columnas en escritorio (`CinematicBookingWidget.tsx`), y footer con 5 políticas oficiales | 🟢 **COMPLETADO Y VERIFICADO** | TypeScript ✅ (0 errores), Cero textos inventados ✅, Sincronización en vivo de nombre comercial, eslogan, dirección y galería ✅ |
| **Fase 7** | **Pruebas Integrales y Compatibilidad** (Validación end-to-end con configuraciones existentes) | 🟢 **COMPLETADO Y VERIFICADO** | Validación de rutas públicas y editor en vivo ✅ |


