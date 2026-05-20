import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const materias = await prisma.materiaPrima.findMany({ orderBy: { nombre: 'asc' } })
    res.json(materias)
  } catch {
    res.status(500).json({ error: 'Error al obtener materias primas' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const { nombre, descripcion, precioDefault } = req.body
  if (!nombre || precioDefault === undefined) {
    res.status(400).json({ error: 'nombre y precioDefault son requeridos' })
    return
  }
  try {
    const materia = await prisma.materiaPrima.create({
      data: { nombre, descripcion, precioDefault },
    })
    res.status(201).json(materia)
  } catch {
    res.status(500).json({ error: 'Error al crear materia prima' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { nombre, descripcion, precioDefault } = req.body
  try {
    const materia = await prisma.materiaPrima.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precioDefault !== undefined && { precioDefault }),
      },
    })
    res.json(materia)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Materia prima no encontrada' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar materia prima' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    const enUso = await prisma.eventoGasto.count({ where: { materiaPrimaId: id } })
    if (enUso > 0) {
      res.status(409).json({ error: `No se puede eliminar: la materia prima tiene ${enUso} gasto${enUso > 1 ? 's' : ''} asociado${enUso > 1 ? 's' : ''}` })
      return
    }
    await prisma.materiaPrima.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Materia prima no encontrada' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar materia prima' })
  }
})

export default router
