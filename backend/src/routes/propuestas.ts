import { Router, Request, Response } from 'express'
import OpenAI from 'openai'
import prisma from '../lib/prisma'

const router = Router()

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

// GET /propuestas
router.get('/', async (_req: Request, res: Response) => {
  try {
    const propuestas = await prisma.propuesta.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { productos: true, combos: true, ideas: true } },
      },
    })
    res.json(propuestas)
  } catch {
    res.status(500).json({ error: 'Error al obtener propuestas' })
  }
})

// GET /propuestas/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    const propuesta = await prisma.propuesta.findUnique({
      where: { id },
      include: {
        productos: true,
        combos: {
          include: {
            productos: {
              include: { producto: true },
            },
          },
        },
        ideas: true,
      },
    })
    if (!propuesta) {
      res.status(404).json({ error: 'Propuesta no encontrada' })
      return
    }
    res.json(propuesta)
  } catch {
    res.status(500).json({ error: 'Error al obtener propuesta' })
  }
})

// POST /propuestas
router.post('/', async (req: Request, res: Response) => {
  const { nombre, tematica, descripcion } = req.body
  if (!nombre) {
    res.status(400).json({ error: 'nombre es requerido' })
    return
  }
  try {
    const propuesta = await prisma.propuesta.create({
      data: { nombre, tematica, descripcion },
      include: {
        _count: { select: { productos: true, combos: true, ideas: true } },
      },
    })
    res.status(201).json(propuesta)
  } catch {
    res.status(500).json({ error: 'Error al crear propuesta' })
  }
})

// PUT /propuestas/:id
router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { nombre, tematica, descripcion, estado } = req.body
  try {
    const propuesta = await prisma.propuesta.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(tematica !== undefined && { tematica }),
        ...(descripcion !== undefined && { descripcion }),
        ...(estado !== undefined && { estado }),
      },
    })
    res.json(propuesta)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Propuesta no encontrada' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar propuesta' })
  }
})

// DELETE /propuestas/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    await prisma.propuesta.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Propuesta no encontrada' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar propuesta' })
  }
})

// POST /propuestas/:id/productos
router.post('/:id/productos', async (req: Request, res: Response) => {
  const propuestaId = parseInt(req.params.id as string)
  const { nombre, descripcion, precio, notas } = req.body
  if (!nombre) {
    res.status(400).json({ error: 'nombre es requerido' })
    return
  }
  try {
    const producto = await prisma.propuestaProducto.create({
      data: { propuestaId, nombre, descripcion, precio: precio ? parseFloat(precio) : undefined, notas },
    })
    res.status(201).json(producto)
  } catch {
    res.status(500).json({ error: 'Error al agregar producto' })
  }
})

// PUT /propuestas/:id/productos/:productoId
router.put('/:id/productos/:productoId', async (req: Request, res: Response) => {
  const id = parseInt(req.params.productoId as string)
  const { nombre, descripcion, precio, notas } = req.body
  try {
    const producto = await prisma.propuestaProducto.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precio !== undefined && { precio: precio !== null ? parseFloat(precio) : null }),
        ...(notas !== undefined && { notas }),
      },
    })
    res.json(producto)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Producto no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar producto' })
  }
})

// DELETE /propuestas/:id/productos/:productoId
router.delete('/:id/productos/:productoId', async (req: Request, res: Response) => {
  const id = parseInt(req.params.productoId as string)
  try {
    await prisma.propuestaProducto.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Producto no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar producto' })
  }
})

// POST /propuestas/:id/combos
router.post('/:id/combos', async (req: Request, res: Response) => {
  const propuestaId = parseInt(req.params.id as string)
  const { nombre, descripcion, precioCombo, productos } = req.body
  if (!nombre) {
    res.status(400).json({ error: 'nombre es requerido' })
    return
  }
  try {
    const combo = await prisma.propuestaCombo.create({
      data: {
        propuestaId,
        nombre,
        descripcion,
        precioCombo: precioCombo ? parseFloat(precioCombo) : undefined,
        productos: productos
          ? {
              create: productos.map((p: { propuestaProductoId: number; cantidad?: number }) => ({
                propuestaProductoId: p.propuestaProductoId,
                cantidad: p.cantidad ?? 1,
              })),
            }
          : undefined,
      },
      include: {
        productos: { include: { producto: true } },
      },
    })
    res.status(201).json(combo)
  } catch {
    res.status(500).json({ error: 'Error al crear combo' })
  }
})

// PUT /propuestas/:id/combos/:comboId
router.put('/:id/combos/:comboId', async (req: Request, res: Response) => {
  const id = parseInt(req.params.comboId as string)
  const { nombre, descripcion, precioCombo, productos } = req.body
  try {
    if (productos !== undefined) {
      await prisma.propuestaComboProducto.deleteMany({ where: { comboId: id } })
    }
    const combo = await prisma.propuestaCombo.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precioCombo !== undefined && { precioCombo: precioCombo !== null ? parseFloat(precioCombo) : null }),
        ...(productos !== undefined && {
          productos: {
            create: productos.map((p: { propuestaProductoId: number; cantidad?: number }) => ({
              propuestaProductoId: p.propuestaProductoId,
              cantidad: p.cantidad ?? 1,
            })),
          },
        }),
      },
      include: {
        productos: { include: { producto: true } },
      },
    })
    res.json(combo)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Combo no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar combo' })
  }
})

// DELETE /propuestas/:id/combos/:comboId
router.delete('/:id/combos/:comboId', async (req: Request, res: Response) => {
  const id = parseInt(req.params.comboId as string)
  try {
    await prisma.propuestaCombo.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Combo no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar combo' })
  }
})

// POST /propuestas/:id/combos/:comboId/productos
router.post('/:id/combos/:comboId/productos', async (req: Request, res: Response) => {
  const comboId = parseInt(req.params.comboId as string)
  const { propuestaProductoId, cantidad } = req.body
  if (!propuestaProductoId) {
    res.status(400).json({ error: 'propuestaProductoId es requerido' })
    return
  }
  try {
    const item = await prisma.propuestaComboProducto.create({
      data: { comboId, propuestaProductoId: parseInt(propuestaProductoId), cantidad: cantidad ?? 1 },
      include: { producto: true },
    })
    res.status(201).json(item)
  } catch {
    res.status(500).json({ error: 'Error al agregar producto al combo' })
  }
})

// DELETE /propuestas/:id/combos/:comboId/productos/:productoId
router.delete('/:id/combos/:comboId/productos/:productoId', async (req: Request, res: Response) => {
  const comboId = parseInt(req.params.comboId as string)
  const propuestaProductoId = parseInt(req.params.productoId as string)
  try {
    await prisma.propuestaComboProducto.deleteMany({
      where: { comboId, propuestaProductoId },
    })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Error al quitar producto del combo' })
  }
})

// POST /propuestas/:id/ideas
router.post('/:id/ideas', async (req: Request, res: Response) => {
  const propuestaId = parseInt(req.params.id as string)
  const { texto, categoria } = req.body
  if (!texto || !categoria) {
    res.status(400).json({ error: 'texto y categoria son requeridos' })
    return
  }
  try {
    const idea = await prisma.propuestaIdea.create({
      data: { propuestaId, texto, categoria },
    })
    res.status(201).json(idea)
  } catch {
    res.status(500).json({ error: 'Error al agregar idea' })
  }
})

// PUT /propuestas/:id/ideas/:ideaId
router.put('/:id/ideas/:ideaId', async (req: Request, res: Response) => {
  const id = parseInt(req.params.ideaId as string)
  const { texto, categoria } = req.body
  try {
    const idea = await prisma.propuestaIdea.update({
      where: { id },
      data: {
        ...(texto !== undefined && { texto }),
        ...(categoria !== undefined && { categoria }),
      },
    })
    res.json(idea)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Idea no encontrada' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar idea' })
  }
})

// DELETE /propuestas/:id/ideas/:ideaId
router.delete('/:id/ideas/:ideaId', async (req: Request, res: Response) => {
  const id = parseInt(req.params.ideaId as string)
  try {
    await prisma.propuestaIdea.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Idea no encontrada' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar idea' })
  }
})

// POST /propuestas/:id/convertir
router.post('/:id/convertir', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { fecha } = req.body
  if (!fecha) {
    res.status(400).json({ error: 'fecha es requerida' })
    return
  }
  try {
    const propuesta = await prisma.propuesta.findUnique({
      where: { id },
      include: { productos: true },
    })
    if (!propuesta) {
      res.status(404).json({ error: 'Propuesta no encontrada' })
      return
    }

    const evento = await prisma.evento.create({
      data: {
        nombre: propuesta.nombre,
        fecha: new Date(fecha),
        descripcion: propuesta.descripcion,
      },
    })

    for (const pp of propuesta.productos) {
      const existe = await prisma.producto.findFirst({
        where: { nombre: { equals: pp.nombre, mode: 'insensitive' } },
      })
      if (!existe) {
        await prisma.producto.create({
          data: {
            nombre: pp.nombre,
            descripcion: pp.descripcion,
            precioDefault: pp.precio ?? 0,
          },
        })
      }
    }

    await prisma.propuesta.update({
      where: { id },
      data: { eventoId: evento.id, estado: 'CONFIRMADA' },
    })

    res.status(201).json(evento)
  } catch {
    res.status(500).json({ error: 'Error al convertir propuesta' })
  }
})

// POST /propuestas/:id/generar
router.post('/:id/generar', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    const propuesta = await prisma.propuesta.findUnique({
      where: { id },
      include: {
        productos: true,
        combos: { include: { productos: { include: { producto: true } } } },
        ideas: true,
      },
    })
    if (!propuesta) {
      res.status(404).json({ error: 'Propuesta no encontrada' })
      return
    }

    const productosTexto = propuesta.productos.length
      ? propuesta.productos
          .map(
            (p, i) =>
              `${i + 1}. ${p.nombre} (ID: ${p.id})${p.descripcion ? ` — ${p.descripcion}` : ''}${p.precio ? ` — $${p.precio}` : ''}${p.notas ? ` [${p.notas}]` : ''}`
          )
          .join('\n')
      : 'Sin productos cargados'

    const combosTexto = propuesta.combos.length
      ? propuesta.combos
          .map(
            (c, i) =>
              `${i + 1}. ${c.nombre} (ID: ${c.id})${c.precioCombo ? ` — $${c.precioCombo}` : ''}\n   Productos: ${c.productos.map((cp) => `${cp.producto.nombre} x${cp.cantidad}`).join(', ') || 'Sin productos'}`
          )
          .join('\n')
      : 'Sin combos cargados'

    const ideasTexto = propuesta.ideas.length
      ? propuesta.ideas.map((idea) => `- [${idea.categoria}] ${idea.texto}`).join('\n')
      : 'Sin ideas cargadas'

    const userPrompt = `Propuesta de pedido para Popipastelería:
Nombre: ${propuesta.nombre}
Temática: ${propuesta.tematica || 'No especificada'}
Descripción: ${propuesta.descripcion || 'Sin descripción'}

Productos cargados:
${productosTexto}

Combos cargados:
${combosTexto}

Ideas ya cargadas:
${ideasTexto}

Generá sugerencias creativas para esta propuesta. Respondé ÚNICAMENTE con JSON válido en este formato exacto, sin texto adicional:
{
  "productosNuevos": [{"nombre": "...", "descripcion": "...", "precioSugerido": 0, "notas": "..."}],
  "nombresCombo": [{"comboId": 0, "nombresSugeridos": ["...", "..."]}],
  "descripcionesProducto": [{"productoId": 0, "descripcion": "..."}],
  "ideasGenerales": [{"texto": "...", "categoria": "RELLENO|DECORACION|PACKAGING|PRECIO|OTRO"}]
}

Incluí 3-5 productos nuevos, nombres alternativos para cada combo existente, descripciones mejoradas para cada producto existente, y 4-6 ideas generales variadas.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content:
            'Sos un asistente creativo para Popipastelería, una pastelería argentina. Tu tarea es generar sugerencias creativas para propuestas de pedidos. Las sugerencias deben ser originales, con precios en pesos argentinos y orientadas al mercado local. Respondés únicamente con JSON válido, sin explicaciones ni texto adicional.',
        },
        { role: 'user', content: userPrompt },
      ],
    })
    const rawText = completion.choices[0].message.content || ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.status(500).json({ error: 'Respuesta de IA inválida' })
      return
    }
    const sugerencias = JSON.parse(jsonMatch[0])
    res.json(sugerencias)
  } catch (error: any) {
    console.error('Error generando ideas:', error)
    res.status(500).json({ error: 'Error al generar ideas con IA' })
  }
})

export default router
