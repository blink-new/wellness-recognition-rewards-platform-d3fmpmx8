import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Award, 
  TrendingUp, 
  Calendar, 
  Heart,
  Users,
  Gift,
  CheckCircle,
  Clock
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { User, Recognition, DailyCheckin, Appointment } from '@/types'

interface DashboardProps {
  user: User
  onPageChange: (page: string) => void
}

export function Dashboard({ user, onPageChange }: DashboardProps) {
  const [recentRecognitions, setRecentRecognitions] = useState<Recognition[]>([])
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      // Load recent recognitions
      const recognitions = await blink.db.recognitions.list({
        where: { receiverId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 5
      })
      setRecentRecognitions(recognitions as Recognition[])

      // Check for today's check-in
      const today = new Date().toISOString().split('T')[0]
      const checkins = await blink.db.dailyCheckins.list({
        where: { 
          userId: user.id,
          createdAt: { gte: `${today}T00:00:00.000Z` }
        },
        limit: 1
      })
      setTodayCheckin(checkins.length > 0 ? checkins[0] as DailyCheckin : null)

      // Load upcoming appointments
      const appointments = await blink.db.appointments.list({
        where: { 
          userId: user.id,
          status: 'scheduled',
          appointmentDate: { gte: new Date().toISOString() }
        },
        orderBy: { appointmentDate: 'asc' },
        limit: 3
      })
      setUpcomingAppointments(appointments as Appointment[])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    loadDashboardData()
  }, [user.id, loadDashboardData])

  const stats = [
    {
      title: 'Total Points',
      value: user.points.toLocaleString(),
      icon: Award,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Recognitions Received',
      value: recentRecognitions.length,
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Check-in Streak',
      value: '7 days', // This would be calculated from actual data
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ]

  const recognitionCategories = {
    time_off_honesty: { label: 'Time Off Honesty', color: 'bg-blue-100 text-blue-800' },
    work_life_balance: { label: 'Work-Life Balance', color: 'bg-green-100 text-green-800' },
    colleague_support: { label: 'Colleague Support', color: 'bg-purple-100 text-purple-800' },
    health_activity: { label: 'Health Activity', color: 'bg-red-100 text-red-800' },
    benefits_usage: { label: 'Benefits Usage', color: 'bg-yellow-100 text-yellow-800' }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                  <div className="w-16 h-8 bg-gray-200 rounded" />
                  <div className="w-24 h-4 bg-gray-200 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.displayName}!
          </h1>
          <p className="text-gray-600">Here's your wellness journey overview</p>
        </div>
        
        {!todayCheckin && (
          <Button onClick={() => onPageChange('checkin')} className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Daily Check-in</span>
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Recognitions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-600" />
              <span>Recent Recognitions</span>
            </CardTitle>
            <CardDescription>
              Wellness recognitions you've received from colleagues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecognitions.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recognitions yet</p>
                <p className="text-sm text-gray-400">
                  Keep up the great wellness habits!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRecognitions.map((recognition) => (
                  <div key={recognition.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {recognition.giverId.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge 
                          variant="secondary" 
                          className={recognitionCategories[recognition.category]?.color}
                        >
                          {recognitionCategories[recognition.category]?.label}
                        </Badge>
                        <span className="text-sm font-medium text-primary">
                          +{recognition.pointsAwarded} points
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{recognition.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(recognition.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onPageChange('recognition')}
                >
                  View All Recognitions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Upcoming */}
        <div className="space-y-6">
          {/* Today's Check-in Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Today's Wellness</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayCheckin ? (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Check-in Complete!</p>
                    <p className="text-sm text-green-600">
                      Wellness score: {todayCheckin.wellnessScore}/5
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-3">Haven't checked in today</p>
                  <Button onClick={() => onPageChange('checkin')} className="w-full">
                    Complete Daily Check-in
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Upcoming Appointments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 mb-3">No upcoming appointments</p>
                  <Button 
                    variant="outline" 
                    onClick={() => onPageChange('services')}
                    className="w-full"
                  >
                    Book Wellness Service
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-800">
                          {appointment.service?.name || 'Wellness Service'}
                        </p>
                        <p className="text-sm text-blue-600">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                          {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onPageChange('services')}
                  >
                    Manage Appointments
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onPageChange('recognition')}
              >
                <Heart className="w-4 h-4 mr-2" />
                Give Recognition
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onPageChange('rewards')}
              >
                <Gift className="w-4 h-4 mr-2" />
                Browse Rewards
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onPageChange('services')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Service
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}