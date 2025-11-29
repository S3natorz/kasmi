# Panduan Deploy ke Vercel

## 1. Persiapan Database

### Opsi A: Vercel Postgres (Recommended)

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project → Storage → Create Database → Postgres
3. Copy connection string

### Opsi B: Neon (Free tier lebih besar)

1. Buka [Neon Console](https://console.neon.tech)
2. Create new project
3. Copy connection string dari dashboard

### Opsi C: Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project
3. Settings → Database → Connection string (URI)

---

## 2. Update Schema Prisma

Ganti isi `src/prisma/schema.prisma` dengan konten dari `src/prisma/schema.postgresql.prisma`:

```bash
cp src/prisma/schema.postgresql.prisma src/prisma/schema.prisma
```

---

## 3. Push ke GitHub

```bash
# Inisialisasi git (jika belum)
git init

# Tambahkan semua file
git add .

# Commit
git commit -m "Initial commit - Tabungan Keluarga"

# Buat repository di GitHub, lalu:
git remote add origin https://github.com/USERNAME/kasmi.git
git branch -M main
git push -u origin main
```

---

## 4. Deploy ke Vercel

### Via Vercel Dashboard:

1. Buka [vercel.com/new](https://vercel.com/new)
2. Import Git Repository
3. Pilih repository `kasmi`
4. Configure Project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npx prisma generate && next build`

### Via CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

---

## 5. Set Environment Variables

Di Vercel Dashboard → Project → Settings → Environment Variables, tambahkan:

```env
# Database (dari Vercel Postgres/Neon/Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app/api/auth
NEXTAUTH_SECRET=generate-random-secret-here

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# API
API_URL=https://your-domain.vercel.app/api
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api
```

> Generate NEXTAUTH_SECRET dengan: `openssl rand -base64 32`

---

## 6. Jalankan Migrasi Database

Setelah deploy, jalankan migrasi:

```bash
# Lokal dengan DATABASE_URL production
npx prisma migrate deploy

# Atau via Vercel CLI
vercel env pull .env.production.local
npx prisma migrate deploy
```

---

## 7. Vercel Build Settings

Di `vercel.json` (opsional):

```json
{
  "buildCommand": "npx prisma generate && next build",
  "installCommand": "npm install"
}
```

---

## Troubleshooting

### Error: Prisma Client not generated

- Pastikan build command include `npx prisma generate`

### Error: Database connection failed

- Cek DATABASE_URL sudah benar
- Pastikan `?sslmode=require` di URL

### Error: NEXTAUTH_URL mismatch

- Pastikan NEXTAUTH_URL sesuai dengan domain Vercel

---

## Tips

1. **Preview Deployments**: Vercel auto-deploy setiap push ke branch
2. **Production**: Deploy dari branch `main`
3. **Database Branching**: Neon support database branching untuk preview
