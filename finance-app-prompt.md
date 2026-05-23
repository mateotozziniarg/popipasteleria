# Arquitectura base para nueva aplicación web full-stack

**Repositorio:** https://github.com/mateotozziniarg/personal-finance

Vamos a construir una aplicación web full-stack para gestionar finanzas personales. Esta aplicación sigue una arquitectura y conjunto de prácticas ya probadas que debés respetar en todo momento.

---

## OBJETIVO DE LA APP

La app tiene un objetivo central: **saber exactamente a dónde va la plata y encontrar dónde se puede ahorrar**.

### Funcionalidades clave:
- Registrar ingresos y egresos en **pesos argentinos y dólares**
- **Conversión automática con dólar MEP** (tipo de cambio en tiempo real, consumido de una API pública, sin intervención manual)
- **Importación automática de movimientos** desde resúmenes de cuenta de:
  - **Mercado Pago**: el usuario descarga el resumen desde la app/web en formato CSV o Excel, lo sube a esta app, y la app parsea y carga los movimientos automáticamente
  - **Santander Rio**: el usuario descarga el extracto bancario (PDF o CSV desde el home banking), lo sube, y la app parsea y carga los movimientos
- Categorización de gastos (automática por keywords + manual)
- Dashboard con análisis de dónde se gasta más y cómo reducirlo
- Comparación entre períodos (mes vs mes anterior, etc.)

### Lo que NO queremos:
- Carga manual de cada movimiento uno por uno (sí existe la opción, pero no es el flujo principal)
- Conectividad directa a cuentas bancarias (sin APIs bancarias, sin scraping de sesiones)
- El flujo principal es siempre: el usuario descarga el archivo desde el banco/MercadoPago → lo sube a esta app → la app procesa todo

---

## LÓGICA DE NEGOCIO — DETALLE IMPORTANTE

### 1. Carga manual como fallback
Debe existir un formulario de carga manual de movimiento (ingreso o egreso) para cubrir:
- Gastos en efectivo
- Pagos que no aparecen en ningún resumen
- Correcciones manuales

### 2. Transferencias — el problema más complejo
Los resúmenes de Mercado Pago y Santander tienen muchísimas transferencias. Una transferencia puede ser cualquiera de estas cosas:
- Dividir cuenta con la novia
- Dividir un asado/juntada/salida con amigos
- Pagarle al supermercado chino (que no tiene terminal)
- Pagar con débito en el super chino
- Pagar el alquiler al propietario
- Pagarle a la inmobiliaria
- Pagar la tarjeta de crédito
- Vender dólar MEP (aparece como movimiento de "valores/acciones")

**La app no puede saber al principio qué es cada cosa. La solución es un sistema de aprendizaje por mapeo de remitentes/destinatarios:**

- Cada transferencia tiene un remitente o destinatario (nombre, apellido, alias de Mercado Pago o CBU)
- La app guarda una tabla de mapeos: `{ identificador → { categoría, descripción, tipo } }`
- Cuando se importa un resumen, la app intenta matchear automáticamente cada transferencia contra los mapeos conocidos
- Las transferencias sin mapeo conocido quedan en una cola de "sin clasificar"
- **Flujo post-importación**: la app muestra las transferencias sin clasificar una por una y le pregunta al usuario qué es cada una. El usuario responde y puede optar por "guardar este mapeo para siempre" para que en el futuro se clasifique solo
- Todos los mapeos son editables
- Esto mejora progresivamente: al principio hay muchas preguntas, con el tiempo casi ninguna

### 3. Movimientos de inversión / dólar MEP
En los resúmenes aparecen movimientos del tipo "venta de valores" o similar. Estos corresponden a ventas de dólar MEP. La app debe:
- Reconocerlos como una categoría especial: "Venta MEP" (ingreso en pesos producto de vender dólares)
- Trackear cuántos dólares se vendieron y a qué precio (para calcular el tipo de cambio real obtenido)
- Esto se puede mapear como un tipo especial dentro del sistema de categorías

### 4. Gastos fijos
Algunos pagos son recurrentes y predecibles:
- Alquiler (mismo destinatario, monto fijo mensual)
- Tarjeta de crédito (mismo destinatario, monto variable pero siempre el mismo "remitente": banco)
- Servicios, suscripciones, etc.

Gracias al sistema de mapeo por remitente, estos se clasifican automáticamente una vez configurados.

**Feature adicional — Generador de prompt de pago:**
Cuando la app conoce el alias/CBU de un destinatario frecuente (ej: el propietario del alquiler), puede generar un texto listo para copiar:
> "Transferirle $[monto] a [Nombre Apellido], alias [alias]"

Así el usuario no tiene que recordar datos ni buscarlos — copia el texto, abre Mercado Pago y listo.

### 5. Flujo de importación inteligente (paso a paso)

Cuando el usuario sube un resumen (CSV/Excel/PDF):
1. La app parsea todos los movimientos
2. Los que matchean un mapeo conocido → se clasifican automáticamente
3. Los que no matchean → entran a la cola de revisión
4. **La app vuelve al usuario con preguntas específicas**: "Encontré 12 transferencias sin clasificar. ¿Qué es esta transferencia de $15.000 a 'Juan García / alias juangar'?" con opciones sugeridas + campo libre
5. El usuario responde, elige si guardar el mapeo
6. Al final, resumen de todo lo importado clasificado

**Este flujo de preguntas es clave. No asumir, no ignorar — preguntar.**

---

## PASOS MANUALES — IMPORTANTE

**Cada vez que inicies el proyecto o implementes una feature nueva, antes de empezar a codear, listá los pasos manuales que el usuario puede ir haciendo en paralelo para no esperar.**

Ejemplos de pasos manuales típicos al inicio:
1. Crear el repo en GitHub: https://github.com/mateotozziniarg/personal-finance
2. Crear proyecto en Vercel y conectarlo al repo (branch `main`, root `/`)
3. Crear proyecto en Railway, agregar servicio PostgreSQL y servicio web (Node)
4. Copiar `DATABASE_URL` de Railway y configurar variables de entorno:
   - En Railway (backend): `DATABASE_URL`, `JWT_SECRET` (string aleatorio largo), `JWT_EXPIRES_IN=7d`, `CORS_ORIGINS=<url-vercel>`
   - En Vercel (frontend): `VITE_API_BASE_URL=<url-railway-backend>`
5. Mientras el código se genera: el usuario puede ir completando todos los pasos anteriores

**Formato esperado al inicio de cada sesión de trabajo:**

```
Antes de que empiece, hacé esto en paralelo:
[ ] Paso 1...
[ ] Paso 2...
[ ] Paso 3...
Avisame cuando esté listo y sigo.
```

---

## INFRAESTRUCTURA

### Frontend — Vercel
- React 19 + Vite + TypeScript + Tailwind v4
- Deploy automático: Vercel conecta al repo GitHub. Cada push a `main` triggerea build y deploy automático.
- Variable de entorno en Vercel: `VITE_API_BASE_URL` apuntando al backend.

### Backend — Railway
- Express + Node.js + TypeScript
- Deploy automático: Railway conecta al repo GitHub (branch `main`).
- Variables de entorno en Railway: nunca expuestas al frontend.
- Puerto: Railway setea `PORT` automáticamente. El servidor lo lee de `process.env.PORT`.

### Base de datos — Railway PostgreSQL
- PostgreSQL hosteado en Railway, en el mismo proyecto que el backend.
- ORM: Prisma (schema en `backend/prisma/schema.prisma`).
- Variable `DATABASE_URL` en Railway usando referencia interna.
- La DB persiste entre redeploys.

---

## FLUJO GIT — REGLAS CRÍTICAS

1. Siempre push directo a `main`. Sin ramas feature, sin PRs.
2. Push es parte del flujo normal, no un paso opcional. Después de cada commit, push inmediato a `main`.
3. No preguntar "¿hago push?" ni esperar confirmación. Push va solo.

### Ciclo estándar:
1. Editar archivos
2. Verificar que compila (`npm run build` frontend, `npx tsc --noEmit` backend)
3. `git add <archivos>`
4. `git commit -m "mensaje descriptivo"`
5. `git push origin main`

---

## ESTRUCTURA DE CARPETAS

```
/                          ← Frontend (React + Vite)
  src/
    api/
      client.ts            ← Axios singleton + interceptors
      token.ts             ← Gestión de token (localStorage/sessionStorage)
      auth.ts              ← Login endpoint
      [entidad].ts         ← Un archivo por entidad (CRUD functions)
    components/
      Navbar.tsx
      Sidebar.tsx
      BottomNav.tsx        ← Solo mobile (< 640px)
      Modal.tsx            ← Wrapper modal genérico
      ConfirmModal.tsx     ← Diálogo de confirmación
      LoadingSpinner.tsx
      EmptyState.tsx
      ProtectedRoute.tsx
    pages/
      LoginPage.tsx
      DashboardPage.tsx    ← Página principal con KPIs y gráficos
      [Entidad]Page.tsx    ← Una página por entidad
      NotFoundPage.tsx
    App.tsx
    main.tsx
    index.css              ← Tailwind + variables CSS del tema
  vite.config.ts
  package.json
  tsconfig.app.json

backend/
  src/
    index.ts               ← Express app + mount de rutas
    lib/
      prisma.ts            ← Singleton Prisma client
    middleware/
      auth.ts              ← JWT middleware
    routes/
      auth.ts              ← POST /auth/login, GET /auth/me
      [entidad].ts         ← Una ruta por entidad
  prisma/
    schema.prisma
  scripts/
    createUser.ts
  package.json
  tsconfig.json
  tsconfig.scripts.json
```

---

## DEPENDENCIAS

### Frontend
```json
{
  "dependencies": {
    "axios": "^1.7.9",
    "lucide-react": "^1.16.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.x",
    "recharts": "^3.8.1",
    "sonner": "^2.0.7"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.x",
    "@types/react": "^19.0.0",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^4.x",
    "typescript": "~5.7.2",
    "vite": "^6.x"
  }
}
```

### Backend
```json
{
  "dependencies": {
    "@prisma/client": "^6.x",
    "bcryptjs": "^3.x",
    "cors": "^2.8.5",
    "dotenv": "^16.x",
    "express": "^4.x",
    "jsonwebtoken": "^9.x"
  },
  "devDependencies": {
    "@types/bcryptjs": "*",
    "@types/cors": "*",
    "@types/express": "*",
    "@types/jsonwebtoken": "*",
    "@types/node": "*",
    "prisma": "^6.x",
    "ts-node": "*",
    "ts-node-dev": "^2.x",
    "typescript": "^5.7.2"
  }
}
```

---

## AUTENTICACIÓN

### Flujo completo

**Backend:**
- `POST /auth/login`: valida `username` + `password` contra `passwordHash` (bcrypt). Devuelve `{ token, user }`.
- JWT payload: `{ userId, username }`. Expiración: `JWT_EXPIRES_IN` (default `"7d"`).
- Middleware `authMiddleware`: extrae `Authorization: Bearer <token>`, verifica con `jwt.verify`, monta `req.user = { userId, username }`.
- Aplica a todas las rutas excepto `/auth/login`.

**Frontend:**
- `token.ts`: `getToken()`, `setToken(token, remember)`, `clearToken()`.
  - Si "Recordarme" marcado → `localStorage`. Sino → `sessionStorage`.
  - Key: `app_token` (renombrar según la app).
- `client.ts`: Axios con interceptores:
  - Request: agrega `Authorization: Bearer <token>`.
  - Response: si 401 y no es `/auth/login` → `clearToken()` + redirect `/login`.
- `ProtectedRoute.tsx`: si `getToken()` es null → `<Navigate to="/login" />`.

### Variables de entorno del backend
```
JWT_SECRET=<string-largo-aleatorio>
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://...
CORS_ORIGINS=https://mi-app.vercel.app
PORT=3001
```

### Variables de entorno del frontend
```
# .env.local (dev)
VITE_API_BASE_URL=http://localhost:3001

# Vercel (producción)
VITE_API_BASE_URL=https://mi-backend.railway.app
```

### Crear primer usuario
```bash
cd backend && npx ts-node -P tsconfig.scripts.json scripts/createUser.ts <username> <password>
```

---

## BACKEND — PATRONES DE CÓDIGO

### Express app (index.ts)
```typescript
import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth'

const app = express()
const port = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*'
}))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

// Rutas sin autenticación
app.use('/auth', authRouter)

// Middleware de autenticación (aplica a todo lo siguiente)
app.use(authMiddleware)

// Rutas protegidas
app.use('/[entidad]', entidadRouter)

app.listen(port)
```

### Route handlers — patrón estándar
```typescript
// GET all
router.get('/', async (_req, res) => {
  try {
    const items = await prisma.entidad.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Error al obtener datos' })
  }
})

// POST create
router.post('/', async (req, res) => {
  const { campo1, campo2 } = req.body
  if (!campo1) {
    res.status(400).json({ error: 'campo1 es requerido' })
    return
  }
  try {
    const item = await prisma.entidad.create({ data: { campo1, campo2 } })
    res.status(201).json(item)
  } catch {
    res.status(500).json({ error: 'Error al crear' })
  }
})

// PUT update
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const { campo1, campo2 } = req.body
  try {
    const item = await prisma.entidad.update({
      where: { id },
      data: {
        ...(campo1 !== undefined && { campo1 }),
        ...(campo2 !== undefined && { campo2 }),
      },
    })
    res.json(item)
  } catch (e: any) {
    if (e.code === 'P2025') {
      res.status(404).json({ error: 'No encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar' })
  }
})

// DELETE
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    await prisma.entidad.delete({ where: { id } })
    res.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') {
      res.status(404).json({ error: 'No encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar' })
  }
})
```

### Errores Prisma a manejar
- `P2025`: Record not found → 404
- `P2003`: Foreign key constraint → 404 o 400
- `P2002`: Unique constraint violation → 409 Conflict

### Singleton Prisma (lib/prisma.ts)
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Scripts del backend (package.json)
```json
{
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc && npx prisma generate",
  "start": "npx prisma migrate deploy && node dist/index.js"
}
```

---

## FRONTEND — PATRONES DE CÓDIGO

### API client (src/api/client.ts)
```typescript
import axios from 'axios'
import { getToken, clearToken } from './token'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
})

client.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && err.config?.url !== '/auth/login') {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
```

### API functions por entidad (src/api/[entidad].ts)
```typescript
import client from './client'

export async function getEntidades() {
  const { data } = await client.get<Entidad[]>('/entidades')
  return data
}

export async function createEntidad(payload: CreateEntidadDto) {
  const { data } = await client.post<Entidad>('/entidades', payload)
  return data
}

export async function updateEntidad(id: number, payload: UpdateEntidadDto) {
  const { data } = await client.put<Entidad>(`/entidades/${id}`, payload)
  return data
}

export async function deleteEntidad(id: number) {
  await client.delete(`/entidades/${id}`)
}
```

### Token management (src/api/token.ts)
```typescript
const TOKEN_KEY = 'app_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string, remember: boolean) {
  if (remember) localStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}
```

### State management en páginas

No hay context global ni Redux. Todo con `useState` + `useEffect` local:

```typescript
const [items, setItems] = useState<Entidad[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  getEntidades()
    .then(setItems)
    .catch(() => setError('Error al cargar datos'))
    .finally(() => setLoading(false))
}, [])
```

### Modal pattern
```typescript
// Props estándar de todo modal
interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: (item: Entidad) => void
}

// Bloqueo de scroll al abrir
useEffect(() => {
  if (isOpen) document.body.style.overflow = 'hidden'
  return () => { document.body.style.overflow = '' }
}, [isOpen])
```

### Form pattern
```typescript
interface FormState {
  campo1: string
  campo2: string
}

const [form, setForm] = useState<FormState>({ campo1: '', campo2: '' })
const [saving, setSaving] = useState(false)
const [formError, setFormError] = useState<string | null>(null)

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!form.campo1) { setFormError('campo1 es requerido'); return }
  setSaving(true)
  try {
    const item = await createEntidad(form)
    onSaved(item)
    onClose()
  } catch {
    setFormError('Error al guardar')
  } finally {
    setSaving(false)
  }
}
```

### Toast notifications
```typescript
// main.tsx — agregar al render:
import { Toaster } from 'sonner'
// <Toaster richColors position="top-right" />

// Uso en componentes:
import { toast } from 'sonner'
toast.success('Guardado correctamente')
toast.error('Error al guardar')
```

### Gráficos (Recharts)
```typescript
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="nombre" />
    <YAxis />
    <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
    <Bar dataKey="valor" fill="#9CC6EA" />
  </BarChart>
</ResponsiveContainer>
```

### React Router setup (App.tsx)
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        {/* más rutas protegidas */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## ESTILOS — TAILWIND v4

### index.css
```css
@import "tailwindcss";

@theme {
  --color-ds-bg: #F7FAFC;
  --color-ds-primary: #CFE6F7;
  --color-ds-primary-hover: #B6D7F2;
  --color-ds-primary-active: #9CC6EA;
  --color-ds-text: #1F2937;
  --color-ds-text-secondary: #6B7280;
  --color-ds-border: #E5EAF1;
  --color-accent: #9CC6EA;
}
```

### Clases reutilizables (constantes en cada componente)
```typescript
const inputClass = `
  w-full border border-ds-border rounded-lg px-3 py-2 text-sm
  bg-white text-ds-text placeholder-ds-text-secondary
  focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
`
const labelClass = `block text-sm font-medium text-ds-text mb-1`
const btnPrimary = `
  bg-accent hover:bg-ds-primary-active text-white font-medium
  px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50
`
const btnGhost = `
  border border-ds-border text-ds-text-secondary hover:bg-ds-bg
  px-4 py-2 rounded-lg text-sm transition-colors
`
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

---

## DEV LOCAL

```bash
# Frontend
npm run dev                  # http://localhost:5173

# Backend
cd backend && npm run dev    # http://localhost:3001

# Prisma
cd backend && npx prisma migrate dev --name <nombre>   # nueva migración
cd backend && npx prisma studio                        # UI de la DB
cd backend && npx prisma migrate deploy                # aplicar en producción
```

---

## REGLAS DE CÓDIGO

- No inventar librerías ni dependencias que no existan en el package.json
- No generar comentarios en el código salvo que se pida explícitamente
- No agregar features no pedidas. Si algo no está claro, preguntar antes de asumir
- Avanzar paso a paso. No generar todo el proyecto de una sola vez
- No hay context global, Redux, ni Zustand: solo useState + useEffect local
- TypeScript strict mode siempre activado
- No crear archivos de documentación ni README salvo que se pida
- Los imports deben ser explícitos, sin barrel files innecesarios

---

Trabajamos de manera incremental. Cuando te pida una feature, implementala, verificá que compila, y hacé push a main. Nada de branches, nada de PRs.
