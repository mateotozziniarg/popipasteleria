import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import eventosRouter from './routes/eventos'
import pedidosRouter from './routes/pedidos'

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
app.use('/pedidos', pedidosRouter)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
