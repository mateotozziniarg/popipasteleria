-- Rename table EventoGasto → Gasto
ALTER TABLE "EventoGasto" RENAME TO "Gasto";

-- Rename FK constraints
ALTER TABLE "Gasto" DROP CONSTRAINT IF EXISTS "EventoGasto_eventoId_fkey";
ALTER TABLE "Gasto" DROP CONSTRAINT IF EXISTS "EventoGasto_materiaPrimaId_fkey";

-- Make eventoId nullable
ALTER TABLE "Gasto" ALTER COLUMN "eventoId" DROP NOT NULL;

-- Make materiaPrimaId nullable
ALTER TABLE "Gasto" ALTER COLUMN "materiaPrimaId" DROP NOT NULL;

-- Make cantidad and precioUnitario nullable
ALTER TABLE "Gasto" ALTER COLUMN "cantidad" DROP NOT NULL;
ALTER TABLE "Gasto" ALTER COLUMN "precioUnitario" DROP NOT NULL;

-- Add monto (compute from existing rows, then make NOT NULL)
ALTER TABLE "Gasto" ADD COLUMN "monto" DECIMAL(10,2) NOT NULL DEFAULT 0;
UPDATE "Gasto" SET "monto" = COALESCE("cantidad", 0) * COALESCE("precioUnitario", 0);
ALTER TABLE "Gasto" ALTER COLUMN "monto" DROP DEFAULT;

-- Add descripcion
ALTER TABLE "Gasto" ADD COLUMN "descripcion" TEXT;

-- Add fecha (populate from evento, then make NOT NULL)
ALTER TABLE "Gasto" ADD COLUMN "fecha" TIMESTAMP(3);
UPDATE "Gasto" g SET "fecha" = e."fecha" FROM "Evento" e WHERE g."eventoId" = e.id;
UPDATE "Gasto" SET "fecha" = "createdAt" WHERE "fecha" IS NULL;
ALTER TABLE "Gasto" ALTER COLUMN "fecha" SET NOT NULL;

-- Re-add FK constraints with nullable support
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_eventoId_fkey"
  FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_materiaPrimaId_fkey"
  FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rename primary key constraint
ALTER TABLE "Gasto" RENAME CONSTRAINT "EventoGasto_pkey" TO "Gasto_pkey";
