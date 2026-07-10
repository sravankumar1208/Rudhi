import React from 'react'
import { cn } from '../../lib/utils'

export const Card = React.forwardRef(({ className, urgencyBorder, interactive, children, ...props }, ref) => {
  const urgencyStyles = {
    critical: "border-l-4 border-l-danger",
    moderate: "border-l-4 border-l-accent",
    routine: "border-l-4 border-l-success",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-neutral-light dark:border-gray-800 p-4 overflow-hidden",
        urgencyBorder && urgencyStyles[urgencyBorder],
        interactive && "cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = "Card"
