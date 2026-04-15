'use client'

// React Imports
import type { ReactNode } from 'react'
import { useMemo } from 'react'

// Next Imports
import { usePathname, useRouter, useParams } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'

// Component Imports
import MobileShell from './MobileShell'
import TopBar from './TopBar'
import TabunganRealtime from '@/libs/realtime/TabunganRealtime'

// Context Imports
import { useTabunganDictionary } from '@/contexts/TabunganDictionaryContext'

type Props = {
  children: ReactNode
}

const TabunganMobileLayout = ({ children }: Props) => {
  const pathname = usePathname() || ''
  const router = useRouter()
  const params = useParams()
  const dict = useTabunganDictionary()
  const lang = (params?.lang as string) || 'id'

  const pageMeta = useMemo<Record<string, { title: string; subtitle?: string }>>(
    () => ({
      '/apps/tabungan/transactions': {
        title: dict.topbar.transactions.title,
        subtitle: dict.topbar.transactions.subtitle
      },
      '/apps/tabungan/storage-types': {
        title: dict.topbar.storageTypes.title,
        subtitle: dict.topbar.storageTypes.subtitle
      },
      '/apps/tabungan/family-members': {
        title: dict.topbar.familyMembers.title,
        subtitle: dict.topbar.familyMembers.subtitle
      },
      '/apps/tabungan/categories/savings': {
        title: dict.topbar.savingsCategories.title,
        subtitle: dict.topbar.savingsCategories.subtitle
      },
      '/apps/tabungan/categories/expenses': {
        title: dict.topbar.expenseCategories.title,
        subtitle: dict.topbar.expenseCategories.subtitle
      },
      '/apps/tabungan/backup': {
        title: dict.topbar.backup.title,
        subtitle: dict.topbar.backup.subtitle
      },
      '/apps/tabungan/settings': {
        title: dict.topbar.settings.title,
        subtitle: dict.topbar.settings.subtitle
      }
    }),
    [dict]
  )

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
