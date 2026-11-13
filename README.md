# Mimes — Control de finanzas personales

Aplicación web full stack para registrar ingresos y gastos, organizarlos por categoría y controlar presupuestos. Incluye ingreso rápido de gastos mediante texto/voz en lenguaje natural (en soles) y sugerencia automática de categorías.

**Demo en producción:** [mimes.vercel.app](https://mimes.vercel.app)

## Qué hace

- Autenticación de usuarios con JWT y contraseñas encriptadas (`bcryptjs`)
- Registro, listado y gestión de transacciones (ingresos y gastos)
- Control de presupuestos (`/budgets`)
- Ingreso rápido en lenguaje natural (`parseVoice.js`, ej. *"gasté 2 soles en agua, 10 soles en cerveza"*) y categorización automática por palabras clave (`categorize.js`)
- Validación de datos en backend con Zod

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React, Vite (desplegado en Vercel) |
| Backend | Node.js, Express 5, MySQL (`mysql2`), JWT, Zod (desplegado en Render) |
| Tests & CI/CD | `node --test`, GitHub Actions (`test.yml` y `render-deploy.yml`) |

## Estructura

```text
backend/
  src/
    routes/        auth.js, transactions.js, budgets.js, ai.js
    lib/           categorize.js, parseVoice.js y sus tests unitarios
    middleware/    autenticación y validaciones
    services/      lógica de negocio
    db/            conexión a MySQL
  sql/             scripts de base de datos
frontend/          aplicación React + Vite
.github/workflows/ CI de tests y despliegue automático a Render
```

## Cómo correrlo en local

**1. Backend**

```bash
cd backend
cp .env.example .env
# Configura tus credenciales de MySQL y JWT en .env
npm install
npm run dev
```

**2. Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Tests

El backend incluye pruebas unitarias con el runner nativo de Node (`node --test`) sobre las reglas de categorización y el parser de voz/texto:

```bash
cd backend
npm test
```