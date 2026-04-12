// Component Imports
import TabunganMobileLayout from '@views/apps/tabungan/mobile/TabunganMobileLayout'

import type { ChildrenType } from '@core/types'

const TabunganLayout = ({ children }: ChildrenType) => {
  return <TabunganMobileLayout>{children}</TabunganMobileLayout>
}

export default TabunganLayout
