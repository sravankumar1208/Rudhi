import { cn } from '../../lib/utils'

export const Badge = ({ className, children, variant = 'default', status }) => {
  const bgColors = {
    'O-': 'bg-[#EF4444] text-white',
    'O+': 'bg-[#F97316] text-white',
    'A+': 'bg-[#3B82F6] text-white',
    'A-': 'bg-[#60A5FA] text-white',
    'B+': 'bg-[#8B5CF6] text-white',
    'B-': 'bg-[#A78BFA] text-white',
    'AB+': 'bg-[#14B8A6] text-white',
    'AB-': 'bg-[#2DD4BF] text-white',
  }

  const statusColors = {
    active: 'bg-success/10 text-success border border-success/20',
    searching: 'bg-accent/10 text-accent border border-accent/20 animate-pulse',
    completed: 'bg-neutral-mid/10 text-neutral-mid border border-neutral-mid/20',
    cancelled: 'bg-danger/10 text-danger border border-danger/20',
    on_cooldown: 'bg-accent/10 text-accent border border-accent/20',
  }

  const defaultStyles = "bg-neutral-light text-neutral-dark dark:bg-gray-800 dark:text-gray-200"

  let appliedStyles = defaultStyles
  if (variant === 'blood' && children in bgColors) {
    appliedStyles = bgColors[children]
  } else if (variant === 'status' && status in statusColors) {
    appliedStyles = statusColors[status]
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        appliedStyles,
        className
      )}
    >
      {children}
    </span>
  )
}
