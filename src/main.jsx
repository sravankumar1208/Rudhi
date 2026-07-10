import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './components/AuthProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version available! Update to get the latest features?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready for offline use')
  },
  onRegistered(swRegistration) {
    // Check for updates every hour
    setInterval(() => {
      swRegistration.update()
    }, 60 * 60 * 1000)
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#1A9E5C', secondary: '#fff' } },
          error: { iconTheme: { primary: '#C0152A', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
