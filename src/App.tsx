import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Dashboard } from '@/components/pages/Dashboard'
import DailyCheckin from '@/components/pages/DailyCheckin'
import RecognitionHub from '@/components/pages/RecognitionHub'
import { blink } from '@/blink/client'
import type { User } from '@/types'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WellnessRewards...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to WellnessRewards</h1>
            <p className="text-gray-600 mb-6">
              Join your team in celebrating wellness behaviors, tracking daily health, and earning rewards for taking care of yourself and supporting colleagues.
            </p>
            <button
              onClick={() => blink.auth.login()}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Sign In to Get Started
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} onPageChange={setCurrentPage} />
      case 'recognition':
        return <RecognitionHub />
      case 'checkin':
        return <DailyCheckin />
      case 'services':
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Wellness Services</h2>
              <p className="text-gray-600">Coming soon! Book appointments and wellness services.</p>
            </div>
          </div>
        )
      case 'rewards':
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Rewards Store</h2>
              <p className="text-gray-600">Coming soon! Redeem points for airtime, electricity, and groceries.</p>
            </div>
          </div>
        )
      case 'profile':
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
              <p className="text-gray-600">Coming soon! Manage your profile and wellness journey.</p>
            </div>
          </div>
        )
      default:
        return <Dashboard user={user} onPageChange={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="min-h-[calc(100vh-80px)]">
        {renderCurrentPage()}
      </main>
    </div>
  )
}

export default App