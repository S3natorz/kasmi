/*
  Warnings:

  - You are about to drop the column `paymentMethod` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `storageTypeId` on the `Transaction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExpenseCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "budgetLimit" REAL,
    "storageTypeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExpenseCategory_storageTypeId_fkey" FOREIGN KEY ("storageTypeId") REFERENCES "StorageType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ExpenseCategory" ("budgetLimit", "color", "createdAt", "description", "icon", "id", "name", "updatedAt") SELECT "budgetLimit", "color", "createdAt", "description", "icon", "id", "name", "updatedAt" FROM "ExpenseCategory";
DROP TABLE "ExpenseCategory";
ALTER TABLE "new_ExpenseCategory" RENAME TO "ExpenseCategory";
CREATE TABLE "new_SavingsCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "targetAmount" REAL,
    "storageTypeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SavingsCategory_storageTypeId_fkey" FOREIGN KEY ("storageTypeId") REFERENCES "StorageType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SavingsCategory" ("color", "createdAt", "description", "icon", "id", "name", "targetAmount", "updatedAt") SELECT "color", "createdAt", "description", "icon", "id", "name", "targetAmount", "updatedAt" FROM "SavingsCategory";
DROP TABLE "SavingsCategory";
ALTER TABLE "new_SavingsCategory" RENAME TO "SavingsCategory";
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyMemberId" TEXT,
    "savingsCategoryId" TEXT,
    "expenseCategoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_savingsCategoryId_fkey" FOREIGN KEY ("savingsCategoryId") REFERENCES "SavingsCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdAt", "date", "description", "expenseCategoryId", "familyMemberId", "id", "savingsCategoryId", "type", "updatedAt") SELECT "amount", "createdAt", "date", "description", "expenseCategoryId", "familyMemberId", "id", "savingsCategoryId", "type", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
