-- AlterTable: add opening balance / gold weight columns so balances can
-- be recalculated deterministically from the initial state + transactions.
ALTER TABLE "StorageType" ADD COLUMN "initialBalance" REAL NOT NULL DEFAULT 0;
ALTER TABLE "StorageType" ADD COLUMN "initialGoldWeight" REAL;

-- Seed the new columns from the currently stored values so no data is lost.
UPDATE "StorageType" SET "initialBalance" = "balance";
UPDATE "StorageType" SET "initialGoldWeight" = "goldWeight" WHERE "goldWeight" IS NOT NULL;
