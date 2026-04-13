// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { getDictionary } from '@/utils/getDictionary'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import HorizontalNav, { Menu, MenuItem, SubMenu } from '@menu/horizontal-menu'
import VerticalNavContent from './VerticalNavContent'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledHorizontalNavExpandIcon from '@menu/styles/horizontal/StyledHorizontalNavExpandIcon'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/horizontal/menuItemStyles'
import menuRootStyles from '@core/styles/horizontal/menuRootStyles'
import verticalNavigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import verticalMenuItemStyles from '@core/styles/vertical/menuItemStyles'
import verticalMenuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// Trimmed to Tabungan-only entries. The original template shipped a
// ~400-line horizontal menu covering every demo app (ecommerce, academy,
// invoice, etc.); those routes were removed from the build to keep the
// Cloudflare Worker bundle under the 3 MiB free-plan size limit.

type RenderExpandIconProps = {
  level?: number
}

type RenderVerticalExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ level }: RenderExpandIconProps) => (
  <StyledHorizontalNavExpandIcon level={level}>
    <i className='tabler-chevron-right' />
  </StyledHorizontalNavExpandIcon>
)

const RenderVerticalExpandIcon = ({ open, transitionDuration }: RenderVerticalExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const HorizontalMenu = ({ dictionary: _dictionary }: { dictionary: Awaited<ReturnType<typeof getDictionary>> }) => {
  const verticalNavOptions = useVerticalNav()
  const theme = useTheme()
  const params = useParams()

  const { transitionDuration } = verticalNavOptions
  const { lang: locale } = params

  return (
    <HorizontalNav
      switchToVertical
      verticalNavContent={VerticalNavContent}
      verticalNavProps={{
        customStyles: verticalNavigationCustomStyles(verticalNavOptions, theme),
        backgroundColor: 'var(--mui-palette-background-paper)'
      }}
    >
      <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        menuItemStyles={menuItemStyles(theme, 'tabler-circle')}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='tabler-circle text-xs' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
        <MenuItem href={`/${locale}/apps/tabungan/dashboard`} icon={<i className='tabler-smart-home' />}>
          Dashboard
        </MenuItem>
        <MenuItem href={`/${locale}/apps/tabungan/transactions`} icon={<i className='tabler-receipt' />}>
          Transaksi
        </MenuItem>
        <SubMenu label='Kategori' icon={<i className='tabler-category' />}>
          <MenuItem href={`/${locale}/apps/tabungan/categories/savings`}>Kategori Tabungan</MenuItem>
          <MenuItem href={`/${locale}/apps/tabungan/categories/expenses`}>Kategori Pengeluaran</MenuItem>
        </SubMenu>
        <MenuItem href={`/${locale}/apps/tabungan/storage-types`} icon={<i className='tabler-wallet' />}>
          Storage
        </MenuItem>
        <MenuItem href={`/${locale}/apps/tabungan/family-members`} icon={<i className='tabler-users' />}>
          Anggota
        </MenuItem>
        <MenuItem href={`/${locale}/apps/tabungan/backup`} icon={<i className='tabler-database-export' />}>
          Backup
        </MenuItem>
        <MenuItem href={`/${locale}/apps/tabungan/settings`} icon={<i className='tabler-settings' />}>
          Pengaturan
        </MenuItem>
      </Menu>
    </HorizontalNav>
  )
}

export default HorizontalMenu
