import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export const TopHeader = ({ title, rightAction }) => {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-neutral-light dark:border-gray-800 z-40 px-4 flex items-center justify-between">
      <button 
        onClick={() => navigate(-1)} 
        className="w-10 h-10 flex items-center justify-center -ml-2 text-neutral-dark dark:text-white rounded-full hover:bg-neutral-light dark:hover:bg-gray-800 transition-colors touch-target"
        aria-label="Go back"
      >
        <ArrowLeft size={24} />
      </button>
      
      <h1 className="text-lg font-heading font-bold text-neutral-dark dark:text-white truncate px-2 text-center absolute left-1/2 -translate-x-1/2 w-3/5">
        {title}
      </h1>

      <div className="w-10 flex justify-end">
        {rightAction}
      </div>
    </header>
  )
}
