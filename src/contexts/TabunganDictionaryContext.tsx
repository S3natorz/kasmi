'use client'

// React Imports
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

// Type Imports
import type { getDictionary } from '@/utils/getDictionary'

// The server-only `getDictionary` helper returns the full dictionary; we
// expose it to client components through this context so each page can
// pull its localized strings without re-importing the JSON on the client.
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>

// Narrowing: the `tabungan` namespace is the one the mobile surface uses.
export type TabunganDictionary = Dictionary['tabungan']

const TabunganDictionaryContext = createContext<TabunganDictionary | null>(null)

type ProviderProps = {
  value: TabunganDictionary
  children: ReactNode
}

export const TabunganDictionaryProvider = ({ value, children }: ProviderProps) => {
  return <TabunganDictionaryContext.Provider value={value}>{children}</TabunganDictionaryContext.Provider>
}

export const useTabunganDictionary = (): TabunganDictionary => {
  const ctx = useContext(TabunganDictionaryContext)

  if (!ctx) {
    throw new Error('useTabunganDictionary must be used inside <TabunganDictionaryProvider>')
  }

  return ctx
}
