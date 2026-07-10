import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Modal = ({ open, onOpenChange, title, description, children, trigger, variant = 'modal', className }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-neutral-dark/50 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed z-50 bg-white dark:bg-gray-900 shadow-xl focus:outline-none overflow-hidden",
            variant === 'modal' ? "left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-2xl animate-fade-in p-6" : "bottom-0 left-0 w-full rounded-t-2xl animate-slide-up p-6",
            className
          )}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              {title && <Dialog.Title className="text-lg font-heading font-bold text-neutral-dark dark:text-white">{title}</Dialog.Title>}
              {description && <Dialog.Description className="text-sm text-neutral-mid mt-1">{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <button className="text-neutral-mid hover:text-neutral-dark dark:hover:text-white transition-colors touch-target -mt-2 -mr-2 p-2">
                <X size={20} />
                <span className="sr-only">Close</span>
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
