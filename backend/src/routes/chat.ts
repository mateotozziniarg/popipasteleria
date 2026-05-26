import { Router, Request, Response } from 'express'
import OpenAI from 'openai'
import prisma from '../lib/prisma'

const router = Router()

const SYSTEM_PROMPT = `Sos Popibot, el asistente de Popipastelería, una pastelería argentina. Ayudás a gestionar pedidos, eventos y clientes. Tenés acceso a herramientas para consultar y crear datos en tiempo real.

REGLAS CRÍTICAS PARA CREAR PEDIDOS:
1. El sistema busca automáticamente cada producto en el catálogo usando coincidencia flexible (parcial y por palabras clave). No hace falta que busques vos — el backend lo resuelve.
2. Si la herramienta devuelve un error con "productosSinPrecio", significa que uno o más productos NO existen en el catálogo y no tienen precio. En ese caso, INMEDIATAMENTE preguntale al usuario el precio unitario de cada uno. No intentes crear el pedido hasta tenerlo.
3. Nunca asumas un precio de $0 para un producto. Si no sabés el precio, preguntá.
4. Antes de ejecutar crear_pedido, confirmá con el usuario: qué productos, cantidades, precios y cliente.

Respondé siempre en español rioplatense, de forma concisa y amigable. Los precios son en pesos argentinos.`

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'listar_eventos',
      description: 'Lista todos los eventos de la pastelería con fechas, descripciones y métricas financieras (total esperado, cobrado, gastos)',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_pedidos',
      description: 'Lista pedidos con filtros opcionales. Devuelve los más recientes.',
      parameters: {
        type: 'object',
        properties: {
          estadoPago: { type: 'string', description: 'Filtrar por estado de pago: sin_seña, señado, pagado' },
          estadoEntrega: { type: 'string', description: 'Filtrar por estado de entrega: pendiente, entregado' },
          limite: { description: 'Cantidad máxima de resultados (default 15). Número entero.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_clientes',
      description: 'Busca clientes por nombre parcial',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Nombre o parte del nombre del cliente a buscar' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_productos',
      description: 'Lista el catálogo de productos con sus precios default',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'obtener_evento',
      description: 'Obtiene los detalles completos de un evento: pedidos, gastos y métricas financieras',
      parameters: {
        type: 'object',
        properties: {
          eventoId: { description: 'ID numérico del evento' },
        },
        required: ['eventoId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_pedido',
      description: 'Crea un nuevo pedido con sus productos. El sistema busca cada producto en el catálogo por nombre (coincidencia parcial). Si no existe, lo crea. El precioTotal se calcula automáticamente si se incluyen productos con precio.',
      parameters: {
        type: 'object',
        properties: {
          nombreCliente: { type: 'string', description: 'Nombre completo del cliente' },
          descripcion: { type: 'string', description: 'Descripción general del pedido. Omitir si se usan productos.' },
          fechaEntrega: { type: 'string', description: 'Fecha de entrega en formato YYYY-MM-DD. Omitir si no se indicó.' },
          modalidadEntrega: { type: 'string', description: 'ENVIO o RETIRA. Omitir si no se indicó.' },
          telefono: { type: 'string', description: 'Teléfono del cliente. Omitir si no se proporcionó.' },
          direccion: { type: 'string', description: 'Dirección del cliente. Omitir si no se proporcionó.' },
          productos: {
            type: 'array',
            description: 'Lista de productos del pedido. Siempre incluir si se mencionaron productos.',
            items: {
              type: 'object',
              properties: {
                nombre: { type: 'string', description: 'Nombre del producto tal como lo dijo el usuario. El sistema lo buscará en el catálogo.' },
                cantidad: { description: 'Cantidad. Número entero.' },
                precioUnitario: { description: 'Precio unitario en pesos. Omitir si no se mencionó (se usa el precio del catálogo).' },
              },
              required: ['nombre', 'cantidad'],
            },
          },
        },
        required: ['nombreCliente'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resumen_financiero',
      description: 'Devuelve un resumen financiero global: total esperado, cobrado, pendiente de cobro y gastos totales',
      parameters: { type: 'object', properties: {} },
    },
  },
]

async function executeTool(name: string, args: Record<string, any>): Promise<Record<string, any>> {
  switch (name) {
    case 'listar_eventos': {
      const eventos = await prisma.evento.findMany({
        orderBy: { fecha: 'asc' },
        include: {
          pedidos: { select: { precioTotal: true, estadoPago: true } },
          gastos: { select: { monto: true } },
        },
      })
      return {
        eventos: eventos.map(({ pedidos, gastos, ...ev }) => {
          const totalEsperado = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
          const totalCobrado = pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
          const totalGastos = gastos.reduce((s, g) => s + parseFloat(g.monto.toString()), 0)
          return {
            id: ev.id,
            nombre: ev.nombre,
            fecha: ev.fecha.toISOString().split('T')[0],
            descripcion: ev.descripcion,
            cantidadPedidos: pedidos.length,
            totalEsperado,
            totalCobrado,
            totalGastos,
          }
        }),
      }
    }

    case 'listar_pedidos': {
      const pedidos = await prisma.pedido.findMany({
        where: {
          ...(args.estadoPago ? { estadoPago: args.estadoPago as any } : {}),
          ...(args.estadoEntrega ? { estadoEntrega: args.estadoEntrega as any } : {}),
        },
        include: {
          evento: { select: { id: true, nombre: true } },
          productos: { include: { producto: { select: { nombre: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.max(1, parseInt(String(args.limite)) || 15),
      })
      return {
        pedidos: pedidos.map(p => ({
          id: p.id,
          nombreCliente: p.nombreCliente,
          precioTotal: parseFloat(p.precioTotal?.toString() ?? '0'),
          estadoPago: p.estadoPago ?? null,
          estadoEntrega: p.estadoEntrega ?? null,
          fechaEntrega: p.fechaEntrega ? p.fechaEntrega.toISOString().split('T')[0] : null,
          evento: p.evento?.nombre ?? null,
          productos: p.productos.map(pp => pp.producto?.nombre ?? 'desconocido'),
        })),
      }
    }

    case 'buscar_clientes': {
      const query = typeof args.query === 'string' ? args.query.trim() : ''
      const clientes = await prisma.cliente.findMany({
        where: query.length > 0 ? { nombre: { contains: query, mode: 'insensitive' } } : undefined,
        take: 20,
        select: { id: true, nombre: true, telefono: true, direccion: true },
      })
      return { clientes }
    }

    case 'listar_productos': {
      const productos = await prisma.producto.findMany({
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true, descripcion: true, precioDefault: true },
      })
      return {
        productos: productos.map(p => ({
          ...p,
          precioDefault: parseFloat(p.precioDefault.toString()),
        })),
      }
    }

    case 'obtener_evento': {
      const evento = await prisma.evento.findUnique({
        where: { id: args.eventoId as number },
        include: {
          pedidos: {
            include: { productos: { include: { producto: { select: { nombre: true } } } } },
          },
          gastos: { include: { materiaPrima: { select: { nombre: true } } } },
        },
      })
      if (!evento) return { error: 'Evento no encontrado' }
      const totalEsperado = evento.pedidos.reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
      const totalCobrado = evento.pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
      const totalGastos = evento.gastos.reduce((s, g) => s + parseFloat(g.monto.toString()), 0)
      return {
        evento: {
          id: evento.id,
          nombre: evento.nombre,
          fecha: evento.fecha.toISOString().split('T')[0],
          descripcion: evento.descripcion,
          totalEsperado,
          totalCobrado,
          totalGastos,
          pendiente: totalEsperado - totalCobrado,
          pedidos: evento.pedidos.map(p => ({
            id: p.id,
            nombreCliente: p.nombreCliente,
            precioTotal: parseFloat(p.precioTotal.toString()),
            estadoPago: p.estadoPago,
            estadoEntrega: p.estadoEntrega,
          })),
          gastos: evento.gastos.map(g => ({
            id: g.id,
            monto: parseFloat(g.monto.toString()),
            descripcion: g.descripcion,
            materiaPrima: g.materiaPrima?.nombre || null,
          })),
        },
      }
    }

    case 'crear_pedido': {
      type ProdInput = { nombre: string; cantidad: any; precioUnitario?: any }
      const productosInput: ProdInput[] = Array.isArray(args.productos) ? args.productos : []

      // Load full catalog once for fuzzy matching
      const catalogo = await prisma.producto.findMany({ select: { id: true, nombre: true, precioDefault: true } })

      function buscarEnCatalogo(nombreBuscado: string) {
        const inputNorm = nombreBuscado.toLowerCase().trim()
        // Strategy 1: catalog name is contained in input or input is contained in catalog name
        let match = catalogo.find(p => {
          const pNorm = p.nombre.toLowerCase()
          return pNorm.includes(inputNorm) || inputNorm.includes(pNorm)
        })
        if (match) return match
        // Strategy 2: significant words of catalog name appear in input
        match = catalogo.find(p => {
          const words = p.nombre.toLowerCase().split(/\s+/).filter(w => w.length > 3)
          return words.some(w => inputNorm.includes(w))
        })
        if (match) return match
        // Strategy 3: significant words of input appear in catalog name
        const inputWords = inputNorm.split(/\s+/).filter((w: string) => w.length > 3)
        for (const word of inputWords) {
          match = catalogo.find(p => p.nombre.toLowerCase().includes(word))
          if (match) return match
        }
        return null
      }

      // Pre-check: detect products with no catalog match and no price provided
      const sinPrecio: string[] = []
      for (const p of productosInput) {
        const encontrado = buscarEnCatalogo(p.nombre as string)
        const tienePrecio = p.precioUnitario != null && !isNaN(parseFloat(String(p.precioUnitario))) && parseFloat(String(p.precioUnitario)) > 0
        if (!encontrado && !tienePrecio) {
          sinPrecio.push(p.nombre as string)
        }
      }
      if (sinPrecio.length > 0) {
        return {
          error: 'productos_sin_precio',
          mensaje: `Los siguientes productos no existen en el catálogo y no tienen precio definido: ${sinPrecio.join(', ')}. Preguntale al usuario el precio unitario antes de crear el pedido.`,
          productosSinPrecio: sinPrecio,
        }
      }

      // Resolver cliente
      let clienteId: number | null = null
      if (args.telefono || args.direccion) {
        const existente = await prisma.cliente.findFirst({
          where: { nombre: { equals: args.nombreCliente as string, mode: 'insensitive' } },
        })
        if (existente) {
          clienteId = existente.id
          await prisma.cliente.update({
            where: { id: existente.id },
            data: {
              ...(args.telefono ? { telefono: args.telefono as string } : {}),
              ...(args.direccion ? { direccion: args.direccion as string } : {}),
            },
          })
        } else {
          const nuevo = await prisma.cliente.create({
            data: {
              nombre: args.nombreCliente as string,
              telefono: (args.telefono as string) || null,
              direccion: (args.direccion as string) || null,
            },
          })
          clienteId = nuevo.id
        }
      }

      // Resolver productos
      type ResolvedProd = { productoId: number; nombre: string; cantidad: number; precioUnitario: number; esNuevo: boolean }
      const productosResueltos: ResolvedProd[] = []

      for (const p of productosInput) {
        const cantidad = Math.max(1, parseInt(String(p.cantidad)) || 1)
        let encontrado = buscarEnCatalogo(p.nombre as string)
        const precioUnit = p.precioUnitario != null && !isNaN(parseFloat(String(p.precioUnitario)))
          ? parseFloat(String(p.precioUnitario))
          : encontrado ? parseFloat(encontrado.precioDefault.toString()) : 0

        if (!encontrado) {
          const nuevo = await prisma.producto.create({
            data: { nombre: p.nombre as string, precioDefault: precioUnit },
          })
          encontrado = { id: nuevo.id, nombre: nuevo.nombre, precioDefault: nuevo.precioDefault }
        }
        productosResueltos.push({
          productoId: encontrado.id,
          nombre: encontrado.nombre,
          cantidad,
          precioUnitario: precioUnit,
          esNuevo: false,
        })
      }

      // Calcular precioTotal
      let precioTotal: number
      if (productosResueltos.length > 0) {
        precioTotal = productosResueltos.reduce((s, p) => s + p.precioUnitario * p.cantidad, 0)
      } else {
        precioTotal = 0
      }

      const pedido = await prisma.pedido.create({
        data: {
          nombreCliente: args.nombreCliente as string,
          precioTotal,
          descripcion: (args.descripcion as string) || null,
          fechaEntrega: args.fechaEntrega ? new Date(args.fechaEntrega as string) : null,
          modalidadEntrega: (args.modalidadEntrega as any) || null,
          telefono: (args.telefono as string) || null,
          ...(clienteId ? { clienteId } : {}),
        },
      })

      for (const p of productosResueltos) {
        await prisma.pedidoProducto.create({
          data: {
            pedidoId: pedido.id,
            productoId: p.productoId,
            cantidad: p.cantidad,
            precioUnitario: p.precioUnitario,
          },
        })
      }

      return {
        pedido: {
          id: pedido.id,
          nombreCliente: pedido.nombreCliente,
          precioTotal,
          productos: productosResueltos.map(p => ({
            nombre: p.nombre,
            cantidad: p.cantidad,
            precioUnitario: p.precioUnitario,
          })),
        },
        clienteGuardado: clienteId !== null,
        mensaje: 'Pedido creado exitosamente',
      }
    }

    case 'resumen_financiero': {
      const [pedidos, gastos] = await Promise.all([
        prisma.pedido.findMany({ select: { precioTotal: true, estadoPago: true } }),
        prisma.gasto.findMany({ select: { monto: true } }),
      ])
      const totalEsperado = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
      const totalCobrado = pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
      const totalGastos = gastos.reduce((s, g) => s + parseFloat(g.monto.toString()), 0)
      return {
        totalPedidos: pedidos.length,
        totalEsperado,
        totalCobrado,
        pendiente: totalEsperado - totalCobrado,
        totalGastos,
        gananciaEstimada: totalEsperado - totalGastos,
      }
    }

    default:
      return { error: `Herramienta desconocida: ${name}` }
  }
}

router.post('/', async (req: Request, res: Response) => {
  const { messages } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages es requerido' })
    return
  }

  try {
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: (m.role === 'model' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const toolsUsed: string[] = []
    const MODEL = 'llama-3.3-70b-versatile'

    async function callGroq(msgs: OpenAI.Chat.ChatCompletionMessageParam[], withTools = true) {
      try {
        return await groq.chat.completions.create({
          model: MODEL,
          messages: msgs,
          ...(withTools ? { tools, tool_choice: 'auto' as const } : {}),
          max_tokens: 1024,
        })
      } catch (err: any) {
        if (withTools && (err?.code === 'tool_use_failed' || err?.status === 400)) {
          // Groq generó una tool call malformada — reintentar sin tools
          return groq.chat.completions.create({ model: MODEL, messages: msgs, max_tokens: 1024 })
        }
        throw err
      }
    }

    let response = await callGroq(chatMessages)

    let iterations = 0
    while (response.choices[0].finish_reason === 'tool_calls' && iterations < 6) {
      iterations++
      const assistantMsg = response.choices[0].message
      chatMessages.push(assistantMsg)

      for (const call of (assistantMsg.tool_calls || []) as any[]) {
        toolsUsed.push(call.function.name)
        let result: Record<string, any>
        try {
          const args = JSON.parse(call.function.arguments)
          result = await executeTool(call.function.name, args)
        } catch (toolErr: any) {
          result = { error: 'Error al ejecutar la herramienta', detalle: toolErr.message }
        }
        chatMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        })
      }

      response = await callGroq(chatMessages)
    }

    const reply = response.choices[0].message.content || ''
    res.json({ reply, toolsUsed })
  } catch (error: any) {
    console.error('Error en chat:', error)
    res.status(500).json({ error: 'Error al procesar el mensaje' })
  }
})

export default router
