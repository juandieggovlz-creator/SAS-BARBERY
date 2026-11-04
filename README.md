# BarberOS — Plataforma SaaS de Gestión Integral y Multisedes para Barberías

![BarberOS Banner](public/logo.png)

> **BarberOS** es una plataforma SaaS empresarial de alto rendimiento diseñada específicamente para barberías independientes y cadenas multisede. Centraliza en una sola suite la agenda en vivo, reservas online públicas, automatización con WhatsApp Business (Meta Cloud API oficial y Baileys QR), control financiero con cierres de caja, liquidación de comisiones, chat interno en tiempo real, CRM de clientes y un portal maestro para Super Administradores.

---

## 🚀 Características Principales

### 🏢 1. Arquitectura Multisedes Empresarial
- **Jerarquía Corporativa:** Una cuenta empresarial (`Company`) puede administrar una o múltiples sedes físicas (`Business`), manteniendo sus operaciones, agendas, barberos y finanzas completamente aislados.
- **Roles y Permisos Estrictos:**
  - 👑 **Super Admin:** Gestión global del SaaS, planes de suscripción, métricas del sistema, auditoría y suplantación de soporte (*impersonation*).
  - 🏢 **Propietario Empresarial (`OWNER`):** Control total de la empresa, selector de sedes en tiempo real, visión consolidada de métricas y gestión de planes.
  - 🏬 **Administrador de Sede (`BRANCH_ADMIN`):** Gestión operativa restringida exclusivamente a su sede asignada.
  - ✂️ **Barbero (`BARBER`):** Acceso individual a agenda personal, control de comisiones y atención de clientes.
- **Invitaciones Seguras:** Invitación de administradores mediante tokens criptográficos de un solo uso con fecha de expiración.

### 📅 2. Agenda Inteligente & Citas
- Calendario interactivo por día, semana y mes con filtro individual o simultáneo de barberos.
- Detección automática y prevención de colisiones de horarios, descansos y bloqueos de agenda.
- Notificaciones en tiempo real, confirmación rápida, reprogramación y cancelación.

### 🌐 3. Páginas Web Públicas de Cada Sede
- Cada sede dispone de su propia URL pública canónica: `https://sas-barbery.vercel.app/b/[slug]`.
- **Editor en Vivo:** Personalización sin código de tema visual (colores de acento, tipografías, encabezados, galería de fotos en Cloudinary, horarios semanales, testimonios y enlaces a redes sociales).
- **Portal de Reservas Directas:** `https://sas-barbery.vercel.app/reserve/[slug]` para que los clientes elijan barbero, servicio, fecha y hora sin registro previo.

### 💬 4. Conexión de WhatsApp Business
- **Meta Cloud API Oficial:** Integración con Facebook Embedded Signup (`FB.login`) y Webhooks para recepción y envío de plantillas de confirmación y recordatorios automáticos.
- **Motor de Conversación Automatizado:** Bot interactivo que guía al cliente en opciones de reserva, consulta de citas o contacto con un asesor humano.
- **Modo Coexistencia / Independiente:** Cada sede puede conectar su propio número o compartir un número central.

### 💰 5. Finanzas, Comisiones y Cierre de Caja
- **Arqueo y Cierre de Caja:** Registro de caja inicial, conteo físico, cálculo automático de diferencias y conciliación por método de pago (Efectivo, Tarjeta, Transferencia).
- **Control de Gastos:** Clasificación por categorías (arriendo, servicios, insumos, sueldos) con trazabilidad de fechas.
- **Liquidación de Comisiones:** Cálculo automático del porcentaje pactado por barbero sobre servicios completados.

### 👥 6. Directorio CRM y Chat de Equipo
- Ficha de cliente con historial cronológico de visitas, preferencias y notas internas.
- Chat interno en tiempo real con canales generales y privados entre administradores y barberos.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework Fullstack** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Lenguaje** | [TypeScript 5](https://www.typescriptlang.org/) (Tipado estricto) |
| **Base de Datos** | [PostgreSQL Serverless](https://neon.tech/) vía [Neon](https://neon.tech/) |
| **ORM & Modelado** | [Prisma ORM 6.19](https://www.prisma.io/) |
| **Estilos & UI** | [Tailwind CSS 4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) + [Framer Motion](https://www.framer.com/motion/) |
| **Autenticación** | Sesiones JWT HttpOnly con [jose](https://github.com/panva/jose) y aislamiento multirrol |
| **Almacenamiento Multimedia**| [Cloudinary](https://cloudinary.com/) (Logos, portadas, avatares y galerías) |
| **Mensajería WhatsApp** | Meta Graph API (Cloud API v21.0) & Baileys WebSocket |
| **Hosting & CI/CD** | [Vercel](https://vercel.com/) |

---

## 🗄️ Esquema de la Base de Datos

```mermaid
erDiagram
    Company ||--o{ Business : "posee (sedes)"
    Company ||--o{ BranchInvitation : "emite"
    Company }o--|| Plan : "está suscrita"
    Company ||--o{ User : "emplea"
    Business ||--o{ Barber : "tiene"
    Business ||--o{ Service : "ofrece"
    Business ||--o{ Client : "registra"
    Business ||--o{ Appointment : "agenda"
    Business ||--o{ Payment : "cobra"
    Business ||--o{ Expense : "gasta"
    Business ||--o{ CashClose : "cierra caja"
    Business ||--o| BusinessPage : "personaliza web"
    Business ||--o| WhatsAppIntegration : "conecta"
    Appointment ||--|| Payment : "genera"
    Barber ||--o{ Appointment : "atiende"
    Client ||--o{ Appointment : "solicita"
    Service ||--o{ Appointment : "incluye"
```

---

## 💎 Estructura de Planes y Tarifas

| Plan | Tarifa Mensual | Sedes Incluidas | Sedes Adicionales | Características Destacadas |
| :--- | :---: | :---: | :---: | :--- |
| **Plan Básico** | $69.900 COP | 1 sede | No disponible | Hasta 3 barberos, agenda digital, catálogo base y soporte estándar. |
| **Plan Profesional** | $119.900 COP | 1 sede | No disponible | Hasta 10 barberos, página web personalizable, control de comisiones y caja. |
| **Plan Premium VIP** | $169.900 COP | 1 sede | +$50.000 COP / mes | **Multisedes habilitado**, hasta 30 barberos, personalización VIP y soporte 24/7. |

> **Fórmula Multisedes:**  
> $$\text{Precio Total} = \$169.900 + \max(0, \text{Sedes Activas} - 1) \times \$50.000$$

---

## ⚙️ Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto basado en la siguiente plantilla:

```env
# Base de Datos (Neon PostgreSQL Pooler)
DATABASE_URL="postgresql://usuario:password@ep-xxxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Seguridad y Criptografía
JWT_SECRET="genera_una_clave_segura_de_64_caracteres_hex"

# Dominio Canónico de la Aplicación
NEXT_PUBLIC_APP_URL="https://sas-barbery.vercel.app"

# Cloudinary (Gestión de Imágenes)
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"

# Meta for Developers (WhatsApp Cloud API Oficial)
NEXT_PUBLIC_META_APP_ID="tu_meta_app_id"
NEXT_PUBLIC_META_CONFIG_ID="tu_meta_config_id"
META_APP_SECRET="tu_meta_app_secret"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="token_de_verificacion_webhook"

# Google OAuth (Autenticación opcional)
GOOGLE_CLIENT_ID="tu_google_client_id"
GOOGLE_CLIENT_SECRET="tu_google_client_secret"
```

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- Node.js 18.18+ o Node.js 20+
- npm o pnpm
- Instancia activa de PostgreSQL o Neon

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/juandieggovlz-creator/SAS-BARBERY.git
   cd SAS-BARBERY
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Sincronizar el esquema de Prisma con la base de datos:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **(Opcional) Ejecutar migración o seed de datos de prueba:**
   ```bash
   node scripts/migrate-companies.js
   ```

5. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🔑 Credenciales de Acceso para Pruebas

Para entornos de prueba o demostración preconfigurados:

| Rol | Correo Electrónico | Contraseña | Panel Asignado |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `superadmin@barberos.com` | `superadmin123` | `/superadmin/dashboard` |
| **Propietario / Dueño** | `admin@admin.com` | `admin123` | `/dashboard` |
| **Barbero de Prueba** | `carlos@barberia.com` | `admin123` | `/barber/dashboard` |

---

## 🛡️ Estándares de Seguridad y Despliegue

1. **Aislamiento Multitenant:** Ninguna consulta en base de datos accede a registros fuera del `businessId` o `companyId` del usuario autenticado.
2. **Cookies Seguras:** Las sesiones se distribuyen de forma estricta entre cookies independientes (`owner_session` y `barber_session`) con atributos `HttpOnly`, `SameSite=Lax` y `Secure`.
3. **Validación TypeScript:** Todo despliegue requiere validación con `npx tsc --noEmit` con 0 errores de tipado.
4. **Dominio Canónico:** Se utiliza [`lib/url.ts`](file:///c:/Users/ADMIN/Documents/JUAN%20V/SAS-BARBERY/lib/url.ts) para garantizar que los enlaces compartidos por WhatsApp, correos e invitaciones apunten exclusivamente al dominio oficial de producción.

---

## 📄 Licencia

Propiedad de **BarberOS SAS**. Todos los derechos reservados.
