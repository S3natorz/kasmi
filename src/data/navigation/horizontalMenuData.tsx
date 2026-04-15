// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

// Tabungan-only menu. See verticalMenuData.tsx for the rationale — demo
// pages were trimmed so the Worker fits in the free-plan size budget.
const horizontalMenuData = (_dictionary: Awaited<ReturnType<typeof getDictionary>>): HorizontalMenuDataType[] => [
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

export default horizontalMenuData
