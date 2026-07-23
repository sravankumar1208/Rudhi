import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/**
 * Robust PostGIS Location Parser
 * Handles: GeoJSON, {lat, lng}, POINT strings, and WKB HEX strings from Supabase.
 */
export function parseLocation(loc) {
  if (!loc) return null

  // 1. Handle standard object {lat, lng}
  if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng }
  }

  // 2. Handle GeoJSON object { coordinates: [lng, lat] }
  if (loc.coordinates && Array.isArray(loc.coordinates)) {
    return { lat: loc.coordinates[1], lng: loc.coordinates[0] }
  }

  // 3. Handle string formats
  if (typeof loc === 'string') {
    // A. Handle "POINT(lng lat)"
    const pointMatch = loc.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/i)
    if (pointMatch) {
      return { lat: parseFloat(pointMatch[2]), lng: parseFloat(pointMatch[1]) }
    }

    // B. Handle PostGIS WKB HEX (SRID 4326)
    // Format: 0101000020E6100000 + 8 bytes (X) + 8 bytes (Y)
    if (loc.startsWith('0101000020E6100000') && loc.length >= 50) {
      try {
        // Extract 8-byte double (little endian) for X and Y
        const hexToDouble = (hex) => {
          const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
          const view = new DataView(bytes.buffer);
          return view.getFloat64(0, true);
        };

        const lng = hexToDouble(loc.substring(18, 34));
        const lat = hexToDouble(loc.substring(34, 50));

        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
      } catch (e) {
        console.error('[Rudhi] Failed to parse WKB Hex:', e);
      }
    }
  }

  return null
}
