UPDATE "_prisma_migrations"
SET "rolled_back_at" = NOW()
WHERE "migration_name" = '20260520000001_seed_usuario'
AND "rolled_back_at" IS NULL;
