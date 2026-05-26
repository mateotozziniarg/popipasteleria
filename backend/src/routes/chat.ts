import { Router, Request, Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '../lib/prisma'

const router = Router()

const functionDeclarations = [
  {
    name: 'listar_eventos',
    description: 'Lista todos los eventos de la pastelería con fechas, descripciones y métricas financieras (total esperado, cobrado, gastos)',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'listar_pedidos',
    description: 'Lista pedidos con filtros opcionales. Devuelve los más recientes.',
    parameters: {
      type: 'object',
      properties: {
        estadoPago: { type: 'string', description: 'Filtrar por estado de pago: sin_seña, señado, pagado' },
        estadoEntrega: { type: 'string', description: 'Filtrar por estado de entrega: pendiente, entregado' },
        limite: { type: 'integer', description: 'Cantidad máxima de resultados (default 15)' },
      },
    },
  },
  {
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
  {
    name: 'listar_productos',
    description: 'Lista el catálogo de productos con sus precios default',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'obtener_evento',
    description: 'Obtiene los detalles completos de un evento: pedidos, gastos y métricas financieras',
    parameters: {
      type: 'object',
      properties: {
        eventoId: { type: 'integer', description: 'ID del evento' },
      },
      required: ['eventoId'],
    },
  },
  {
    name: 'crear_pedido',
    description: 'Crea un nuevo pedido en el sistema. Usá esta herramienta solo después de confirmar los datos con el usuario.',
    parameters: {
      type: 'object',
      properties: {
        nombreCliente: { type: 'string', description: 'Nombre completo del cliente' },
        precioTotal: { type: 'number', description: 'Precio total en pesos argentinos' },
        descripcion: { type: 'string', description: 'Descripción del pedido (productos, cantidades, etc.)' },
        fechaEntrega: { type: 'string', description: 'Fecha de entrega en formato YYYY-MM-DD (opcional)' },
        eventoId: { type: 'integer', description: 'ID del evento al que pertenece (opcional)' },
        modalidadEntrega: { type: 'string', description: 'ENVIO o RETIRA (opcional)' },
      },
      required: ['nombreCliente', 'precioTotal'],
    },
  },
  {
    name: 'resumen_financiero',
    description: 'Devuelve un resumen financiero global: total esperado, cobrado, pendiente de cobro y gastos totales',
    parameters: { type: 'object', properties: {} },
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
          cliente: { select: { id: true, nombre: true } },
          productos: { include: { producto: { select: { nombre: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: args.limite || 15,
      })
      return {
        pedidos: pedidos.map(p => ({
          id: p.id,
          nombreCliente: p.nombreCliente,
          precioTotal: parseFloat(p.precioTotal.toString()),
          estadoPago: p.estadoPago,
          estadoEntrega: p.estadoEntrega,
          fechaEntrega: p.fechaEntrega ? p.fechaEntrega.toISOString().split('T')[0] : null,
          evento: p.evento?.nombre || null,
          productos: p.productos.map(pp => pp.producto.nombre),
        })),
      }
    }

    case 'buscar_clientes': {
      const clientes = await prisma.cliente.findMany({
        where: { nombre: { contains: args.query as string, mode: 'insensitive' } },
        take: 10,
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
            include: {
              productos: { include: { producto: { select: { nombre: true } } } },
              cliente: { select: { nombre: true } },
            },
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
          gananciaEstimada: totalEsperado - totalGastos,
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
      const pedido = await prisma.pedido.create({
        data: {
          nombreCliente: args.nombreCliente as string,
          precioTotal: args.precioTotal as number,
          descripcion: (args.descripcion as string) || null,
          fechaEntrega: args.fechaEntrega ? new Date(args.fechaEntrega as string) : null,
          eventoId: (args.eventoId as number) || null,
          modalidadEntrega: (args.modalidadEntrega as any) || null,
        },
      })
      return {
        pedido: {
          id: pedido.id,
          nombreCliente: pedido.nombreCliente,
          precioTotal: parseFloat(pedido.precioTotal.toString()),
        },
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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [{ functionDeclarations }] as any,
      toolConfig: { functionCallingConfig: { mode: 'AUTO' as any } },
      systemInstruction:
        'Sos Popibot, el asistente de Popipastelería, una pastelería argentina. Ayudás a gestionar pedidos, eventos y clientes. Tenés acceso a herramientas para consultar y crear datos en tiempo real. Cuando el usuario quiera crear algo (un pedido, etc.), mostrá un resumen de los datos que vas a guardar y pedí confirmación antes de ejecutar la herramienta. Respondé siempre en español rioplatense, de forma concisa y amigable. Los precios son en pesos argentinos.',
    })

    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }))

    const lastMessage = messages[messages.length - 1] as { role: string; content: string }
    const chat = model.startChat({ history })

    const toolsUsed: string[] = []
    let response = await chat.sendMessage(lastMessage.content)

    let funcCalls = response.response.functionCalls()
    while (funcCalls && funcCalls.length > 0) {
      const functionResultParts = await Promise.all(
        funcCalls.map(async (call) => {
          toolsUsed.push(call.name)
          const result = await executeTool(call.name, call.args as Record<string, any>)
          return {
            functionResponse: {
              name: call.name,
              response: result,
            },
          }
        })
      )
      response = await chat.sendMessage(functionResultParts as any)
      funcCalls = response.response.functionCalls()
    }

    const reply = response.response.text()
    res.json({ reply, toolsUsed })
  } catch (error: any) {
    console.error('Error en chat:', error)
    res.status(500).json({ error: 'Error al procesar el mensaje' })
  }
})

export default router
