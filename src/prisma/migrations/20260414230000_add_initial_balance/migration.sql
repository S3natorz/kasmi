-- Add opening-balance columns so balances can be recalculated
-- deterministically from initialBalance + sum(tx effects). Without a
-- stable reference point, any drift accumulated by prior bugs (e.g. the
-- negative-clamping path in the transactions route) cannot be undone
-- non-destructively.
--
-- `initialBalance` defaults to 0 on the column definition, but we seed
-- the row values from the currently stored `balance` / `goldWeight` so
-- existing users don't lose their opening balances at migration time.

ALTER TABLE "StorageType"
  ADD COLUMN IF NOT EXISTS "initialBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "StorageType"
  ADD COLUMN IF NOT EXISTS "initialGoldWeight" DOUBLE PRECISION;

UPDATE "StorageType"
SET    "initialBalance" = "balance"
WHERE  "initialBalance" = 0;

UPDATE "StorageType"
SET    "initialGoldWeight" = "goldWeight"
WHERE  "goldWeight" IS NOT NULL
  AND  "initialGoldWeight" IS NULL;
