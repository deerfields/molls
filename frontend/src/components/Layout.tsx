import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Home,
  Users,
  Building2,
  Store,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  User,
  Wifi,
  Brain,
  Eye
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Tenants', href: '/tenants', icon: Store },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Malls', href: '/malls', icon: Building2 },
  { name: 'IoT Dashboard', href: '/iot', icon: Wifi },
  { name: 'AI Analytics', href: '/ai', icon: Brain },
  { name: 'Computer Vision', href: '/computer-vision', icon: Eye },
  { name: 'Settings', href: '/settings', icon: Settings },
]

function BottomNav() {
  const location = useLocation()
  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'IoT', href: '/iot', icon: Wifi },
    { name: 'AI', href: '/ai', icon: Brain },
    { name: 'Security', href: '/computer-vision', icon: Eye },
    { name: 'Profile', href: '/settings', icon: User },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-white border-t border-gray-200 shadow-md py-1 sm:hidden transition-all duration-200 ease-in-out">
      {navItems.map(item => {
        const isActive = location.pathname === item.href
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 text-xs font-medium transition-colors duration-200 ease-in-out ${
              isActive ? 'text-primary-600' : 'text-gray-500 hover:text-primary-500'
            } focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`}
            aria-label={item.name}
            tabIndex={0}
          >
            <item.icon className="h-6 w-6 mb-0.5" aria-hidden="true" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-14 sm:pb-0">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-black bg-opacity-30`}
        style={{ pointerEvents: sidebarOpen ? 'auto' : 'none' }}
        onClick={() => setSidebarOpen(false)}
      >
        <div
          className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-lg transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">MallOS</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px]"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md min-h-[44px] min-w-[44px] transition-colors duration-200 ease-in-out ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <Building2 className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">MallOS Enterprise</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md min-h-[44px] min-w-[44px] transition-colors duration-200 ease-in-out ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            tabIndex={0}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          {/* Search */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                placeholder="Search..."
              />
            </div>
          </div>
          {/* Right side */}
          <button className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 min-h-[44px] min-w-[44px]">
            <Bell className="h-6 w-6" />
          </button>
          <div className="relative">
            <div className="flex items-center gap-x-3">
              <div className="flex items-center gap-x-3">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-x-2 text-sm text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Bottom navigation for mobile */}
      <BottomNav />
    </div>
  )
} 