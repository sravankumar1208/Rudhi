import { useNavigate } from 'react-router-dom'
import { Settings, MapPin, Award, Heart, Edit2, LogOut } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useAuthStore } from '../store'
import { signOut } from '../lib/auth'

export const Profile = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const initials = (profile?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const donationsCount = profile?.donation_count || 0

  const handleLogout = async () => {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg">
      <div className="bg-white dark:bg-gray-900 px-6 pt-8 pb-6 border-b border-neutral-light dark:border-gray-800 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-neutral-light dark:border-gray-800 border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center text-3xl font-bold text-neutral-mid relative mb-4">
          {initials}
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white dark:border-gray-900 shadow-sm">
            <Edit2 size={14} />
          </button>
        </div>
        
        <h2 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">{profile?.full_name || 'User'}</h2>
        <div className="flex items-center gap-2 mt-2">
          {profile?.blood_group && <Badge variant="blood">{profile.blood_group}</Badge>}
          <span className="text-sm font-medium text-neutral-mid flex items-center gap-1">
            <MapPin size={14} /> {profile?.address?.split(',').slice(-2).join(',').trim() || 'Location not set'}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col items-center text-center p-4 gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Heart size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-neutral-dark dark:text-white">{donationsCount}</span>
              <span className="text-xs font-semibold text-neutral-mid uppercase tracking-wider">Donations</span>
            </div>
          </Card>
          <Card className="flex flex-col items-center text-center p-4 gap-2">
            <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
              <Award size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-neutral-dark dark:text-white">{donationsCount >= 5 ? 'Gold' : donationsCount >= 3 ? 'Silver' : 'Bronze'}</span>
              <span className="text-xs font-semibold text-neutral-mid uppercase tracking-wider">Tier Status</span>
            </div>
          </Card>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-light dark:border-gray-800 overflow-hidden mt-2 shadow-sm">
          <button onClick={() => navigate('/donation-history')} className="w-full flex items-center justify-between p-4 border-b border-neutral-light dark:border-gray-800 hover:bg-neutral-light/50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-3 font-medium text-neutral-dark dark:text-white">
              <Award className="text-primary" size={20} /> My Certificates
            </div>
            <ChevronRight size={20} className="text-neutral-mid" />
          </button>
          <button onClick={() => navigate('/settings')} className="w-full flex items-center justify-between p-4 border-b border-neutral-light dark:border-gray-800 hover:bg-neutral-light/50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-3 font-medium text-neutral-dark dark:text-white">
              <Settings className="text-neutral-mid" size={20} /> Settings & Preferences
            </div>
            <ChevronRight size={20} className="text-neutral-mid" />
          </button>
          <button onClick={handleLogout} className="w-full flex items-center p-4 hover:bg-danger/5 transition-colors text-danger font-medium">
            <div className="flex items-center gap-3">
              <LogOut size={20} /> Log Out
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

const ChevronRight = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
)
