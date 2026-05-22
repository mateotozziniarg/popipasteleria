-- CreateEnum
CREATE TYPE "ModalidadEntrega" AS ENUM ('ENVIO', 'RETIRA');

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN "modalidadEntrega" "ModalidadEntrega";
