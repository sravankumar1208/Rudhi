import { supabase } from '../supabase'

export const getHospitals = async () => {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export const getHospitalById = async (id) => {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const updateHospitalLocation = async (hospitalId, lat, lng) => {
  const point = `POINT(${lng} ${lat})`

  const { data, error } = await supabase
    .from('hospitals')
    .update({ location: point })
    .eq('id', hospitalId)

  if (error) throw error
  return data
}

export const findNearbyHospitals = async (lat, lng, radiusKm = 50) => {
  const { data, error } = await supabase
    .rpc('find_nearby_hospitals', { lat, lng, radius_km: radiusKm })

  if (error) throw error
  return data
}

export const getBloodInventory = async (hospitalId) => {
  const { data, error } = await supabase
    .from('blood_inventory')
    .select('*')
    .eq('hospital_id', hospitalId)

  if (error) throw error
  return data
}
