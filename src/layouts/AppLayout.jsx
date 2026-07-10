import { Outlet, useLocation } from 'react-router-dom'
import { BottomNavBar } from '../components/navigation/BottomNavBar'
import { TopHeader } from '../components/navigation/TopHeader'

export const AppLayout = () => {
  const location = useLocation()
  
  // Define which routes show the TopHeader and what their titles are
  const getHeaderProps = () => {
    const path = location.pathname
    
    if (path.startsWith('/create-request')) return { title: 'Request Blood' }
    if (path.startsWith('/request-tracking')) return { title: 'Live Tracking' }
    if (path.startsWith('/donation-history')) return { title: 'My Donations' }
    if (path.startsWith('/notifications')) return { title: 'Notifications' }
    if (path.startsWith('/hospitals')) return { title: 'Hospitals & Blood Banks' }
    if (path.startsWith('/profile') && path !== '/profile') return { title: 'Profile' }
    if (path.startsWith('/settings')) return { title: 'Settings' }
    if (path.startsWith('/hospital/')) return { title: 'Hospital Details' }
    if (path.startsWith('/availability-settings')) return { title: 'Availability' }
    if (path.startsWith('/my-requests')) return { title: 'My Requests' }
    if (path.startsWith('/faq')) return { title: 'FAQ' }
    if (path.startsWith('/about')) return { title: 'About' }
    
    return null // Return null if no header should be shown (e.g. /home)
  }

  const headerProps = getHeaderProps()
  const showBottomNav = !location.pathname.startsWith('/donor-alert') && 
                        !location.pathname.startsWith('/donor-navigation') &&
                        !location.pathname.startsWith('/offline')

  return (
    <div className="min-h-screen bg-secondary dark:bg-dark-bg w-full pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-gray-900 shadow-xl relative overflow-x-hidden pb-20">
        {headerProps && <TopHeader title={headerProps.title} rightAction={headerProps.rightAction} />}
        
        <main className="w-full min-h-full">
          <Outlet />
        </main>
        
        {showBottomNav && <BottomNavBar />}
      </div>
    </div>
  )
}
