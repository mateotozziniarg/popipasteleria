-- CreateEnum
CREATE TYPE "EstadoEntrega" AS ENUM ('pendiente', 'entregado');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('sin_seña', 'señado', 'pagado');

-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "nombreCliente" TEXT NOT NULL,
    "telefono" TEXT,
    "descripcion" TEXT NOT NULL,
    "precioTotal" DECIMAL(10,2) NOT NULL,
    "estadoEntrega" "EstadoEntrega" NOT NULL DEFAULT 'pendiente',
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'sin_seña',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
