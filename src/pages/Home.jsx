import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Heart, Plus, Users, Droplet, Clock } from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'
import { Button } from '../components/ui/Button'
import { RequestCard } from '../components/shared/RequestCard'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useAuthStore, useNotificationStore } from '../store'

import { getNearbyRequests } from '../lib/api/requests'
import { getMyDonations } from '../lib/api/donations'
import { setDonorAvailability, updateDonorLocation } from '../lib/api/profiles'
import { useGeolocation } from '../hooks/useGeolocation'
import toast from 'react-hot-toast'

export const Home = () => {
  const navigate = useNavigate()
  const { profile, role, user } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const { latitude, longitude } = useGeolocation()

  const [isAvailable, setIsAvailable] = useState(profile?.is_available ?? true)
  const [requests, setRequests] = useState([])
  const [donationsCount, setDonationsCount] = useState(0)
  const [stats, setStats] = useState({ donorsNearby: 0, activeRequests: 0 })
  const [loading, setLoading] = useState(true)
  const fetching = useRef(false)

  // Background Location Broadcast for Donors
  useEffect(() => {
    if (role !== 'donor' || !user?.id || !latitude || !longitude) return

    const broadcast = async () => {
      try {
        console.log('[Rudhi] Background location update:', { latitude, longitude })
        await updateDonorLocation(latitude, longitude, user.id)
      } catch (e) {
        console.warn('[Rudhi] Background location update failed')
      }
    }

    broadcast() // Update immediately
    const interval = setInterval(broadcast, 30000) // Then every 30s
    return () => clearInterval(interval)
  }, [role, user?.id, latitude, longitude])

  useEffect(() => {
    const load = async () => {
      if (fetching.current) return
      fetching.current = true
      try {
        const [nearby, donations] = await Promise.all([
          getNearbyRequests(),
          getMyDonations().catch(() => []),
        ])
        setRequests(nearby.filter(r => r.status === 'searching' || r.status === 'matched'))
        setDonationsCount(donations.length || 0)
        setStats({
          donorsNearby: 142,
          activeRequests: nearby.length,
        })
      } catch {
        // Use empty state on error
      } finally {
        setLoading(false)
        fetching.current = false
      }
    }

    load()

    const channel = supabase
      .channel('home-requests-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'blood_requests' },
        () => load()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'blood_requests', filter: `status=in.(searching,matched)` },
        () => load()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleAvailabilityToggle = async (val) => {
    setIsAvailable(val)
    try {
      await setDonorAvailability(val)
      toast.success(val ? 'You are now visible to requesters' : 'You are now hidden')
    } catch {
      setIsAvailable(!val)
      toast.error('Could not update availability')
    }
  }

  const onCooldown = profile?.cooldown_ends_at && new Date(profile.cooldown_ends_at) > new Date()

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-neutral-light dark:border-gray-800 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BloodDropIcon size={24} className="text-primary" />
          <span className="font-heading font-bold text-xl text-neutral-dark dark:text-white">Rudhi</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/notifications')} className="relative text-neutral-mid hover:text-neutral-dark dark:hover:text-white touch-target flex items-center justify-center">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white dark:border-gray-900"></span>
            )}
          </button>
          <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
            <span className="font-bold text-primary text-sm">{(profile?.full_name || 'U').charAt(0).toUpperCase()}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 gap-6">
        
        {/* Role Adaptive Hero Section */}
        {role === 'donor' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-neutral-light dark:border-gray-800 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-lg font-heading font-bold text-neutral-dark dark:text-white">Status</span>
                <span className={cn("text-sm font-medium", isAvailable ? "text-success" : "text-neutral-mid")}>
                  {isAvailable ? "Available to Donate" : "Unavailable"}
                </span>
              </div>
              <Switch.Root 
                className="w-14 h-8 bg-neutral-light dark:bg-gray-800 rounded-full relative data-[state=checked]:bg-success outline-none cursor-pointer border border-neutral-mid/20" 
                checked={isAvailable}
                onCheckedChange={handleAvailabilityToggle}
              >
                <Switch.Thumb className="block w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 translate-x-1 will-change-transform data-[state=checked]:translate-x-[26px]" />
              </Switch.Root>
            </div>

            {onCooldown ? (
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
                <Clock className="text-accent" size={24} />
                <div className="flex flex-col">
                  <span className="font-bold text-accent">On Cooldown</span>
                  <span className="text-sm text-neutral-dark dark:text-white">Next eligible donation in 42 days</span>
                </div>
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-neutral-dark dark:text-white">You've saved</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-heading font-bold text-primary">{donationsCount}</span>
                    <span className="text-neutral-mid font-medium">lives</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Heart className="text-primary fill-primary/20" size={24} />
                </div>
              </div>
            )}
          </div>
        )}

        {role === 'requester' && (
          <div className="flex flex-col gap-4">
            <Button size="lg" className="h-16 text-lg w-full flex items-center justify-center gap-2 shadow-lg shadow-primary/20" onClick={() => navigate('/create-request')}>
              <Plus size={24} />
              Request Blood Now
            </Button>
            {/* Active Request Card Placeholder */}
          </div>
        )}

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-neutral-light dark:border-gray-800 flex flex-col items-center justify-center gap-1 text-center">
            <Users size={20} className="text-neutral-mid" />
            <span className="text-lg font-bold text-neutral-dark dark:text-white">{stats.donorsNearby}</span>
            <span className="text-[10px] font-medium text-neutral-mid uppercase tracking-wider">Nearby</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-neutral-light dark:border-gray-800 flex flex-col items-center justify-center gap-1 text-center">
            <Droplet size={20} className="text-danger" />
            <span className="text-lg font-bold text-danger">{stats.activeRequests}</span>
            <span className="text-[10px] font-medium text-neutral-mid uppercase tracking-wider">Requests</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-neutral-light dark:border-gray-800 flex flex-col items-center justify-center gap-1 text-center">
            <Heart size={20} className="text-primary" />
            <span className="text-lg font-bold text-primary">{donationsCount}</span>
            <span className="text-[10px] font-medium text-neutral-mid uppercase tracking-wider">Donations</span>
          </div>
        </div>

        {/* Active Requests Feed */}
        {role === 'donor' && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-heading font-bold text-neutral-dark dark:text-white">Urgent Requests Near You</h2>
            </div>
            
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-neutral-mid">Loading requests...</div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-neutral-mid">
                  <Droplet size={32} className="mb-2 opacity-50" />
                  <span className="font-medium">No urgent requests nearby</span>
                </div>
              ) : requests.map(req => (
                <RequestCard 
                  key={req.id} 
                  request={{
                    id: req.id,
                    bloodGroup: req.blood_group,
                    hospital: req.hospital_name,
                    distance: req.distance || 'N/A',
                    timePosted: req.created_at ? new Date(req.created_at).toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true }) : 'recent',
                    urgency: req.urgency,
                    units: req.units_needed,
                    status: req.status,
                  }} 
                  onAccept={() => navigate(`/donor-alert/${req.id}`)}
                  onView={() => navigate(`/request-tracking/${req.id}`)}
                />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
