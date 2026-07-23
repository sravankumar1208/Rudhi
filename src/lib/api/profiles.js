import { supabase } from '../supabase'

/**
 * Fetch profile for the currently authenticated user.
 */
export const getMyProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

/**
 * Upsert (create or update) the profile for the current user.
 */
export const upsertProfile = async (profileData) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update donor availability toggle.
 */
export const setDonorAvailability = async (available) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_available: available, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update donor location (lat/lng).
 */
export const updateDonorLocation = async (lat, lng, userId) => {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    userId = user.id
  }

  const point = `POINT(${lng} ${lat})`

  const { data, error } = await supabase
    .from('profiles')
    .update({
      location: point,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
