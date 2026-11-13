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