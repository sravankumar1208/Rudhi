import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, MapPin, Award, Heart, Edit2, LogOut, Phone, User, Droplet } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useAuthStore } from '../store'
import { signOut } from '../lib/auth'
import { upsertProfile } from '../lib/api/profiles'
import toast from 'react-hot-toast'

export const Profile = () => {
  const navigate = useNavigate()
  const { profile, setProfile } = useAuthStore()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsUpdating] = useState(false)

  // Edit Form State
  const [formData, setFormData] = useState({
    full_name: '',
    blood_group: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        blood_group: profile.blood_group || '',
        phone: profile.phone || '',
        address: profile.address || ''
      })
    }
  }, [profile])

  const initials = (profile?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const donationsCount = profile?.donation_count || 0

  const handleLogout = async () => {
    await signOut()
    navigate('/auth', { replace: true })
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const updatedProfile = await upsertProfile({
        full_name: formData.full_name.trim(),
        blood_group: formData.blood_group,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      })

      setProfile(updatedProfile)
      toast.success('Profile updated successfully!')
      setIsEditModalOpen(false)
    } catch (err) {
      console.error('[Rudhi] Profile Update Error:', err)
      toast.error(err.message || 'Could not update profile.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg">
      <div className="bg-white dark:bg-gray-900 px-6 pt-8 pb-6 border-b border-neutral-light dark:border-gray-800 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-neutral-light dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center text-3xl font-bold text-neutral-mid relative mb-4">
          {initials}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white dark:border-gray-900 shadow-sm transition-transform hover:scale-110"
          >
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

        <Button
          variant="secondary"
          size="sm"
          className="mt-4 gap-2 h-9 px-4"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit2 size={14} /> Edit Profile
        </Button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col items-center text-center p-4 gap-2 border-primary/10">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Heart size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-neutral-dark dark:text-white">{donationsCount}</span>
              <span className="text-[10px] font-bold text-neutral-mid uppercase tracking-widest">Donations</span>
            </div>
          </Card>
          <Card className="flex flex-col items-center text-center p-4 gap-2 border-success/10">
            <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
              <Award size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-neutral-dark dark:text-white">{donationsCount >= 5 ? 'Gold' : donationsCount >= 3 ? 'Silver' : 'Bronze'}</span>
              <span className="text-[10px] font-bold text-neutral-mid uppercase tracking-widest">Tier Status</span>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="p-5 flex flex-col gap-4">
           <h3 className="text-xs font-bold text-neutral-mid uppercase tracking-widest flex items-center justify-between">
              Account Details
              <button onClick={() => setIsEditModalOpen(true)} className="text-primary hover:underline lowercase font-medium tracking-normal">edit</button>
           </h3>

           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-neutral-light dark:bg-gray-800 flex items-center justify-center text-neutral-mid">
                    <User size={16} />
                 </div>
                 <div className="flex flex-col">
                    <p className="text-[10px] text-neutral-mid leading-none mb-1">Full Name</p>
                    <p className="text-sm font-medium text-neutral-dark dark:text-white">{profile?.full_name || 'Not set'}</p>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-neutral-light dark:bg-gray-800 flex items-center justify-center text-neutral-mid">
                    <Phone size={16} />
                 </div>
                 <div className="flex flex-col">
                    <p className="text-[10px] text-neutral-mid leading-none mb-1">Phone Number</p>
                    <p className="text-sm font-medium text-neutral-dark dark:text-white">{profile?.phone || 'Not set'}</p>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-neutral-light dark:bg-gray-800 flex items-center justify-center text-neutral-mid">
                    <Droplet size={16} />
                 </div>
                 <div className="flex flex-col">
                    <p className="text-[10px] text-neutral-mid leading-none mb-1">Blood Group</p>
                    <p className="text-sm font-bold text-primary">{profile?.blood_group || 'Not set'}</p>
                 </div>
              </div>
           </div>
        </Card>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-light dark:border-gray-800 overflow-hidden shadow-sm">
          <button onClick={() => navigate('/donation-history')} className="w-full flex items-center justify-between p-4 border-b border-neutral-light dark:border-gray-800 hover:bg-neutral-light/50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-3 font-medium text-neutral-dark dark:text-white text-sm">
              <Award className="text-primary" size={18} /> My Certificates
            </div>
            <ChevronRight size={18} className="text-neutral-mid" />
          </button>
          <button onClick={() => navigate('/settings')} className="w-full flex items-center justify-between p-4 border-b border-neutral-light dark:border-gray-800 hover:bg-neutral-light/50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-3 font-medium text-neutral-dark dark:text-white text-sm">
              <Settings className="text-neutral-mid" size={18} /> Settings & Preferences
            </div>
            <ChevronRight size={18} className="text-neutral-mid" />
          </button>
          <button onClick={handleLogout} className="w-full flex items-center p-4 hover:bg-danger/5 transition-colors text-danger font-bold text-sm">
            <div className="flex items-center gap-3">
              <LogOut size={18} /> Log Out
            </div>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit Profile"
        description="Update your personal details below."
        variant="modal"
      >
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 mt-2">
           <Input
             label="Full Name"
             value={formData.full_name}
             onChange={e => setFormData({...formData, full_name: e.target.value})}
             placeholder="Enter your full name"
             required
           />

           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                 <label className="text-sm font-medium text-neutral-dark dark:text-neutral-light">Blood Group</label>
                 <select
                   className="flex h-11 w-full rounded-lg border border-neutral-light bg-white px-3 py-2 text-sm text-neutral-dark focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                   value={formData.blood_group}
                   onChange={e => setFormData({...formData, blood_group: e.target.value})}
                   required
                 >
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                 </select>
              </div>
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="+91..."
              />
           </div>

           <Input
             label="Primary Address"
             value={formData.address}
             onChange={e => setFormData({...formData, address: e.target.value})}
             placeholder="City, State, Zip"
           />

           <div className="flex gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="flex-1">
                 Cancel
              </Button>
              <Button type="submit" isLoading={isSaving} className="flex-[2]">
                 Save Changes
              </Button>
           </div>
        </form>
      </Modal>
    </div>
  )
}

const ChevronRight = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
)
