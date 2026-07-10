import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Heart, Camera } from 'lucide-react'
import ReactConfetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { logDonation, uploadDonationProof } from '../lib/api/donations'
import { getRequest } from '../lib/api/requests'
import toast from 'react-hot-toast'

export const LogDonation = () => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { width, height } = useWindowSize()
  
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [units, setUnits] = useState(1)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setPhoto(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const request = await getRequest(requestId)
      let proofUrl = null
      if (photoFile) {
        const donationId = crypto.randomUUID?.() || `don-${Date.now()}`
        proofUrl = await uploadDonationProof(photoFile, donationId)
      }
      await logDonation({
        requestId,
        hospitalName: request?.hospital_name || 'Hospital',
        unitsDonated: units,
        proofUrl,
        feedback,
      })
      setIsSubmitting(false)
      setIsSuccess(true)
      setTimeout(() => {
        navigate(`/donation-certificate/${requestId}`)
      }, 3000)
    } catch (err) {
      toast.error(err.message || 'Failed to log donation')
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] w-full px-6 text-center bg-white dark:bg-gray-900 relative">
        <ReactConfetti width={width} height={height} recycle={false} numberOfPieces={500} colors={['#C0152A', '#E8A020', '#1A9E5C', '#3B82F6']} />
        
        <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6 animate-slide-up">
          <Heart className="text-success fill-success animate-pulse" size={48} />
        </div>
        
        <h1 className="font-heading font-black text-3xl text-neutral-dark dark:text-white mb-3 animate-fade-in">
          You're a Hero!
        </h1>
        <p className="text-neutral-mid text-lg font-medium animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Thank you for saving a life today.
        </p>
        <p className="text-sm text-neutral-mid mt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Generating your certificate...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] w-full px-6 py-8">
      <div className="flex flex-col gap-2 mb-8 text-center">
        <h2 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">Log Your Donation</h2>
        <p className="text-sm text-neutral-mid">Record your generous act to claim your certificate and start your cooldown period.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
        
        {/* Verification Photo */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-neutral-dark dark:text-white">Upload Donation Proof (Optional)</label>
          <label className="relative w-full h-40 rounded-xl bg-neutral-light dark:bg-gray-800 border-2 border-dashed border-neutral-mid flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
            {photo ? (
              <>
                <img src={photo} alt="Donation Proof" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-medium flex items-center gap-2"><Camera size={18} /> Change Photo</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-neutral-mid group-hover:text-primary transition-colors">
                <Camera size={32} />
                <span className="text-sm font-medium">Tap to upload photo</span>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </label>
        </div>

        <Input label="Units Donated" type="number" min="1" max="2" value={units} onChange={(e) => setUnits(Number(e.target.value))} required />
        
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-neutral-dark dark:text-white">How was your experience?</label>
          <textarea 
            className="w-full rounded-lg border border-neutral-light dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]" 
            placeholder="Tell us about the hospital staff, process, etc..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <div className="mt-auto pt-8">
          <Button type="submit" size="lg" className="w-full h-14 text-lg bg-primary" isLoading={isSubmitting}>
            Confirm Donation
          </Button>
        </div>
      </form>
    </div>
  )
}
