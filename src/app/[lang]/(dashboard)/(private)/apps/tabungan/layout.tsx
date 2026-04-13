// Component Imports
import TabunganMobileLayout from '@views/apps/tabungan/mobile/TabunganMobileLayout'
import { TabunganDictionaryProvider } from '@/contexts/TabunganDictionaryContext'

import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'

// Config Imports
import { i18n } from '@configs/i18n'

// Util Imports
import { getDictionary } from '@/utils/getDictionary'

// Hide the outer VerticalLayout chrome (sidebar/header/footer/customizer)
// right in the SSR HTML so there is no flash of the desktop layout before
// the client-side mobile shell takes over. Scoped to the tabungan subtree
// only — the CSS is mounted/unmounted with this layout.
const hideOuterChromeCss = `
  .ts-vertical-layout-header,
  .ts-vertical-layout-navbar,
  .ts-vertical-nav-root,
  .ts-vertical-layout-footer,
  .customizer,
  .app-scroll-to-top {
    display: none !important;
  }
  .ts-vertical-layout-content-wrapper,
  .ts-vertical-layout-content {
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
  }
  main { padding: 0 !important; }
`

type Props = ChildrenType & { params: Promise<{ lang: string }> }

const TabunganLayout = async ({ children, params }: Props) => {
  const { lang } = await params
  const locale: Locale = i18n.locales.includes(lang as Locale) ? (lang as Locale) : i18n.defaultLocale
  const dictionary = await getDictionary(locale)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: hideOuterChromeCss }} />
      <TabunganDictionaryProvider value={dictionary.tabungan}>
        <TabunganMobileLayout>{children}</TabunganMobileLayout>
      </TabunganDictionaryProvider>
    </>
  )
}

export default TabunganLayout
