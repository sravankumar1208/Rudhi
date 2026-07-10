import { useState, useEffect, useCallback } from 'react'
import { Bell, MapPin, Heart, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { supabase } from '../lib/supabase'
import { getMyNotifications, markAllNotificationsRead } from '../lib/api/notifications'
import { useAuthStore, useNotificationStore } from '../store'
import { formatRelativeTime } from '../lib/utils'

export const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const { notifications, setNotifications, addNotification, markAllRead } = useNotificationStore()
  const { user } = useAuthStore()

  const loadNotifications = useCallback(() => {
    getMyNotifications()
      .then(data => data && setNotifications(
        data.map(n => ({ ...n, _timeAgo: formatRelativeTime(n.created_at) }))
      ))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [setNotifications])

  useEffect(() => {
    loadNotifications()

    if (!user?.id) return

    const channel = supabase
      .channel('notifications-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          addNotification({ ...payload.new, _timeAgo: formatRelativeTime(payload.new.created_at) })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, loadNotifications, addNotification])

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      markAllRead()
    } catch { /* not critical */ }
  }

  const getIcon = (type) => {
    switch(type) {
      case 'alert': return <AlertTriangle className="text-danger" size={20} />
      case 'system': return <Bell className="text-primary" size={20} />
      case 'reminder': return <MapPin className="text-accent" size={20} />
      case 'success': return <CheckCircle2 className="text-success" size={20} />
      default: return <Heart className="text-primary" size={20} />
    }
  }

  const getBg = (type) => {
    switch(type) {
      case 'alert': return 'bg-danger/10'
      case 'system': return 'bg-primary/10'
      case 'reminder': return 'bg-accent/10'
      case 'success': return 'bg-success/10'
      default: return 'bg-primary/10'
    }
  }

  const filtered = activeTab === 'all' ? notifications : activeTab === 'unread' ? notifications.filter(n => !n.read) : notifications.filter(n => n.type === 'alert')



  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm border border-neutral-light dark:border-gray-800 flex-1">
          {['all', 'unread', 'alerts'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-semibold capitalize rounded-lg transition-colors ${
                activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-neutral-mid hover:text-neutral-dark dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {notifications.some(n => !n.read) && (
        <button onClick={handleMarkAllRead} className="text-sm font-medium text-primary mb-3 self-end">
          Mark all as read
        </button>
      )}

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-8 text-neutral-mid">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-neutral-mid font-medium">No notifications</div>
        ) : filtered.map(notif => (
          <Card key={notif.id} className={`flex gap-4 p-4 relative overflow-hidden ${!notif.read ? 'border-primary/30 bg-primary/5 dark:bg-primary/5' : ''}`}>
            {!notif.read && (
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary" />
            )}
            
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getBg(notif.type)}`}>
              {getIcon(notif.type)}
            </div>

            <div className="flex flex-col flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-neutral-dark dark:text-white text-base leading-tight">{notif.title}</h3>
                <span className="text-xs text-neutral-mid font-medium ml-2 whitespace-nowrap">{notif._timeAgo}</span>
              </div>
              <p className="text-sm text-neutral-mid mt-1 leading-snug">{notif.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
