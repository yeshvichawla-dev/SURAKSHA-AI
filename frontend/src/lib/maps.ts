let loading: Promise<void> | null = null

declare global {
  interface Window {
    __surakshaMapsReady?: () => void
    gm_authFailure?: () => void
  }
}

export const MAP_ID: string = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID'

/** Loads the Google Maps JavaScript API once (maps, marker and places libraries). */
export function loadGoogleMaps(): Promise<void> {
  if (loading) return loading
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  if (!key) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY. Add it to frontend/.env and restart npm run dev.'))
  }
  window.gm_authFailure = () => window.dispatchEvent(new Event('suraksha-maps-auth-failure'))
  loading = new Promise<void>((resolve, reject) => {
    window.__surakshaMapsReady = async () => {
      try {
        await google.maps.importLibrary('maps')
        await google.maps.importLibrary('marker')
        await google.maps.importLibrary('places')
        resolve()
      } catch (e) {
        reject(e)
      }
    }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&v=weekly&callback=__surakshaMapsReady`
    s.async = true
    s.onerror = () => reject(new Error('Could not load Google Maps. Check your internet connection.'))
    document.head.appendChild(s)
  })
  loading.catch(() => { loading = null })
  return loading
}
