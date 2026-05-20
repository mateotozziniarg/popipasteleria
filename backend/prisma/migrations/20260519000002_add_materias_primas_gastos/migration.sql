-- CreateTable MateriaPrima
CREATE TABLE "MateriaPrima" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioDefault" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventoGasto
CREATE TABLE "EventoGasto" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "materiaPrimaId" INTEGER NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoGasto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventoGasto" ADD CONSTRAINT "EventoGasto_eventoId_fkey"
    FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoGasto" ADD CONSTRAINT "EventoGasto_materiaPrimaId_fkey"
    FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
