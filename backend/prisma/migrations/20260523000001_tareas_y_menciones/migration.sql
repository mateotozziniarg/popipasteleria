-- CreateEnum
CREATE TYPE "TipoMencion" AS ENUM ('CLIENTE', 'PEDIDO');

-- CreateTable
CREATE TABLE "Tarea" (
    "id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TareaMencion" (
    "id" SERIAL NOT NULL,
    "tareaId" INTEGER NOT NULL,
    "tipo" "TipoMencion" NOT NULL,
    "clienteId" INTEGER,
    "pedidoId" INTEGER,
    "posicionInicio" INTEGER NOT NULL,
    "posicionFin" INTEGER NOT NULL,
    CONSTRAINT "TareaMencion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TareaMencion" ADD CONSTRAINT "TareaMencion_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaMencion" ADD CONSTRAINT "TareaMencion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaMencion" ADD CONSTRAINT "TareaMencion_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
