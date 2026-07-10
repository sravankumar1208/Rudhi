import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Activity, Droplets, AlertTriangle, Phone, Search, Building2, Crosshair, CheckCircle2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { getBloodInventory } from '../lib/api/hospitals'
import { getMyRequests } from '../lib/api/requests'
import { useAuthStore } from '../store'
import { useGeolocation } from '../hooks/useGeolocation'
import { formatRelativeTime } from '../lib/utils'

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { latitude, longitude } = useGeolocation()
  const [activeTab, setActiveTab] = useState('inventory')
  const [inventory, setInventory] = useState([])
  const [requests, setRequests] = useState([])
  const [donors, setDonors] = useState([])
  const [donorSearch, setDonorSearch] = useState('')
  const [stats, setStats] = useState({ totalUnits: 0, activeRequests: 0, donors: 0 })
  const [seedRadius, setSeedRadius] = useState(10)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState(null)

  useEffect(() => {
    Promise.all([
      getBloodInventory(profile?.id).catch(() => []),
      getMyRequests().catch(() => []),
      supabase.from('profiles').select('id, full_name, blood_group, phone, is_available, last_donation, created_at').eq('role', 'donor').order('created_at', { ascending: false }).limit(50).then(({ data }) => data || []).catch(() => []),
    ]).then(([inv, reqs, donorList]) => {
      setInventory(inv)
      setRequests(reqs)
      setDonors(donorList)
      setStats({
        totalUnits: inv.reduce((s, i) => s + (i.units || 0), 0),
        activeRequests: reqs.filter(r => r.status === 'searching' || r.status === 'matched').length,
        donors: donorList.length,
      })
    })
  }, [profile?.id])

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg p-4 md:p-8">
      
      <header className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">{profile?.full_name || 'Blood Bank'}</h1>
          <span className="text-sm text-neutral-mid">Admin Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {(profile?.full_name || 'A').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="flex flex-col gap-2 p-4">
          <Droplets className="text-primary" size={24} />
          <span className="text-sm font-medium text-neutral-mid">Total Inventory</span>
          <span className="text-2xl font-bold">{stats.totalUnits} Units</span>
        </Card>
        <Card className="flex flex-col gap-2 p-4 border-l-4 border-danger">
          <AlertTriangle className="text-danger" size={24} />
          <span className="text-sm font-medium text-neutral-mid">Critical Shortage</span>
          <span className="text-2xl font-bold">{inventory.filter(i => i.units < 5).map(i => i.blood_group).join(', ') || 'None'}</span>
        </Card>
        <Card className="flex flex-col gap-2 p-4">
          <Activity className="text-accent" size={24} />
          <span className="text-sm font-medium text-neutral-mid">Active Requests</span>
          <span className="text-2xl font-bold">{stats.activeRequests}</span>
        </Card>
        <Card className="flex flex-col gap-2 p-4">
          <Users className="text-success" size={24} />
          <span className="text-sm font-medium text-neutral-mid">Registered Donors</span>
          <span className="text-2xl font-bold">{stats.donors.toLocaleString() || 'N/A'}</span>
        </Card>
      </div>

      <div className="flex bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm border border-neutral-light dark:border-gray-800 mb-6 max-w-md">
        {['inventory', 'requests', 'donors'].map(tab => (
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

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-light dark:border-gray-800 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-heading font-bold">Blood Inventory Status</h2>
            <Button size="sm">Update Inventory</Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {inventory.length === 0 ? (
              <div className="col-span-full text-center py-8 text-neutral-mid">No inventory data available</div>
            ) : inventory.map((item) => {
              const count = item.units || 0
              const status = count < 5 ? 'critical' : count < 15 ? 'warning' : 'good'
              
              return (
                <div key={item.blood_group} className="flex items-center justify-between p-4 border border-neutral-light dark:border-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-light dark:bg-gray-800 rounded-full flex items-center justify-center font-heading font-bold text-lg text-primary">
                      {item.blood_group}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xl">{count}</span>
                      <span className="text-xs text-neutral-mid uppercase tracking-wider">Units</span>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${status === 'critical' ? 'bg-danger animate-pulse' : status === 'warning' ? 'bg-accent' : 'bg-success'}`} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="flex flex-col gap-3">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-neutral-mid">No requests found</div>
          ) : requests.map(req => (
            <Card key={req.id} interactive className="flex flex-col p-4 gap-2 cursor-pointer" onClick={() => navigate(`/request-tracking/${req.id}`)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    req.status === 'searching' ? 'bg-accent/10 text-accent border-accent/20' :
                    req.status === 'matched' ? 'bg-primary/10 text-primary border-primary/20' :
                    req.status === 'fulfilled' ? 'bg-success/10 text-success border-success/20' :
                    'bg-neutral-light text-neutral-mid border-neutral-mid/20'
                  }`}>{req.status}</Badge>
                  <Badge className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    req.urgency === 'critical' ? 'bg-danger/10 text-danger border-danger/20' :
                    req.urgency === 'moderate' ? 'bg-accent/10 text-accent border-accent/20' :
                    'bg-success/10 text-success border-success/20'
                  }`}>{req.urgency}</Badge>
                </div>
                <span className="text-xs text-neutral-mid">{formatRelativeTime(req.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg text-primary">{req.blood_group}</span>
                  <span className="text-sm text-neutral-mid ml-2">{req.hospital_name}</span>
                </div>
                <span className="text-sm font-bold">{req.units_needed} unit{req.units_needed > 1 ? 's' : ''}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'donors' && (
        <div className="flex flex-col gap-3">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-mid" size={18} />
            <input
              type="text"
              placeholder="Search donors by name or blood group..."
              className="w-full bg-white dark:bg-gray-900 border border-neutral-light dark:border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={donorSearch}
              onChange={(e) => setDonorSearch(e.target.value)}
            />
          </div>
          {donors
            .filter(d => !donorSearch || d.full_name?.toLowerCase().includes(donorSearch.toLowerCase()) || d.blood_group?.toLowerCase().includes(donorSearch.toLowerCase()))
            .length === 0 ? (
            <div className="text-center py-12 text-neutral-mid">No donors found</div>
          ) : donors
            .filter(d => !donorSearch || d.full_name?.toLowerCase().includes(donorSearch.toLowerCase()) || d.blood_group?.toLowerCase().includes(donorSearch.toLowerCase()))
            .map(donor => (
            <Card key={donor.id} className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-lg">
                {(donor.full_name || 'D').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 flex flex-col">
                <span className="font-semibold text-neutral-dark dark:text-white">{donor.full_name || 'Anonymous'}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  {donor.blood_group && <Badge className="text-[10px] px-2 py-0.5">{donor.blood_group}</Badge>}
                  {donor.phone && <span className="text-xs text-neutral-mid flex items-center gap-1"><Phone size={10} /> {donor.phone}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${donor.is_available ? 'bg-success' : 'bg-neutral-mid'}`} />
                <span className="text-[10px] text-neutral-mid">{donor.is_available ? 'Available' : 'Unavailable'}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Seed Nearby Hospitals ──────────────────────────────────── */}
      <details className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-neutral-light dark:border-gray-800 p-5 shadow-sm">
        <summary className="font-heading font-bold text-lg text-neutral-dark dark:text-white cursor-pointer flex items-center gap-2">
          <Building2 size={20} className="text-primary" />
          Seed Nearby Hospitals
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-neutral-mid">
            Fetch hospitals from OpenStreetMap near your current location and add them to the database.
          </p>

          {latitude && longitude && (
            <div className="flex items-center gap-2 text-xs bg-success/5 border border-success/20 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
              <span className="text-success font-medium">
                GPS: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
            </div>
          )}

          {!latitude && (
            <div className="flex items-center gap-2 text-xs bg-accent/5 border border-accent/20 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
              <span className="text-accent font-medium">Acquiring GPS location...</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-dark dark:text-white whitespace-nowrap">
              Search radius:
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={seedRadius}
              onChange={(e) => setSeedRadius(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-sm font-bold text-primary w-12 text-right">{seedRadius} km</span>
          </div>

          <Button
            onClick={async () => {
              if (!latitude || !longitude) return
              setSeeding(true)
              setSeedResult(null)
              try {
                const { data, error } = await supabase.functions.invoke('seed-hospitals', {
                  body: { lat: latitude, lng: longitude, radius: seedRadius },
                })
                if (error) throw error
                setSeedResult(data)
                // Refresh inventory since new hospitals may have been added
                const { data: freshInv } = await supabase.from('blood_inventory').select('*')
                if (freshInv) setInventory(freshInv)
              } catch (err) {
                setSeedResult({ error: err.message })
              } finally {
                setSeeding(false)
              }
            }}
            isLoading={seeding}
            disabled={!latitude || !longitude}
            className="w-full flex items-center justify-center gap-2 h-12"
          >
            <Crosshair size={18} />
            {seeding ? 'Fetching hospitals...' : 'Seed Hospitals Near Me'}
          </Button>

          {seedResult && (
            <div className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
              seedResult.error
                ? 'bg-danger/5 border border-danger/20 text-danger'
                : 'bg-success/5 border border-success/20 text-success'
            }`}>
              {seedResult.error ? (
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col gap-1">
                <span className="font-semibold">
                  {seedResult.error || seedResult.message}
                </span>
                {seedResult.inserted != null && (
                  <span className="opacity-80">
                    Found {seedResult.total_found} hospitals, inserted {seedResult.inserted} new ones.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
