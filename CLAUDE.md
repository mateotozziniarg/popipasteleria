# Popipastelería — Reglas del proyecto

## INFRAESTRUCTURA

### Frontend — Vercel
- React 19 + Vite + TypeScript + Tailwind
- Deploy automático: Vercel conecta directo al repo GitHub. Cada push a `main` triggerea un build y deploy automático.
- Variable de entorno en Vercel: `VITE_API_BASE_URL` apuntando al backend Railway.

### Backend — Railway
- Express + Node.js + TypeScript
- Deploy automático: Railway conecta al repo GitHub (branch `main`). Cada push a `main` hace redeploy automático.
- Variables de entorno en Railway: las que el proyecto necesite. Nunca expuestas al frontend.
- Puerto: Railway setea `PORT` automáticamente, el servidor lo lee de `process.env.PORT`.

### Base de datos — Railway PostgreSQL
- PostgreSQL hosteado en Railway, en el mismo proyecto que el backend.
- ORM: Prisma (schema en `backend/prisma/schema.prisma`).
- Variable de entorno `DATABASE_URL` en el servicio backend de Railway, usando referencia interna: `${{Postgres.DATABASE_PUBLIC_URL}}`.
- La DB persiste entre redeploys.

## FLUJO GIT — REGLAS CRÍTICAS

1. **Siempre push directo a `main`.** Nunca ramas feature, nunca PRs, nunca branches de prueba.
2. **Push es parte del flujo normal, no un paso opcional.** Después de cada commit, push inmediato a `main`.
3. **No preguntar "¿hago push?" ni esperar confirmación.** Push va solo.
4. **Si por algún motivo estamos en una branch distinta, mergear a `main` y pushear `main` inmediatamente.**

### Ciclo de trabajo estándar:
1. Editar archivos
2. Verificar que compila sin errores (`npm run build` en frontend, `npx tsc --noEmit` en backend)
3. `git add <archivos>`
4. `git commit -m "mensaje descriptivo"`
5. `git push origin main`

## ESTRUCTURA DE CARPETAS

```
/                        ← Frontend (React + Vite)
  src/
  package.json
  vite.config.ts
backend/                 ← Backend (Express + TypeScript)
  src/
    index.ts             ← Express app, listen en process.env.PORT
    routes/
    services/
  prisma/
    schema.prisma
  package.json
  tsconfig.json
```

## CORS
El backend acepta requests del dominio de Vercel. Configurado con variable de entorno `CORS_ORIGINS` (lista separada por comas). Si no está seteada, acepta todos los orígenes (útil en desarrollo).

## DEV LOCAL
- Frontend `.env.local`: `VITE_API_BASE_URL=http://localhost:3001`
- Backend `.env`: todas las variables de entorno necesarias (nunca commitear este archivo)
- Frontend: `npm run dev` → http://localhost:5173
- Backend: `cd backend && npm run dev` → http://localhost:3001

## REGLAS DE CÓDIGO
- No inventar librerías ni dependencias que no existan
- No generar documentación ni comentarios explicativos en el código salvo que se pida
- No agregar features no pedidas. Si algo no está claro, preguntar antes de asumir
- Avanzar paso a paso. No generar todo el proyecto de una sola vez
