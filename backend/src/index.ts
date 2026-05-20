import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import eventosRouter from './routes/eventos'
import pedidosRouter from './routes/pedidos'
import pedidosGlobalRouter from './routes/pedidosGlobal'
import productosRouter from './routes/productos'
import pedidoProductosRouter from './routes/pedidoProductos'
import materiasPrimasRouter from './routes/materiasPrimas'
import eventoGastosRouter from './routes/eventoGastos'
import gastosGlobalRouter from './routes/gastosGlobal'
import clientesRouter from './routes/clientes'

const app = express()
const port = process.env.PORT || 3001

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : '*'

app.use(cors({ origin: corsOrigins }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/events', eventosRouter)
app.use('/events/:eventoId/pedidos', pedidosRouter)
app.use('/events/:eventoId/gastos', eventoGastosRouter)
app.use('/pedidos/:pedidoId/productos', pedidoProductosRouter)
app.use('/pedidos', pedidosGlobalRouter)
app.use('/productos', productosRouter)
app.use('/materias-primas', materiasPrimasRouter)
app.use('/gastos', gastosGlobalRouter)
app.use('/clientes', clientesRouter)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
