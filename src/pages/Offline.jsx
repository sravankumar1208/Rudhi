import { WifiOff, RefreshCw } from 'lucide-react'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'
import { Button } from '../components/ui/Button'

export const Offline = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary dark:bg-dark-bg p-8 gap-6">
      <div className="relative">
        <BloodDropIcon size={64} className="text-primary/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <WifiOff size={32} className="text-neutral-mid" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">You're Offline</h1>
        <p className="text-sm text-neutral-mid max-w-xs">
          Don't worry — Rudhi works offline too. Your pending data will sync automatically when you're back online.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-neutral-light dark:border-gray-800 w-full max-w-sm shadow-sm flex flex-col gap-3">
        <h2 className="font-semibold text-sm text-neutral-dark dark:text-white">Available Offline</h2>
        <ul className="flex flex-col gap-2 text-sm text-neutral-mid">
          {[
            'View your donation history',
            'Check donor certificate',
            'View saved hospital info',
            'Read FAQs',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 max-w-sm flex items-start gap-3">
        <RefreshCw size={18} className="text-accent mt-0.5 shrink-0 animate-spin" />
        <p className="text-xs text-neutral-dark dark:text-white">
          Auto-reconnecting... Your data will be synced once the connection is restored.
        </p>
      </div>

      <Button variant="secondary" className="mt-2" onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  )
}
