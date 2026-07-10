import { NavLink, useLocation } from 'react-router-dom'
import { Home, MapPin, Plus, Bell, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useNotificationStore } from '../../store'

export const BottomNavBar = () => {
  const location = useLocation()
  const unreadCount = useNotificationStore(state => state.unreadCount)

  const navItems = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Find', path: '/hospitals', icon: MapPin },
    { name: 'Requests', path: '/my-requests', icon: Plus, isFab: true },
    { name: 'Alerts', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Profile', path: '/profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-neutral-light dark:border-gray-800 pb-[env(safe-area-inset-bottom)] z-40 px-2 h-[72px]">
      <div className="max-w-md mx-auto h-full flex justify-between items-center relative">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          const Icon = item.icon

          if (item.isFab) {
            return (
              <div key={item.path} className="relative -top-5 flex-shrink-0">
                <NavLink to={item.path} className="flex flex-col items-center group">
                  <motion.div 
                    whileTap={{ scale: 0.9 }}
                    className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
                  >
                    <Icon size={28} />
                  </motion.div>
                </NavLink>
              </div>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors relative touch-target",
                isActive ? "text-primary" : "text-neutral-mid hover:text-neutral-dark dark:hover:text-gray-300"
              )}
            >
              <motion.div whileTap={{ scale: 0.9 }}>
                <Icon size={24} className={isActive ? "fill-primary/20" : ""} />
                {item.badge > 0 && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </motion.div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
