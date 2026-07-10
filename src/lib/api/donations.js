import { supabase } from '../supabase'

/**
 * Log a donation after the donor has completed it.
 */
export const logDonation = async ({
  requestId,
  hospitalName,
  unitsDonated = 1,
  proofUrl,
  feedback,
}) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('donations')
    .insert({
      donor_id: user.id,
      request_id: requestId,
      hospital_name: hospitalName,
      units_donated: unitsDonated,
      proof_url: proofUrl,
      feedback,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch donation history for the current donor.
 */
export const getMyDonations = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('donations')
    .select('*, blood_requests(blood_group, hospital_name, urgency)')
    .eq('donor_id', user.id)
    .order('donated_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Upload a proof image to Supabase Storage and return its public URL.
 */
export const uploadDonationProof = async (file, donationId) => {
  const ext = file.name.split('.').pop()
  const path = `donation-proofs/${donationId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('rudhi-uploads')
    .upload(path, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('rudhi-uploads')
    .getPublicUrl(path)

  return data.publicUrl
}
