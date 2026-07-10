import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Filter } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { getMyRequests } from '../lib/api/requests'
import { formatRelativeTime } from '../lib/utils'

const statusConfig = {
  searching: { label: 'Searching', color: 'bg-accent/10 text-accent border-accent/20' },
  matched: { label: 'Matched', color: 'bg-primary/10 text-primary border-primary/20' },
  fulfilled: { label: 'Fulfilled', color: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Cancelled', color: 'bg-neutral-light text-neutral-mid border-neutral-mid/20' },
}

export const MyRequests = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyRequests()
      .then(data => setRequests(data.map(r => ({ ...r, _timeAgo: formatRelativeTime(r.created_at) }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg p-4 gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">My Requests</h1>
        <Button size="sm" className="flex gap-2 h-10" onClick={() => navigate('/create-request')}>
          <Plus size={18} /> New
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {['all', 'searching', 'matched', 'fulfilled', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors ${
              filter === f
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-gray-900 text-neutral-mid border-neutral-light dark:border-gray-800'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-mid">Loading...</div>
        ) : filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Filter size={40} className="text-neutral-mid" />
            <p className="text-neutral-mid font-medium">No requests found</p>
          </div>
        )}

        {filtered.map((req) => {
          const cfg = statusConfig[req.status]
          const donorResponseCount = req.donor_responses?.length || req.responses || 0
          return (
            <Card key={req.id} className="flex flex-col p-4 gap-3 interactive" onClick={() => navigate(`/request-tracking/${req.id}`)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs font-bold px-3 py-1 rounded-full border ${cfg.color}`}>
                    {cfg.label}
                  </Badge>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${req.urgency === 'critical' ? 'bg-danger/10 text-danger border-danger/20' : req.urgency === 'moderate' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-success/10 text-success border-success/20'}`}>
                    {req.urgency}
                  </span>
                </div>
                <span className="text-xs text-neutral-mid">{req._timeAgo}</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-neutral-dark dark:text-white">{req.blood_group}</h3>
                  <span className="text-sm text-neutral-mid">{req.hospital_name}</span>
                </div>
                <span className="text-sm font-bold text-neutral-dark dark:text-white">{req.units_needed} unit{req.units_needed > 1 ? 's' : ''}</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-neutral-mid border-t border-neutral-light dark:border-gray-800 pt-3">
                <Users size={14} />
                <span>{donorResponseCount} donor{donorResponseCount !== 1 ? 's' : ''} responded</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
