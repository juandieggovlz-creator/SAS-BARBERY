# SAS-BARBERY - Sistema de Gestión de Barberías (SaaS)

Este es un sistema robusto y escalable diseñado para la gestión integral de barberías, permitiendo administrar servicios, barberos, clientes y citas con un control estricto de disponibilidad.

## 🛠️ Tecnologías Utilizadas

- **Frontend & Backend**: [Next.js 16](https://nextjs.org/) (App Router, React 19).
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) con [Prisma ORM](https://www.prisma.io/).
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/).
- **Autenticación**: JWT (vía [jose](https://www.npmjs.com/package/jose)), [bcryptjs](https://www.npmjs.com/package/bcryptjs) para hashing y Cookies seguras.
- **Gestión de Fechas**: [Moment.js](https://momentjs.com/) y validaciones nativas de JavaScript.
- **Componentes UI**: [React Big Calendar](https://jquense.github.io/react-big-calendar/) para la agenda y [Sonner](https://sonner.stevenly.me/) para notificaciones.

---

## 🏗️ Arquitectura del Sistema

### 🔐 Roles de Usuario
1.  **ADMIN**: Tiene control total. Puede gestionar barberos (invitaciones), servicios, clientes y ver/editar todas las citas del sistema.
2.  **BARBER**: Rol limitado a su propia gestión. Puede ver su calendario personal, gestionar su disponibilidad (horarios y bloqueos) y atender sus citas asignadas.

### 🛣️ Flujo de Autenticación
- Manejado en `middleware.ts`.
- Las sesiones se almacenan en una cookie `session` cifrada mediante JWT.
- El middleware protege las rutas según el rol:
    - `/barber/*`: Solo accesible por usuarios con rol `BARBER`.
    - `/` (Dashboard Admin) y otros: Solo accesible por `ADMIN`.

---

## 📂 Organización del Código

### Ubicación de Componentes Críticos
-   **[`app/`](file:///c:/Users/ADMIN/Documents/JUAN%20V/SAS-BARBERY/app)**: Contiene las rutas de la aplicación y los endpoints de la API (`/api`).
    -   `api/appointments`: Lógica central de creación y validación de citas.
    -   `api/auth`: Login, logout y registro de barberos.
-   **[`components/`](file:///c:/Users/ADMIN/Documents/JUAN%20V/SAS-BARBERY/components)**: Componentes UI reutilizables (Sidebar, Modales de citas, etc.).
-   **[`lib/`](file:///c:/Users/ADMIN/Documents/JUAN%20V/SAS-BARBERY/lib)**:
    -   `auth.ts`: Lógica de cifrado, descifrado y gestión de sesiones.
    -   `prisma.ts`: Instancia global del cliente de base de datos.
-   **[`prisma/`](file:///c:/Users/ADMIN/Documents/JUAN%20V/SAS-BARBERY/prisma)**:
    -   `schema.prisma`: Definición de la estructura de la base de datos.
    -   `seed.ts`: Datos iniciales para desarrollo.

---

## 🗄️ Base de Datos (Modelos)

El sistema utiliza los siguientes modelos principales:
-   **User**: Credenciales y roles.
-   **Barbershop**: Entidad principal de la barbería.
-   **Barber**: Perfil del barbero vinculado a una barbería.
-   **BarberSchedule**: Horario laboral base por día de la semana (0-6).
-   **BarberBlock**: Bloqueos temporales de tiempo (ej. almuerzo, diligencias).
-   **Service**: Servicios ofrecidos con duración y precio.
-   **Client**: Registro de clientes.
-   **Appointment**: Citas que vinculan cliente, barbero y servicio. Incluye validación de colisiones.

---

## ⚠️ Guía de Mantenimiento

### ✅ ¿Qué se puede tocar?
-   **UI/UX**: Modificar estilos en `globals.css` o componentes en `components/`.
-   **Nuevas Funcionalidades**: Crear nuevas rutas en `app/` siguiendo el patrón existente.
-   **Lógica de Negocio**: Optimizar validaciones en los endpoints de la API.

### 🚫 ¿Qué NO tocar (sin precaución extreme)?
-   **[`lib/auth.ts`](file:///c:/Users/ADMIN/Documents/JUAN%20V/SAS-BARBERY/lib/auth.ts)**: El sistema de cifrado es sensible; cualquier cambio puede cerrar la sesión de todos los usuarios.
-   **[`middleware.ts`](file:///c:/Users/ADMIN/Documents/JUAN%20V/SAS-BARBERY/middleware.ts)**: Controla el acceso de seguridad. Un error aquí puede dejar el sistema abierto o bloqueado.
-   **Prisma Migrations**: No borrar la carpeta `prisma/migrations`. Si cambias el `schema.prisma`, usa siempre `npx prisma migrate dev`.

---

## 🚀 Instalación y Desarrollo

1.  Clonar el repositorio.
2.  Instalar dependencias: `npm install`.
3.  Configurar el `.env` con la variable `DATABASE_URL` y `JWT_SECRET`.
4.  Sincronizar la base de datos: `npx prisma migrate dev`.
5.  (Opcional) Poblar datos: `npx prisma db seed`.
6.  Correr en desarrollo: `npm run dev`.
