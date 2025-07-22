import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Award, 
  Calendar, 
  Gift, 
  User, 
  LogOut,
  Coins
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { User } from '@/types'

interface HeaderProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function Header({ currentPage, onPageChange }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      if (state.user) {
        // Get or create user profile
        try {
          const existingUsers = await blink.db.users.list({
            where: { email: state.user.email },
            limit: 1
          })

          if (existingUsers.length > 0) {
            setUser(existingUsers[0] as User)
          } else {
            // Create new user profile
            const newUser = await blink.db.users.create({
              id: `user_${Date.now()}`,
              email: state.user.email,
              displayName: state.user.email.split('@')[0],
              points: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            setUser(newUser as User)
          }
        } catch (error) {
          console.error('Error loading user:', error)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleLogout = () => {
    blink.auth.logout()
  }

  if (loading) {
    return (
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
    )
  }

  if (!user) {
    return (
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold text-gray-900">WellnessRewards</h1>
          </div>
          <Button onClick={() => blink.auth.login()}>Sign In</Button>
        </div>
      </header>
    )
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Award },
    { id: 'recognition', label: 'Recognition', icon: Heart },
    { id: 'checkin', label: 'Check-in', icon: Calendar },
    { id: 'services', label: 'Services', icon: Calendar },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'profile', label: 'Profile', icon: User }
  ]

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold text-gray-900">WellnessRewards</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Coins className="w-4 h-4" />
            <span>{user.points} points</span>
          </Badge>
          
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user.displayName}
            </span>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden mt-4 flex items-center space-x-4 overflow-x-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                currentPage === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </header>
  )
}