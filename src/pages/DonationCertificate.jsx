import { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Share2, Download, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'
import { useAuthStore } from '../store'
import { supabase } from '../lib/supabase'

export const DonationCertificate = () => {
  const { donationId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const certificateRef = useRef(null)
  const [donation, setDonation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!donationId) return
    supabase.from('donations').select('*, blood_requests(blood_group, hospital_name)').eq('id', donationId).single()
      .then(({ data, error }) => {
        if (!error) setDonation(data)
      })
      .finally(() => setLoading(false))
  }, [donationId])

  const donorName = profile?.full_name || 'Donor'
  const date = donation?.donated_at ? new Date(donation.donated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'
  const hospital = donation?.blood_requests?.hospital_name || donation?.hospital_name || 'Hospital'
  const displayId = donationId?.slice(0, 8)?.toUpperCase() || 'RUDHI-0000'

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Blood Donation Certificate',
          text: `I just donated blood at ${hospital} using Rudhi! Every drop counts.`,
          url: window.location.href,
        })
      } catch { /* sharing not supported */ }
    } else {
      alert("Sharing not supported on this browser.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-neutral-mid">Loading...</div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full px-4 py-6 bg-secondary dark:bg-dark-bg">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-900 border border-neutral-light dark:border-gray-800 text-neutral-dark dark:text-white">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-heading font-bold text-lg text-neutral-dark dark:text-white">Certificate</h2>
        <div className="w-10" />
      </div>

      <div 
        ref={certificateRef}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-neutral-light dark:border-gray-800 relative mx-auto w-full max-w-sm aspect-[4/5] flex flex-col items-center text-center p-8 mt-2"
      >
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary rounded-tl-xl m-4 opacity-50" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-primary rounded-tr-xl m-4 opacity-50" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-primary rounded-bl-xl m-4 opacity-50" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary rounded-br-xl m-4 opacity-50" />

        <div className="flex items-center gap-2 mb-8 mt-4">
          <BloodDropIcon size={24} className="text-primary" />
          <span className="font-heading font-bold text-xl tracking-tight text-neutral-dark dark:text-white">Rudhi</span>
        </div>

        <h1 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-2">Certificate of</h1>
        <h2 className="text-3xl font-heading font-black text-neutral-dark dark:text-white uppercase tracking-wider mb-2">Appreciation</h2>
        <span className="text-[10px] text-neutral-mid font-mono mb-6">#{displayId}</span>

        <p className="text-sm text-neutral-mid mb-2">This certificate is proudly presented to</p>
        <h3 className="text-2xl font-bold text-neutral-dark dark:text-white border-b-2 border-neutral-light dark:border-gray-800 pb-2 mb-6 w-full px-4">{donorName}</h3>

        <p className="text-xs text-neutral-mid max-w-[240px] mb-8 leading-relaxed">
          For their noble act of donating blood and helping save a life at <span className="font-bold text-neutral-dark dark:text-white">{hospital}</span> on <span className="font-bold text-neutral-dark dark:text-white">{date}</span>.
        </p>

        <div className="mt-auto flex justify-between w-full px-4 items-end">
          <div className="flex flex-col items-center">
            <div className="w-24 border-b border-neutral-dark dark:border-gray-500 mb-1" />
            <span className="text-[10px] text-neutral-mid font-medium uppercase tracking-wider">Authorized</span>
          </div>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <span className="text-[10px] font-bold text-primary transform -rotate-12">VERIFIED</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8 px-2">
        <Button className="flex-1 flex gap-2 h-14 bg-primary text-white" onClick={handleShare}>
          <Share2 size={20} /> Share
        </Button>
        <Button variant="secondary" className="flex-1 flex gap-2 h-14 bg-white dark:bg-gray-900 border-neutral-light dark:border-gray-800" onClick={() => alert("Download started")}>
          <Download size={20} /> Save PDF
        </Button>
      </div>
    </div>
  )
}
