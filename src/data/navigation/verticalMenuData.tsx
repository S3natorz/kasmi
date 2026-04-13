// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

// Tabungan-only menu. The original template shipped menu entries for ~50
// demo pages (ecommerce, academy, email, kanban, etc.). Those routes were
// trimmed from the build to keep the Cloudflare Worker bundle under the
// 3 MiB free-plan size limit, so the menu only points at the surviving
// Tabungan routes here.
const verticalMenuData = (_dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] => [
  {
    label: 'Dashboard',
    icon: 'tabler-smart-home',
    href: '/apps/tabungan/dashboard'
  },
  {
    label: 'Transaksi',
    icon: 'tabler-receipt',
    href: '/apps/tabungan/transactions'
  },
  {
    label: 'Kategori',
    icon: 'tabler-category',
    href: '/apps/tabungan/categories'
  },
  {
    label: 'Storage',
    icon: 'tabler-wallet',
    href: '/apps/tabungan/storage-types'
  },
  {
    label: 'Anggota',
    icon: 'tabler-users',
    href: '/apps/tabungan/family-members'
  },
  {
    label: 'Backup',
    icon: 'tabler-database-export',
    href: '/apps/tabungan/backup'
  },
  {
    label: 'Pengaturan',
    icon: 'tabler-settings',
    href: '/apps/tabungan/settings'
  }
]

export default verticalMenuData
