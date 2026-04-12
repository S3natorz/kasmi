'use client'

// React Imports
import type { ReactNode } from 'react'

// Next Imports
import { usePathname, useRouter, useParams } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'

// Component Imports
import MobileShell from './MobileShell'
import TopBar from './TopBar'
import TabunganRealtime from '@/libs/realtime/TabunganRealtime'

type Props = {
  children: ReactNode
}

const pageMeta: Record<string, { title: string; subtitle?: string }> = {
  '/apps/tabungan/transactions': { title: 'Semua Transaksi', subtitle: 'Riwayat keuangan' },
  '/apps/tabungan/storage-types': { title: 'Dompet & Simpanan', subtitle: 'Kelola akun & saldo' },
  '/apps/tabungan/family-members': { title: 'Anggota Keluarga', subtitle: 'Kelola anggota' },
  '/apps/tabungan/categories/savings': { title: 'Kategori Tabungan', subtitle: 'Target & kategori' },
  '/apps/tabungan/categories/expenses': { title: 'Kategori Pengeluaran', subtitle: 'Kelompokkan pengeluaran' },
  '/apps/tabungan/backup': { title: 'Backup & Restore', subtitle: 'Cadangan data' },
  '/apps/tabungan/settings': { title: 'Pengaturan', subtitle: 'Menu & konfigurasi lainnya' }
}

const TabunganMobileLayout = ({ children }: Props) => {
  const pathname = usePathname() || ''
  const router = useRouter()
  const params = useParams()
  const lang = (params?.lang as string) || 'en'

  // Strip /{lang} prefix to match meta keys
  const normalizedPath = pathname.replace(new RegExp(`^/${lang}`), '')
  const isDashboard = normalizedPath.includes('/apps/tabungan/dashboard')

  const meta = pageMeta[normalizedPath] || pageMeta[Object.keys(pageMeta).find(k => normalizedPath.startsWith(k)) || '']

  return (
    <MobileShell>
      <TabunganRealtime />
      {!isDashboard && meta && (
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          showBack
          onBack={() => router.push(`/${lang}/apps/tabungan/dashboard`)}
        />
      )}
      <Box sx={{ px: isDashboard ? 0 : 1.5, py: isDashboard ? 0 : 1.5 }}>{children}</Box>
    </MobileShell>
  )
}

export default TabunganMobileLayout
