import { supabase } from '../supabase'

/**
 * Create a new blood request and trigger donor matching.
 */
export const createBloodRequest = async ({
  hospitalName,
  hospitalAddress,
  hospitalLat,
  hospitalLng,
  patientName,
  receiverAddress,
  receiverLat,
  receiverLng,
  bloodGroup,
  units = 1,
  urgency = 'critical',
  notes,
  alertRadiusKm = 10,
  smsEnabled = false,
}) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('blood_requests')
    .insert({
      requester_id: user.id,
      hospital_name: hospitalName,
      hospital_address: hospitalAddress,
      hospital_location: hospitalLat && hospitalLng
        ? `POINT(${hospitalLng} ${hospitalLat})`
        : null,
      patient_name: patientName,
      receiver_address: receiverAddress,
      receiver_location: receiverLat && receiverLng
        ? `POINT(${receiverLng} ${receiverLat})`
        : null,
      blood_group: bloodGroup,
      units_needed: units,
      urgency,
      notes,
      alert_radius_km: alertRadiusKm,
      sms_enabled: smsEnabled,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch a single request with its donor responses.
 */
export const getRequest = async (requestId) => {
  // Use a query that expands the geometry to GeoJSON for reliable frontend parsing
  const { data, error } = await supabase
    .from('blood_requests')
    .select(`
      *,
      donor_responses (
        id, response, accepted_at,
        profiles ( id, full_name, blood_group, avatar_url )
      )
    `)
    .eq('id', requestId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get active requests near a location (for the donor home feed).
 */
export const getNearbyRequests = async () => {
  const { data, error } = await supabase
    .from('blood_requests')
    .select('*')
    .in('status', ['searching', 'matched'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get all requests made by the current requester.
 */
export const getMyRequests = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Cancel a blood request.
 */
export const cancelRequest = async (requestId) => {
  const { data, error } = await supabase
    .from('blood_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Donor responds to a request.
 */
export const respondToRequest = async (requestId, response = 'accepted') => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('donor_responses')
    .upsert({
      request_id: requestId,
      donor_id: user.id,
      response,
      accepted_at: response === 'accepted' ? new Date().toISOString() : null,
    }, { onConflict: 'request_id,donor_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update receiver (patient) location on a blood request.
 */
export const updateReceiverLocation = async (requestId, lat, lng) => {
  const point = `POINT(${lng} ${lat})`

  const { data, error } = await supabase
    .from('blood_requests')
    .update({ receiver_location: point })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Subscribe to real-time updates for a request (for live tracking).
 */
export const subscribeToRequest = (requestId, callback) => {
  return supabase
    .channel(`request:${requestId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'blood_requests', filter: `id=eq.${requestId}` },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'donor_responses', filter: `request_id=eq.${requestId}` },
      callback
    )
    .subscribe()
}
