import { Router, Request, Response } from 'express'
import OpenAI from 'openai'
import prisma from '../lib/prisma'

const router = Router()

function getSystemPrompt() {
  const ahora = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  const horaActual = new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })

  return `Sos Popibot, el asistente de inteligencia artificial integrado en Popipastelería.
Hoy es ${ahora}, hora actual: ${horaActual} (Argentina).

CONTEXTO DEL NEGOCIO:
Popipastelería es el emprendimiento de pastelería artesanal de Popi (Paulina), que trabaja desde su casa en Buenos Aires, Argentina. Elabora y vende tortas, bombones, cupcakes, macarons y otros productos de pastelería fina. Tiene clientes fijos, atiende eventos (cumpleaños, casamientos, festejos varios) y maneja pedidos por encargo.

EL SOFTWARE QUE USAS:
El software Popipastelería tiene estas secciones:
- **Pedidos**: encargos individuales. Estado de pago: sin_seña (nada pagado), señado (seña/depósito parcial recibido), pagado (todo cobrado). Estado de entrega: pendiente, entregado.
- **Eventos**: agrupan varios pedidos de una misma ocasión (ej: "Casamiento García"). Sirven para ver la rentabilidad total del evento.
- **Clientes**: personas que hacen pedidos, con nombre, teléfono y dirección.
- **Productos**: catálogo de todo lo que hace Popi con precio base.
- **Materias primas**: ingredientes e insumos del negocio con precio por unidad.
- **Gastos**: costos registrados (compra de materias primas u otros gastos). Se asocian opcionalmente a eventos para calcular rentabilidad por evento.
- **Propuestas**: presupuestos/cotizaciones enviados a clientes potenciales antes de confirmar el pedido. Tienen ítems libres (no necesariamente del catálogo), precio total, vigencia y estado (borrador, enviada, aceptada, rechazada).
- **Calendario**: vista mensual de pedidos y eventos por fecha de entrega.

TU ROL:
Sos el asistente de Popi dentro de su propio software. Respondés preguntas sobre el negocio, mostrás datos, creás pedidos, actualizás estados, consultás finanzas. No sos un bot genérico — sos parte integral de la herramienta de trabajo de Popi. Tratá a Popi de vos, tono amigable y directo, sin florituras.

REGLAS IMPORTANTES:
- Usá siempre las herramientas para obtener datos reales. Nunca inventes cifras.
- Para listas largas, mostrá los más relevantes y ofrecé ver más si hace falta.
- Precios siempre en pesos argentinos (ARS). Formato: $1.234.
- "Seña" = depósito parcial. Un pedido "señado" tiene parte del pago pero no el total.
- Si alguien dice "cobrar" o "marcar pagado", usá actualizar_pedido.
- Si pregunta por "hoy" o "mañana", filtrá con fechaDesde/fechaHasta usando la fecha actual.
- Si la pregunta es ambigua, pedí aclaración antes de ejecutar acciones que modifican datos.

FLUJO OBLIGATORIO PARA CREAR UN PEDIDO — seguí estos pasos en orden, sin saltear ninguno:

Paso 1 — Llamá a listar_productos para ver el catálogo completo.
Paso 2 — Identificá qué productos corresponden. Si hay ambigüedad, preguntá cuál.
Paso 3 — Mostrá resumen antes de crear:
  "Voy a crear el pedido:
  - [cantidad] x [nombre exacto] @ $[precio] = $[subtotal]
  Total: $[total]
  ¿Confirmás?"
Paso 4 — Esperá confirmación explícita (sí / dale / confirmar). Sin confirmación, no crees nada.
Paso 5 — Llamá a crear_pedido con nombres EXACTOS del catálogo.`
}

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'listar_pedidos',
      description: 'Lista pedidos con filtros opcionales. Ordenados por fecha de entrega (más próximos primero).',
      parameters: {
        type: 'object',
        properties: {
          estadoPago: { type: 'string', description: 'Filtrar por estado de pago: sin_seña, señado, pagado' },
          estadoEntrega: { type: 'string', description: 'Filtrar por estado de entrega: pendiente, entregado' },
          fechaDesde: { type: 'string', description: 'Fecha de entrega desde (YYYY-MM-DD). Para "hoy" usá la fecha actual.' },
          fechaHasta: { type: 'string', description: 'Fecha de entrega hasta (YYYY-MM-DD). Para "hoy" usá la fecha actual.' },
          clienteNombre: { type: 'string', description: 'Filtrar por nombre del cliente (búsqueda parcial).' },
          sinFecha: { type: 'boolean', description: 'Si true, devuelve solo pedidos sin fecha de entrega asignada.' },
          limite: { type: 'number', description: 'Cantidad máxima de resultados (default 20).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'actualizar_pedido',
      description: 'Actualiza el estado de pago o entrega de un pedido, o registra un pago parcial (seña). Usá esto cuando Popi dice "cobrá", "marcalo como pagado", "ya lo entregué", "registrá una seña", etc.',
      parameters: {
        type: 'object',
        properties: {
          pedidoId: { type: 'number', description: 'ID numérico del pedido a actualizar.' },
          estadoPago: { type: 'string', description: 'Nuevo estado de pago: sin_seña, señado, pagado.' },
          estadoEntrega: { type: 'string', description: 'Nuevo estado de entrega: pendiente, entregado.' },
          montoSeña: { type: 'number', description: 'Monto de seña recibido (en pesos). Solo si estadoPago es señado.' },
        },
        required: ['pedidoId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_eventos',
      description: 'Lista todos los eventos con fechas y métricas financieras (total esperado, cobrado, gastos). Útil para ver qué eventos hay y cuál es su rentabilidad.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'obtener_evento',
      description: 'Obtiene todos los detalles de un evento: lista de pedidos, gastos y métricas financieras. Usá cuando quieran saber el detalle de un evento específico.',
      parameters: {
        type: 'object',
        properties: {
          eventoId: { type: 'number', description: 'ID numérico del evento.' },
        },
        required: ['eventoId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_clientes',
      description: 'Busca clientes por nombre (búsqueda parcial). También sirve para ver si un cliente ya existe antes de crear un pedido.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Nombre o parte del nombre del cliente.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'obtener_cliente',
      description: 'Obtiene el perfil completo de un cliente y su historial de pedidos.',
      parameters: {
        type: 'object',
        properties: {
          clienteId: { type: 'number', description: 'ID numérico del cliente.' },
        },
        required: ['clienteId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_productos',
      description: 'Lista el catálogo completo de productos con sus precios. SIEMPRE llamar antes de crear un pedido.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_materias_primas',
      description: 'Lista las materias primas (ingredientes/insumos) con nombre, unidad de medida y precio por unidad.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_gastos',
      description: 'Lista los gastos registrados, opcionalmente filtrados por fecha o evento.',
      parameters: {
        type: 'object',
        properties: {
          fechaDesde: { type: 'string', description: 'Desde esta fecha (YYYY-MM-DD).' },
          fechaHasta: { type: 'string', description: 'Hasta esta fecha (YYYY-MM-DD).' },
          eventoId: { type: 'number', description: 'Filtrar por evento específico.' },
          limite: { type: 'number', description: 'Cantidad máxima de resultados (default 30).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resumen_financiero',
      description: 'Resumen financiero del negocio: pedidos totales, facturado, cobrado, pendiente de cobro, gastos y ganancia estimada. Opcionalmente filtrado por mes.',
      parameters: {
        type: 'object',
        properties: {
          mes: { type: 'string', description: 'Mes a filtrar en formato YYYY-MM (ej: "2026-05"). Si se omite, devuelve el total histórico.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_propuestas',
      description: 'Lista las propuestas/presupuestos enviados a clientes, con su estado (borrador, enviada, aceptada, rechazada) y totales.',
      parameters: {
        type: 'object',
        properties: {
          estado: { type: 'string', description: 'Filtrar por estado: BORRADOR, ENVIADA, ACEPTADA, RECHAZADA.' },
          limite: { type: 'number', description: 'Cantidad máxima de resultados (default 15).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_pedido',
      description: 'PASO FINAL: crea el pedido SOLO después de mostrar el resumen y recibir confirmación explícita del usuario.',
      parameters: {
        type: 'object',
        properties: {
          nombreCliente: { type: 'string', description: 'Nombre completo del cliente.' },
          descripcion: { type: 'string', description: 'Descripción libre. Omitir si se usan productos del catálogo.' },
          fechaEntrega: { type: 'string', description: 'Fecha de entrega YYYY-MM-DD. Omitir si no se indicó.' },
          modalidadEntrega: { type: 'string', description: 'ENVIO o RETIRA. Omitir si no se indicó.' },
          telefono: { type: 'string', description: 'Teléfono del cliente. Omitir si no se proporcionó.' },
          direccion: { type: 'string', description: 'Dirección de entrega. Omitir si no se proporcionó.' },
          notas: { type: 'string', description: 'Notas internas del pedido (sabores, decoración, indicaciones especiales).' },
          eventoId: { type: 'number', description: 'ID del evento al que pertenece este pedido. Omitir si no corresponde a un evento.' },
          estadoPago: { type: 'string', description: 'Estado inicial de pago: sin_seña (default), señado, pagado.' },
          montoSeña: { type: 'number', description: 'Monto de seña si el estado es señado.' },
          productos: {
            type: 'array',
            description: 'Lista de productos del pedido usando nombres del catálogo.',
            items: {
              type: 'object',
              properties: {
                nombre: { type: 'string', description: 'Nombre del producto (se buscará en el catálogo).' },
                cantidad: { type: 'number', description: 'Cantidad. Número entero.' },
                precioUnitario: { type: 'number', description: 'Precio unitario en pesos. Omitir para usar el precio del catálogo.' },
              },
              required: ['nombre', 'cantidad'],
            },
          },
        },
        required: ['nombreCliente'],
      },
    },
  },
]

async function executeTool(name: string, args: Record<string, any>): Promise<Record<string, any>> {
  switch (name) {

    case 'listar_pedidos': {
      const where: any = {}
      if (args.estadoPago) where.estadoPago = args.estadoPago
      if (args.estadoEntrega) where.estadoEntrega = args.estadoEntrega
      if (args.clienteNombre) where.nombreCliente = { contains: args.clienteNombre, mode: 'insensitive' }
      if (args.sinFecha === true) where.fechaEntrega = null
      if (args.fechaDesde || args.fechaHasta) {
        where.fechaEntrega = {
          ...(args.fechaDesde ? { gte: new Date(args.fechaDesde + 'T00:00:00') } : {}),
          ...(args.fechaHasta ? { lte: new Date(args.fechaHasta + 'T23:59:59') } : {}),
        }
      }
      const pedidos = await prisma.pedido.findMany({
        where,
        include: {
          evento: { select: { id: true, nombre: true } },
          productos: { include: { producto: { select: { nombre: true } } } },
        },
        orderBy: [
          { fechaEntrega: 'asc' },
          { createdAt: 'desc' },
        ],
        take: Math.max(1, Math.min(50, parseInt(String(args.limite)) || 20)),
      })
      return {
        total: pedidos.length,
        pedidos: pedidos.map(p => ({
          id: p.id,
          nombreCliente: p.nombreCliente,
          telefono: p.telefono,
          precioTotal: parseFloat(p.precioTotal?.toString() ?? '0'),
          montoSeña: p.montoSeña ? parseFloat(p.montoSeña.toString()) : null,
          estadoPago: p.estadoPago,
          estadoEntrega: p.estadoEntrega,
          fechaEntrega: p.fechaEntrega ? p.fechaEntrega.toISOString().split('T')[0] : null,
          modalidadEntrega: p.modalidadEntrega,
          descripcion: p.descripcion,
          notas: p.notas,
          evento: p.evento?.nombre ?? null,
          eventoId: p.evento?.id ?? null,
          productos: p.productos.map(pp => pp.producto?.nombre ?? 'desconocido'),
          creado: p.createdAt.toISOString().split('T')[0],
        })),
      }
    }

    case 'actualizar_pedido': {
      const id = parseInt(String(args.pedidoId))
      if (!id) return { error: 'pedidoId es requerido' }
      const pedidoActual = await prisma.pedido.findUnique({ where: { id } })
      if (!pedidoActual) return { error: `No se encontró el pedido #${id}` }

      const data: any = {}
      if (args.estadoPago) data.estadoPago = args.estadoPago
      if (args.estadoEntrega) data.estadoEntrega = args.estadoEntrega
      if (args.montoSeña != null) data.montoSeña = parseFloat(String(args.montoSeña))

      const actualizado = await prisma.pedido.update({ where: { id }, data })
      return {
        ok: true,
        pedido: {
          id: actualizado.id,
          nombreCliente: actualizado.nombreCliente,
          estadoPago: actualizado.estadoPago,
          estadoEntrega: actualizado.estadoEntrega,
          montoSeña: actualizado.montoSeña ? parseFloat(actualizado.montoSeña.toString()) : null,
          precioTotal: parseFloat(actualizado.precioTotal.toString()),
        },
      }
    }

    case 'listar_eventos': {
      const eventos = await prisma.evento.findMany({
        orderBy: { fecha: 'asc' },
        include: {
          pedidos: { select: { precioTotal: true, estadoPago: true, estadoEntrega: true } },
          gastos: { select: { monto: true } },
        },
      })
      return {
        total: eventos.length,
        eventos: eventos.map(({ pedidos, gastos, ...ev }) => {
          const totalEsperado = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
          const totalCobrado = pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
          const totalGastos = gastos.reduce((s, g) => s + parseFloat(g.monto.toString()), 0)
          const pendientesEntrega = pedidos.filter(p => p.estadoEntrega === 'pendiente').length
          return {
            id: ev.id,
            nombre: ev.nombre,
            fecha: ev.fecha.toISOString().split('T')[0],
            descripcion: ev.descripcion,
            cantidadPedidos: pedidos.length,
            pendientesEntrega,
            totalEsperado,
            totalCobrado,
            pendienteCobro: totalEsperado - totalCobrado,
            totalGastos,
            gananciaEstimada: totalEsperado - totalGastos,
          }
        }),
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
          pendienteCobro: totalEsperado - totalCobrado,
          totalGastos,
          gananciaEstimada: totalEsperado - totalGastos,
          pedidos: evento.pedidos.map(p => ({
            id: p.id,
            nombreCliente: p.nombreCliente,
            precioTotal: parseFloat(p.precioTotal.toString()),
            montoSeña: p.montoSeña ? parseFloat(p.montoSeña.toString()) : null,
            estadoPago: p.estadoPago,
            estadoEntrega: p.estadoEntrega,
            fechaEntrega: p.fechaEntrega ? p.fechaEntrega.toISOString().split('T')[0] : null,
            productos: p.productos.map(pp => pp.producto?.nombre ?? 'desconocido'),
            notas: p.notas,
          })),
          gastos: evento.gastos.map(g => ({
            id: g.id,
            monto: parseFloat(g.monto.toString()),
            descripcion: g.descripcion,
            materiaPrima: g.materiaPrima?.nombre || null,
            fecha: g.createdAt.toISOString().split('T')[0],
          })),
        },
      }
    }

    case 'buscar_clientes': {
      const query = typeof args.query === 'string' ? args.query.trim() : ''
      const clientes = await prisma.cliente.findMany({
        where: query.length > 0 ? { nombre: { contains: query, mode: 'insensitive' } } : undefined,
        take: 15,
        select: {
          id: true, nombre: true, telefono: true, direccion: true,
          _count: { select: { pedidos: true } },
        },
        orderBy: { nombre: 'asc' },
      })
      return {
        total: clientes.length,
        clientes: clientes.map(c => ({
          id: c.id,
          nombre: c.nombre,
          telefono: c.telefono,
          direccion: c.direccion,
          cantidadPedidos: c._count.pedidos,
        })),
      }
    }

    case 'obtener_cliente': {
      const cliente = await prisma.cliente.findUnique({
        where: { id: args.clienteId as number },
        include: {
          pedidos: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              precioTotal: true,
              estadoPago: true,
              estadoEntrega: true,
              fechaEntrega: true,
              descripcion: true,
              createdAt: true,
            },
          },
        },
      })
      if (!cliente) return { error: 'Cliente no encontrado' }
      const totalHistorico = cliente.pedidos.reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
      return {
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          direccion: cliente.direccion,
          cantidadPedidos: cliente.pedidos.length,
          totalHistorico,
          pedidosRecientes: cliente.pedidos.map(p => ({
            id: p.id,
            precioTotal: parseFloat(p.precioTotal.toString()),
            estadoPago: p.estadoPago,
            estadoEntrega: p.estadoEntrega,
            fechaEntrega: p.fechaEntrega ? p.fechaEntrega.toISOString().split('T')[0] : null,
            descripcion: p.descripcion,
            fecha: p.createdAt.toISOString().split('T')[0],
          })),
        },
      }
    }

    case 'listar_productos': {
      const productos = await prisma.producto.findMany({
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true, descripcion: true, precioDefault: true },
      })
      return {
        total: productos.length,
        productos: productos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precioDefault: parseFloat(p.precioDefault.toString()),
        })),
      }
    }

    case 'listar_materias_primas': {
      const mps = await prisma.materiaPrima.findMany({
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true, unidad: true, precioUnitario: true },
      })
      return {
        total: mps.length,
        materiasPrimas: mps.map(m => ({
          id: m.id,
          nombre: m.nombre,
          unidad: m.unidad,
          precioUnitario: parseFloat(m.precioUnitario.toString()),
        })),
      }
    }

    case 'listar_gastos': {
      const where: any = {}
      if (args.eventoId) where.eventoId = args.eventoId
      if (args.fechaDesde || args.fechaHasta) {
        where.createdAt = {
          ...(args.fechaDesde ? { gte: new Date(args.fechaDesde + 'T00:00:00') } : {}),
          ...(args.fechaHasta ? { lte: new Date(args.fechaHasta + 'T23:59:59') } : {}),
        }
      }
      const gastos = await prisma.gasto.findMany({
        where,
        include: {
          materiaPrima: { select: { nombre: true, unidad: true } },
          evento: { select: { nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.max(1, Math.min(100, parseInt(String(args.limite)) || 30)),
      })
      const total = gastos.reduce((s, g) => s + parseFloat(g.monto.toString()), 0)
      return {
        cantidadGastos: gastos.length,
        totalGastos: total,
        gastos: gastos.map(g => ({
          id: g.id,
          monto: parseFloat(g.monto.toString()),
          descripcion: g.descripcion,
          materiaPrima: g.materiaPrima ? `${g.materiaPrima.nombre} (${g.materiaPrima.unidad})` : null,
          evento: g.evento?.nombre ?? null,
          fecha: g.createdAt.toISOString().split('T')[0],
        })),
      }
    }

    case 'resumen_financiero': {
      let pedidoWhere: any = {}
      let gastoWhere: any = {}
      if (args.mes) {
        const [anio, mes] = String(args.mes).split('-').map(Number)
        const desde = new Date(anio, mes - 1, 1)
        const hasta = new Date(anio, mes, 0, 23, 59, 59)
        pedidoWhere = { createdAt: { gte: desde, lte: hasta } }
        gastoWhere = { createdAt: { gte: desde, lte: hasta } }
      }
      const [pedidos, gastos] = await Promise.all([
        prisma.pedido.findMany({ where: pedidoWhere, select: { precioTotal: true, estadoPago: true, estadoEntrega: true, montoSeña: true } }),
        prisma.gasto.findMany({ where: gastoWhere, select: { monto: true } }),
      ])
      const totalEsperado = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
      const totalCobrado = pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
      const totalSenado = pedidos.filter(p => p.estadoPago === 'señado').reduce((s, p) => s + (p.montoSeña ? parseFloat(p.montoSeña.toString()) : 0), 0)
      const totalGastos = gastos.reduce((s, g) => s + parseFloat(g.monto.toString()), 0)
      return {
        periodo: args.mes || 'histórico completo',
        cantidadPedidos: pedidos.length,
        entregados: pedidos.filter(p => p.estadoEntrega === 'entregado').length,
        pendientesEntrega: pedidos.filter(p => p.estadoEntrega === 'pendiente').length,
        totalEsperado,
        totalCobrado,
        totalSenasRecibidas: totalSenado,
        pendienteCobro: totalEsperado - totalCobrado,
        totalGastos,
        gananciaEstimada: totalEsperado - totalGastos,
        gananciaNeta: totalCobrado - totalGastos,
      }
    }

    case 'listar_propuestas': {
      const where: any = {}
      if (args.estado) where.estado = args.estado
      const propuestas = await prisma.propuesta.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.max(1, Math.min(50, parseInt(String(args.limite)) || 15)),
        include: {
          items: { select: { cantidad: true, precioUnitario: true, descripcion: true } },
        },
      })
      return {
        total: propuestas.length,
        propuestas: propuestas.map(p => {
          const total = p.items.reduce((s: number, i: { cantidad: number; precioUnitario: any }) => s + parseFloat(i.precioUnitario.toString()) * i.cantidad, 0)
          return {
            id: p.id,
            titulo: p.titulo,
            cliente: p.clienteNombre,
            estado: p.estado,
            total,
            cantidadItems: p.items.length,
            validezHasta: p.validezHasta ? p.validezHasta.toISOString().split('T')[0] : null,
            creadaEl: p.createdAt.toISOString().split('T')[0],
          }
        }),
      }
    }

    case 'crear_pedido': {
      type ProdInput = { nombre: string; cantidad: any; precioUnitario?: any }
      const productosInput: ProdInput[] = Array.isArray(args.productos) ? args.productos : []

      const catalogo = await prisma.producto.findMany({ select: { id: true, nombre: true, precioDefault: true } })

      function buscarEnCatalogo(nombreBuscado: string) {
        const inputNorm = nombreBuscado.toLowerCase().trim()
        let match = catalogo.find(p => {
          const pNorm = p.nombre.toLowerCase()
          return pNorm.includes(inputNorm) || inputNorm.includes(pNorm)
        })
        if (match) return match
        match = catalogo.find(p => {
          const words = p.nombre.toLowerCase().split(/\s+/).filter(w => w.length > 3)
          return words.some(w => inputNorm.includes(w))
        })
        if (match) return match
        const inputWords = inputNorm.split(/\s+/).filter((w: string) => w.length > 3)
        for (const word of inputWords) {
          match = catalogo.find(p => p.nombre.toLowerCase().includes(word))
          if (match) return match
        }
        return null
      }

      const sinPrecio: string[] = []
      for (const p of productosInput) {
        const encontrado = buscarEnCatalogo(p.nombre as string)
        const tienePrecio = p.precioUnitario != null && !isNaN(parseFloat(String(p.precioUnitario))) && parseFloat(String(p.precioUnitario)) > 0
        if (!encontrado && !tienePrecio) sinPrecio.push(p.nombre as string)
      }
      if (sinPrecio.length > 0) {
        return {
          error: 'productos_sin_precio',
          mensaje: `Los siguientes productos no están en el catálogo y no tienen precio: ${sinPrecio.join(', ')}. Pedile el precio a Popi.`,
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
      type ResolvedProd = { productoId: number; nombre: string; cantidad: number; precioUnitario: number }
      const productosResueltos: ResolvedProd[] = []
      for (const p of productosInput) {
        const cantidad = Math.max(1, parseInt(String(p.cantidad)) || 1)
        let encontrado = buscarEnCatalogo(p.nombre as string)
        const precioUnit = p.precioUnitario != null && !isNaN(parseFloat(String(p.precioUnitario)))
          ? parseFloat(String(p.precioUnitario))
          : encontrado ? parseFloat(encontrado.precioDefault.toString()) : 0
        if (!encontrado) {
          const nuevo = await prisma.producto.create({ data: { nombre: p.nombre as string, precioDefault: precioUnit } })
          encontrado = { id: nuevo.id, nombre: nuevo.nombre, precioDefault: nuevo.precioDefault }
        }
        productosResueltos.push({ productoId: encontrado.id, nombre: encontrado.nombre, cantidad, precioUnitario: precioUnit })
      }

      const precioTotal = productosResueltos.length > 0
        ? productosResueltos.reduce((s, p) => s + p.precioUnitario * p.cantidad, 0)
        : 0

      const pedido = await prisma.pedido.create({
        data: {
          nombreCliente: args.nombreCliente as string,
          precioTotal,
          descripcion: (args.descripcion as string) || null,
          notas: (args.notas as string) || null,
          fechaEntrega: args.fechaEntrega ? new Date(args.fechaEntrega as string) : null,
          modalidadEntrega: (args.modalidadEntrega as any) || null,
          telefono: (args.telefono as string) || null,
          estadoPago: (args.estadoPago as any) || 'sin_seña',
          montoSeña: args.montoSeña ? parseFloat(String(args.montoSeña)) : null,
          ...(clienteId ? { clienteId } : {}),
          ...(args.eventoId ? { eventoId: parseInt(String(args.eventoId)) } : {}),
        },
      })

      for (const p of productosResueltos) {
        await prisma.pedidoProducto.create({
          data: { pedidoId: pedido.id, productoId: p.productoId, cantidad: p.cantidad, precioUnitario: p.precioUnitario },
        })
      }

      return {
        ok: true,
        pedido: {
          id: pedido.id,
          nombreCliente: pedido.nombreCliente,
          precioTotal,
          fechaEntrega: pedido.fechaEntrega ? pedido.fechaEntrega.toISOString().split('T')[0] : null,
          productos: productosResueltos.map(p => ({ nombre: p.nombre, cantidad: p.cantidad, precioUnitario: p.precioUnitario })),
        },
        clienteGuardado: clienteId !== null,
        mensaje: 'Pedido creado exitosamente.',
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

    // Truncar historial para no exceder el contexto: últimos 30 mensajes
    const MAX_HISTORY = 30
    const recentMessages = messages.slice(-MAX_HISTORY)

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: getSystemPrompt() },
      ...recentMessages.map((m: { role: string; content: string }) => ({
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
          max_tokens: 1500,
        })
      } catch (err: any) {
        if (withTools && (err?.code === 'tool_use_failed' || err?.status === 400)) {
          return groq.chat.completions.create({ model: MODEL, messages: msgs, max_tokens: 1500 })
        }
        throw err
      }
    }

    let response = await callGroq(chatMessages)

    let iterations = 0
    while (response.choices[0].finish_reason === 'tool_calls' && iterations < 8) {
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
