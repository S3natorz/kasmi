-- Indexes for the most frequent Transaction access patterns.
--
-- Without these, /api/apps/tabungan/transactions and /api/apps/tabungan/stats
-- both fall back to a sequential scan + in-memory sort. As the table grows
-- past a few hundred rows the date-range queries get visibly slower on
-- Cloudflare Workers because every byte travels Worker->Supavisor->Postgres
-- and back.

CREATE INDEX IF NOT EXISTS "Transaction_date_createdAt_idx"
  ON "Transaction" ("date" DESC, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Transaction_type_date_idx"
  ON "Transaction" ("type", "date" DESC);

CREATE INDEX IF NOT EXISTS "Transaction_familyMemberId_idx"
  ON "Transaction" ("familyMemberId");

CREATE INDEX IF NOT EXISTS "Transaction_fromStorageTypeId_idx"
  ON "Transaction" ("fromStorageTypeId");

CREATE INDEX IF NOT EXISTS "Transaction_toStorageTypeId_idx"
  ON "Transaction" ("toStorageTypeId");

CREATE INDEX IF NOT EXISTS "Transaction_savingsCategoryId_idx"
  ON "Transaction" ("savingsCategoryId");

CREATE INDEX IF NOT EXISTS "Transaction_expenseCategoryId_idx"
  ON "Transaction" ("expenseCategoryId");
