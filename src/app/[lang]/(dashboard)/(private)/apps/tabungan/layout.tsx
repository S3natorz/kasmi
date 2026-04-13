// Component Imports
import TabunganMobileLayout from '@views/apps/tabungan/mobile/TabunganMobileLayout'

import type { ChildrenType } from '@core/types'

// Hide the outer VerticalLayout chrome (sidebar/header/footer/customizer)
// right in the SSR HTML so there is no flash of the desktop layout before
// the client-side mobile shell takes over. Scoped to the tabungan subtree
// only — the CSS is mounted/unmounted with this layout.
const hideOuterChromeCss = `
  .ts-vertical-layout-header,
  .ts-vertical-layout-navbar,
  .ts-vertical-nav-root,
  .ts-vertical-layout-footer,
  .customizer {
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

const TabunganLayout = ({ children }: ChildrenType) => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: hideOuterChromeCss }} />
      <TabunganMobileLayout>{children}</TabunganMobileLayout>
    </>
  )
}

export default TabunganLayout
