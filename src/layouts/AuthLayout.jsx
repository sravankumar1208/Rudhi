import { Outlet } from 'react-router-dom'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-secondary dark:bg-dark-bg w-full">
      <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-gray-900 shadow-xl relative overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  )
}
