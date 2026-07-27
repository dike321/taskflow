import { Outlet } from 'react-router-dom'
import PageToolbar from '../../components/common/PageToolbar'

export default function SettingsLayout() {
  return (
    <div>
      <PageToolbar title="Settings" description="Manage application configuration" />
      <Outlet />
    </div>
  )
}
