import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Heart, 
  Award, 
  Users, 
  Clock, 
  Shield, 
  Activity, 
  Coffee, 
  Calendar,
  Plus,
  ThumbsUp,
  MessageCircle,
  Star,
  Trophy,
  Zap,
  Moon,
  Smile
} from 'lucide-react'
import { blink } from '../../blink/client'
import { toast } from '../../hooks/use-toast'

interface Recognition {
  id: string
  nominator_name: string
  nominator_email: string
  nominee_name: string
  nominee_email: string
  category: string
  message: string
  points_awarded: number
  created_at: string
  likes: number
  comments: number
  user_id: string
}

interface Comment {
  id: string
  recognition_id: string
  user_name: string
  user_email: string
  message: string
  created_at: string
}

const recognitionCategories = [
  {
    id: 'time-off-honesty',
    name: 'Time-Off Honesty',
    description: 'Being transparent about needing time off',
    icon: Clock,
    points: 25,
    color: 'bg-blue-500'
  },
  {
    id: 'work-life-balance',
    name: 'Work-Life Balance',
    description: 'Maintaining healthy boundaries',
    icon: Shield,
    points: 30,
    color: 'bg-green-500'
  },
  {
    id: 'colleague-support',
    name: 'Colleague Support',
    description: 'Helping teammates when they take time off',
    icon: Users,
    points: 35,
    color: 'bg-purple-500'
  },
  {
    id: 'health-activities',
    name: 'Health Activities',
    description: 'Flu shots, checkups, using benefits',
    icon: Activity,
    points: 40,
    color: 'bg-red-500'
  },
  {
    id: 'wellness-champion',
    name: 'Wellness Champion',
    description: 'Promoting team wellness culture',
    icon: Trophy,
    points: 50,
    color: 'bg-yellow-500'
  },
  {
    id: 'mental-health',
    name: 'Mental Health Advocacy',
    description: 'Supporting mental wellness initiatives',
    icon: Moon,
    points: 45,
    color: 'bg-indigo-500'
  }
]

export default function RecognitionHub() {
  const [recognitions, setRecognitions] = useState<Recognition[]>([])
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isNominateOpen, setIsNominateOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [nomineeEmail, setNomineeEmail] = useState('')
  const [nomineeName, setNomineeName] = useState('')
  const [recognitionMessage, setRecognitionMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('feed')
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({})

  const loadRecognitions = async () => {
    try {
      const data = await blink.db.recognitions.list({
        orderBy: { created_at: 'desc' },
        limit: 50
      })
      setRecognitions(data)
      
      // Load comments for each recognition
      const commentsData: { [key: string]: Comment[] } = {}
      for (const recognition of data) {
        const recognitionComments = await blink.db.recognition_comments.list({
          where: { recognition_id: recognition.id },
          orderBy: { created_at: 'asc' }
        })
        commentsData[recognition.id] = recognitionComments
      }
      setComments(commentsData)
    } catch (error) {
      console.error('Error loading recognitions:', error)
      toast({
        title: "Error",
        description: "Failed to load recognitions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadRecognitions()
      }
    })
    return unsubscribe
  }, [])

  const handleNominate = async () => {
    if (!selectedCategory || !nomineeEmail || !nomineeName || !recognitionMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const category = recognitionCategories.find(c => c.id === selectedCategory)
      const recognition = await blink.db.recognitions.create({
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nominator_name: user.displayName || user.email.split('@')[0],
        nominator_email: user.email,
        nominee_name: nomineeName,
        nominee_email: nomineeEmail,
        category: selectedCategory,
        message: recognitionMessage,
        points_awarded: category?.points || 25,
        created_at: new Date().toISOString(),
        likes: 0,
        comments: 0,
        user_id: user.id
      })

      // Award points to the nominee (in a real app, you'd look up their user ID)
      toast({
        title: "Recognition Sent! 🎉",
        description: `${nomineeName} has been recognized for ${category?.name} and earned ${category?.points} points!`,
      })

      // Reset form
      setSelectedCategory('')
      setNomineeEmail('')
      setNomineeName('')
      setRecognitionMessage('')
      setIsNominateOpen(false)
      
      // Reload recognitions
      loadRecognitions()
    } catch (error) {
      console.error('Error creating recognition:', error)
      toast({
        title: "Error",
        description: "Failed to send recognition",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (recognitionId: string) => {
    try {
      const recognition = recognitions.find(r => r.id === recognitionId)
      if (recognition) {
        await blink.db.recognitions.update(recognitionId, {
          likes: recognition.likes + 1
        })
        
        setRecognitions(prev => prev.map(r => 
          r.id === recognitionId ? { ...r, likes: r.likes + 1 } : r
        ))
      }
    } catch (error) {
      console.error('Error liking recognition:', error)
    }
  }

  const handleComment = async (recognitionId: string) => {
    const commentText = newComment[recognitionId]?.trim()
    if (!commentText) return

    try {
      const comment = await blink.db.recognition_comments.create({
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recognition_id: recognitionId,
        user_name: user.displayName || user.email.split('@')[0],
        user_email: user.email,
        message: commentText,
        created_at: new Date().toISOString()
      })

      // Update comments state
      setComments(prev => ({
        ...prev,
        [recognitionId]: [...(prev[recognitionId] || []), comment]
      }))

      // Update recognition comment count
      const recognition = recognitions.find(r => r.id === recognitionId)
      if (recognition) {
        await blink.db.recognitions.update(recognitionId, {
          comments: recognition.comments + 1
        })
        
        setRecognitions(prev => prev.map(r => 
          r.id === recognitionId ? { ...r, comments: r.comments + 1 } : r
        ))
      }

      // Clear comment input
      setNewComment(prev => ({ ...prev, [recognitionId]: '' }))
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = recognitionCategories.find(c => c.id === categoryId)
    if (!category) return Award
    return category.icon
  }

  const getCategoryColor = (categoryId: string) => {
    const category = recognitionCategories.find(c => c.id === categoryId)
    return category?.color || 'bg-gray-500'
  }

  const getCategoryName = (categoryId: string) => {
    const category = recognitionCategories.find(c => c.id === categoryId)
    return category?.name || categoryId
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recognition Hub</h1>
          <p className="text-gray-600 mt-2">Celebrate wellness champions in your team</p>
        </div>
        
        <Dialog open={isNominateOpen} onOpenChange={setIsNominateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nominate Someone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nominate a Wellness Champion</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nominee-name">Nominee Name</Label>
                  <Input
                    id="nominee-name"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    placeholder="Enter their name"
                  />
                </div>
                <div>
                  <Label htmlFor="nominee-email">Nominee Email</Label>
                  <Input
                    id="nominee-email"
                    type="email"
                    value={nomineeEmail}
                    onChange={(e) => setNomineeEmail(e.target.value)}
                    placeholder="Enter their email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Recognition Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a wellness category" />
                  </SelectTrigger>
                  <SelectContent>
                    {recognitionCategories.map((category) => {
                      const IconComponent = category.icon
                      return (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${category.color}`} />
                            <span>{category.name}</span>
                            <Badge variant="secondary">{category.points} pts</Badge>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {selectedCategory && (
                  <p className="text-sm text-gray-600 mt-1">
                    {recognitionCategories.find(c => c.id === selectedCategory)?.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="message">Recognition Message</Label>
                <Textarea
                  id="message"
                  value={recognitionMessage}
                  onChange={(e) => setRecognitionMessage(e.target.value)}
                  placeholder="Describe their wellness behavior and why they deserve recognition..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsNominateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleNominate} disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Recognition'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed">Recognition Feed</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          {recognitions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No recognitions yet</h3>
                <p className="text-gray-600 mb-4">Be the first to recognize a wellness champion!</p>
                <Button onClick={() => setIsNominateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Recognition
                </Button>
              </CardContent>
            </Card>
          ) : (
            recognitions.map((recognition) => {
              const IconComponent = getCategoryIcon(recognition.category)
              return (
                <Card key={recognition.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${recognition.nominator_name}`} />
                        <AvatarFallback>{recognition.nominator_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">{recognition.nominator_name}</span>
                          <span className="text-gray-500">recognized</span>
                          <span className="font-semibold text-primary">{recognition.nominee_name}</span>
                          <span className="text-gray-500">for</span>
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${getCategoryColor(recognition.category)}`} />
                            <span>{getCategoryName(recognition.category)}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{recognition.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(recognition.id)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              {recognition.likes}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              {recognition.comments}
                            </Button>
                            <div className="flex items-center space-x-1 text-yellow-600">
                              <Star className="w-4 h-4" />
                              <span className="font-semibold">{recognition.points_awarded} points</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{formatTimeAgo(recognition.created_at)}</span>
                        </div>

                        {/* Comments Section */}
                        {comments[recognition.id] && comments[recognition.id].length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="space-y-3">
                              {comments[recognition.id].map((comment) => (
                                <div key={comment.id} className="flex items-start space-x-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.user_name}`} />
                                    <AvatarFallback>{comment.user_name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-sm">{comment.user_name}</span>
                                        <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                                      </div>
                                      <p className="text-sm text-gray-700">{comment.message}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add Comment */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || user?.email}`} />
                              <AvatarFallback>{(user?.displayName || user?.email || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex space-x-2">
                              <Input
                                placeholder="Add a comment..."
                                value={newComment[recognition.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [recognition.id]: e.target.value }))}
                                onKeyPress={(e) => e.key === 'Enter' && handleComment(recognition.id)}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleComment(recognition.id)}
                                disabled={!newComment[recognition.id]?.trim()}
                              >
                                Post
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recognitionCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{category.points} pts</span>
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm">{category.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}