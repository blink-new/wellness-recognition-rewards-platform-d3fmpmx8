import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'
import { 
  Heart, 
  Thermometer, 
  Activity, 
  Brain, 
  CheckCircle, 
  Calendar,
  Award,
  TrendingUp,
  Smile,
  Meh,
  Frown
} from 'lucide-react'
import { blink } from '../../blink/client'
import { CheckIn, User } from '../../types'

const MOOD_OPTIONS = [
  { value: 'excellent', label: 'Excellent', icon: Smile, color: 'text-green-500' },
  { value: 'good', label: 'Good', icon: Smile, color: 'text-green-400' },
  { value: 'okay', label: 'Okay', icon: Meh, color: 'text-yellow-500' },
  { value: 'poor', label: 'Poor', icon: Frown, color: 'text-orange-500' },
  { value: 'terrible', label: 'Terrible', icon: Frown, color: 'text-red-500' }
]

const WELLNESS_CATEGORIES = [
  { id: 'physical', label: 'Physical Health', icon: Activity, color: 'bg-blue-100 text-blue-700' },
  { id: 'mental', label: 'Mental Health', icon: Brain, color: 'bg-purple-100 text-purple-700' },
  { id: 'sleep', label: 'Sleep Quality', icon: Heart, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'stress', label: 'Stress Level', icon: Thermometer, color: 'bg-orange-100 text-orange-700' }
]

const COMMON_SYMPTOMS = [
  'Headache', 'Fatigue', 'Cough', 'Fever', 'Sore throat', 
  'Nausea', 'Body aches', 'Congestion', 'Dizziness', 'Anxiety'
]

export default function DailyCheckin() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [todayCheckin, setTodayCheckin] = useState<CheckIn | null>(null)
  const [streak, setStreak] = useState(0)
  
  // Form state
  const [mood, setMood] = useState('')
  const [wellnessScore, setWellnessScore] = useState(7)
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [customSymptom, setCustomSymptom] = useState('')
  const [notes, setNotes] = useState('')
  const [categories, setCategories] = useState<Record<string, number>>({
    physical: 7,
    mental: 7,
    sleep: 7,
    stress: 3
  })

  const loadTodayCheckin = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const checkins = await blink.db.checkins.list({
        where: { 
          AND: [
            { userId },
            { date: today }
          ]
        },
        limit: 1
      })
      
      if (checkins.length > 0) {
        const checkin = checkins[0]
        setTodayCheckin(checkin)
        setMood(checkin.mood)
        setWellnessScore(checkin.wellnessScore)
        setSymptoms(checkin.symptoms ? JSON.parse(checkin.symptoms) : [])
        setNotes(checkin.notes || '')
        setCategories(checkin.categories ? JSON.parse(checkin.categories) : {
          physical: 7, mental: 7, sleep: 7, stress: 3
        })
      }
    } catch (error) {
      console.error('Error loading today\'s check-in:', error)
    }
  }

  const loadStreak = async (userId: string) => {
    try {
      const checkins = await blink.db.checkins.list({
        where: { userId },
        orderBy: { date: 'desc' },
        limit: 30
      })
      
      // Calculate streak
      let currentStreak = 0
      const today = new Date()
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]
        
        const hasCheckin = checkins.some(c => c.date === dateStr)
        if (hasCheckin) {
          currentStreak++
        } else if (i > 0) { // Allow missing today if it's current day
          break
        }
      }
      
      setStreak(currentStreak)
    } catch (error) {
      console.error('Error loading streak:', error)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      if (state.user) {
        setUser(state.user)
        await loadTodayCheckin(state.user.id)
        await loadStreak(state.user.id)
      }
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const handleSymptomToggle = (symptom: string) => {
    setSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !symptoms.includes(customSymptom.trim())) {
      setSymptoms(prev => [...prev, customSymptom.trim()])
      setCustomSymptom('')
    }
  }

  const handleSubmit = async () => {
    if (!user || !mood) return
    
    setSubmitting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const checkinData = {
        userId: user.id,
        date: today,
        mood,
        wellnessScore,
        symptoms: JSON.stringify(symptoms),
        notes,
        categories: JSON.stringify(categories),
        createdAt: new Date().toISOString()
      }

      if (todayCheckin) {
        // Update existing check-in
        await blink.db.checkins.update(todayCheckin.id, checkinData)
      } else {
        // Create new check-in and award points
        await blink.db.checkins.create({
          id: `checkin_${Date.now()}`,
          ...checkinData
        })
        
        // Award points for daily check-in
        await blink.db.users.update(user.id, {
          points: (user.points || 0) + 10
        })
        
        setUser(prev => prev ? { ...prev, points: (prev.points || 0) + 10 } : null)
      }
      
      await loadTodayCheckin(user.id)
      await loadStreak(user.id)
      
    } catch (error) {
      console.error('Error submitting check-in:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your wellness check-in...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to WellnessRewards</CardTitle>
            <CardDescription>Please sign in to access your daily wellness check-in</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => blink.auth.login()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedMood = MOOD_OPTIONS.find(m => m.value === mood)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Daily Wellness Check-in</h1>
              <p className="text-muted-foreground">Track your wellness journey and earn points</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{streak} day streak</span>
            </div>
            {todayCheckin && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Completed Today
              </Badge>
            )}
            {!todayCheckin && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                +10 points available
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Check-in Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mood Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="h-5 w-5" />
                  How are you feeling today?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {MOOD_OPTIONS.map((option) => {
                    const Icon = option.icon
                    return (
                      <Button
                        key={option.value}
                        variant={mood === option.value ? "default" : "outline"}
                        className="h-auto p-4 flex flex-col gap-2"
                        onClick={() => setMood(option.value)}
                      >
                        <Icon className={`h-6 w-6 ${mood === option.value ? 'text-white' : option.color}`} />
                        <span className="text-sm">{option.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Overall Wellness Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Overall Wellness Score
                </CardTitle>
                <CardDescription>Rate your overall wellness today (1-10)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium w-8">1</span>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={wellnessScore}
                        onChange={(e) => setWellnessScore(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                    <span className="text-sm font-medium w-8">10</span>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-primary">{wellnessScore}</span>
                    <span className="text-muted-foreground ml-1">/10</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wellness Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Wellness Categories</CardTitle>
                <CardDescription>Rate different aspects of your wellness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {WELLNESS_CATEGORIES.map((category) => {
                  const Icon = category.icon
                  return (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${category.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <Label className="font-medium">{category.label}</Label>
                        </div>
                        <span className="text-sm font-medium">{categories[category.id]}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={categories[category.id]}
                        onChange={(e) => setCategories(prev => ({
                          ...prev,
                          [category.id]: Number(e.target.value)
                        }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Any symptoms today?
                </CardTitle>
                <CardDescription>Select any symptoms you're experiencing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {COMMON_SYMPTOMS.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={symptoms.includes(symptom)}
                        onCheckedChange={() => handleSymptomToggle(symptom)}
                      />
                      <Label htmlFor={symptom} className="text-sm">{symptom}</Label>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom symptom..."
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
                  />
                  <Button onClick={addCustomSymptom} variant="outline">Add</Button>
                </div>
                
                {symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {symptoms.map((symptom) => (
                      <Badge key={symptom} variant="secondary" className="cursor-pointer" 
                             onClick={() => handleSymptomToggle(symptom)}>
                        {symptom} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
                <CardDescription>Any additional thoughts about your wellness today?</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="How are you feeling? Any concerns or positive notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMood && (
                  <div className="flex items-center gap-3">
                    <selectedMood.icon className={`h-5 w-5 ${selectedMood.color}`} />
                    <span className="font-medium">{selectedMood.label}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Wellness Score</span>
                    <span className="font-medium">{wellnessScore}/10</span>
                  </div>
                  <Progress value={wellnessScore * 10} className="h-2" />
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground">Symptoms: </span>
                  <span className="font-medium">
                    {symptoms.length === 0 ? 'None reported' : `${symptoms.length} reported`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Streak Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Check-in Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{streak}</div>
                  <div className="text-sm text-muted-foreground">consecutive days</div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Keep it up! Daily check-ins earn you 10 points each.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit} 
              disabled={!mood || submitting}
              className="w-full h-12"
              size="lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {todayCheckin ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {todayCheckin ? 'Update Check-in' : 'Complete Check-in'}
                </>
              )}
            </Button>
            
            {!todayCheckin && (
              <p className="text-xs text-center text-muted-foreground">
                Complete your first check-in today to earn 10 points!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}