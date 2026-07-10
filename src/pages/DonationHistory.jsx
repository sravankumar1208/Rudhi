import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Award, ChevronRight } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { getMyDonations } from '../lib/api/donations'

export const DonationHistory = () => {
  const navigate = useNavigate()
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyDonations()
      .then(setDonations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="flex flex-col min-h-screen w-full px-4 py-6 bg-secondary dark:bg-dark-bg">
      <div className="flex flex-col items-center justify-center py-6 mb-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
          <Award size={32} />
        </div>
        <h2 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">{donations.length} Lives Saved</h2>
        <p className="text-sm text-neutral-mid mt-1">Thank you for your consistent support.</p>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-8 text-neutral-mid">Loading...</div>
        ) : donations.length === 0 ? (
          <div className="text-center py-8 text-neutral-mid font-medium">No donations yet</div>
        ) : donations.map((donation) => {
          const dateStr = formatDate(donation.donated_at)
          const [day, month] = dateStr.split(' ')
          return (
            <Card key={donation.id} interactive className="flex items-center p-4 cursor-pointer" onClick={() => navigate(`/donation-certificate/${donation.id}`)}>
              <div className="flex flex-col items-center justify-center bg-neutral-light dark:bg-gray-800 rounded-lg w-14 h-14 mr-4 shrink-0">
                <span className="text-xs font-bold text-neutral-mid uppercase">{month || ''}</span>
                <span className="text-lg font-heading font-bold text-neutral-dark dark:text-white leading-none">{day || ''}</span>
              </div>
              
              <div className="flex flex-col flex-1">
                <h3 className="font-semibold text-neutral-dark dark:text-white text-base">{donation.hospital_name}</h3>
                <div className="flex items-center gap-1 text-xs text-neutral-mid mt-0.5">
                  <MapPin size={12} /> {donation.hospital_name}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-primary/10 text-primary border border-primary/20">{donation.units_donated} Unit{donation.units_donated > 1 ? 's' : ''}</Badge>
                  <Badge variant="status" status={donation.status === 'confirmed' ? 'completed' : 'active'}>{donation.status}</Badge>
                </div>
              </div>

              <div className="text-neutral-mid ml-2">
                <ChevronRight size={20} />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
