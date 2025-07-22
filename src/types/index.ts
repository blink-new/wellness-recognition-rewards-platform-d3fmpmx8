export interface User {
  id: string
  email: string
  displayName: string
  department?: string
  role?: string
  points: number
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Recognition {
  id: string
  giverId: string
  receiverId: string
  category: 'time_off_honesty' | 'work_life_balance' | 'colleague_support' | 'health_activity' | 'benefits_usage'
  message: string
  pointsAwarded: number
  createdAt: string
  giver?: User
  receiver?: User
}

export interface DailyCheckin {
  id: string
  userId: string
  wellnessScore: number
  symptoms?: string[]
  mood: 'great' | 'good' | 'okay' | 'poor' | 'terrible'
  notes?: string
  createdAt: string
}

export interface WellnessService {
  id: string
  name: string
  description?: string
  category: 'doctor' | 'checkup' | 'vaccination' | 'mental_health' | 'fitness'
  provider?: string
  durationMinutes?: number
  pointsReward: number
  createdAt: string
}

export interface Appointment {
  id: string
  userId: string
  serviceId: string
  appointmentDate: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  createdAt: string
  service?: WellnessService
}

export interface Reward {
  id: string
  name: string
  description?: string
  category: 'airtime' | 'electricity' | 'groceries'
  pointsCost: number
  imageUrl?: string
  availableQuantity: number
  createdAt: string
}

export interface RewardRedemption {
  id: string
  userId: string
  rewardId: string
  pointsSpent: number
  status: 'pending' | 'fulfilled' | 'cancelled'
  redemptionCode?: string
  createdAt: string
  reward?: Reward
}