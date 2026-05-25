-- CreateEnum
CREATE TYPE "EstadoPropuesta" AS ENUM ('BORRADOR', 'PRESENTADA', 'CONFIRMADA');

-- CreateEnum
CREATE TYPE "CategoriaIdea" AS ENUM ('RELLENO', 'DECORACION', 'PACKAGING', 'PRECIO', 'OTRO');

-- CreateTable
CREATE TABLE "Propuesta" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tematica" TEXT,
    "descripcion" TEXT,
    "estado" "EstadoPropuesta" NOT NULL DEFAULT 'BORRADOR',
    "eventoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Propuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropuestaProducto" (
    "id" SERIAL NOT NULL,
    "propuestaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2),
    "notas" TEXT,

    CONSTRAINT "PropuestaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropuestaCombo" (
    "id" SERIAL NOT NULL,
    "propuestaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioCombo" DECIMAL(10,2),

    CONSTRAINT "PropuestaCombo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropuestaComboProducto" (
    "id" SERIAL NOT NULL,
    "comboId" INTEGER NOT NULL,
    "propuestaProductoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PropuestaComboProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropuestaIdea" (
    "id" SERIAL NOT NULL,
    "propuestaId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "categoria" "CategoriaIdea" NOT NULL,

    CONSTRAINT "PropuestaIdea_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Propuesta" ADD CONSTRAINT "Propuesta_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropuestaProducto" ADD CONSTRAINT "PropuestaProducto_propuestaId_fkey" FOREIGN KEY ("propuestaId") REFERENCES "Propuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropuestaCombo" ADD CONSTRAINT "PropuestaCombo_propuestaId_fkey" FOREIGN KEY ("propuestaId") REFERENCES "Propuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropuestaComboProducto" ADD CONSTRAINT "PropuestaComboProducto_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "PropuestaCombo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropuestaComboProducto" ADD CONSTRAINT "PropuestaComboProducto_propuestaProductoId_fkey" FOREIGN KEY ("propuestaProductoId") REFERENCES "PropuestaProducto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropuestaIdea" ADD CONSTRAINT "PropuestaIdea_propuestaId_fkey" FOREIGN KEY ("propuestaId") REFERENCES "Propuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
