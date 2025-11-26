// Basis-Typen für das SmartLaw System

export interface User {
  id: string
  email: string
  userType: 'tenant' | 'landlord' | 'business'
  profile: UserProfile
  preferences: UserPreferences
  createdAt: Date
  lastLoginAt: Date
  isVerified: boolean
}

export interface UserProfile {
  firstName?: string
  lastName?: string
  location?: string
  language: string
  accessibilityNeeds?: AccessibilitySettings
}

export interface UserPreferences {
  notifications: NotificationSettings
  privacy: PrivacySettings
  language: string
}

export interface AccessibilitySettings {
  screenReader: boolean
  highContrast: boolean
  largeText: boolean
  keyboardNavigation: boolean
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
}

export interface PrivacySettings {
  dataSharing: boolean
  analytics: boolean
  marketing: boolean
}

// Rechtliche Entitäten
export interface Case {
  id: string
  userId: string
  title: string
  category: LegalCategory
  status: 'open' | 'resolved' | 'escalated'
  priority: 'low' | 'medium' | 'high'
  messages: Message[]
  documents: Document[]
  legalReferences: LegalReference[]
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  caseId: string
  sender: 'user' | 'ai' | 'lawyer'
  content: string
  timestamp: Date
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  confidence?: number
  legalReferences?: LegalReference[]
  suggestedActions?: Action[]
  escalationRecommended?: boolean
}

export interface Document {
  id: string
  caseId: string
  filename: string
  type: DocumentType
  size: number
  uploadedAt: Date
  analysis?: DocumentAnalysis
}

export type DocumentType = 'rental_contract' | 'utility_bill' | 'warning_letter' | 'other'

export interface DocumentAnalysis {
  documentId: string
  documentType: DocumentType
  extractedData: Record<string, any>
  issues: Issue[]
  recommendations: Recommendation[]
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
}

export interface Issue {
  type: string
  severity: 'info' | 'warning' | 'critical'
  description: string
  legalBasis?: string
  suggestedAction?: string
}

export interface Recommendation {
  type: string
  description: string
  priority: 'low' | 'medium' | 'high'
  actionRequired: boolean
}

export interface LegalReference {
  type: 'law' | 'court_decision' | 'regulation'
  reference: string
  title: string
  relevantSection?: string
  url?: string
}

export interface Action {
  type: string
  description: string
  deadline?: Date
  completed: boolean
}

export type LegalCategory = 
  | 'rent_reduction'
  | 'termination'
  | 'rent_increase'
  | 'utility_costs'
  | 'repairs'
  | 'deposit'
  | 'modernization'
  | 'other'

// Anwaltsvermittlung
export interface Lawyer {
  id: string
  name: string
  specializations: string[]
  location: string
  rating: number
  reviewCount: number
  hourlyRate?: number
  availableSlots: TimeSlot[]
  languages: string[]
  verified: boolean
}

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

export interface Booking {
  id: string
  lawyerId: string
  userId: string
  timeSlot: TimeSlot
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  meetingType: 'video' | 'phone' | 'in_person'
  notes?: string
}

// API Response-Typen
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: Date
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

// KI-spezifische Typen
export interface AIResponse {
  message: string
  confidence: number
  legalReferences: LegalReference[]
  suggestedActions: Action[]
  escalationRecommended: boolean
  templates?: TemplateReference[]
}

export interface TemplateReference {
  id: string
  name: string
  type: string
  description: string
}

// Mietspiegel und lokale Daten
export interface MietspiegelData {
  city: string
  year: number
  averageRent: number
  rentRanges: RentRange[]
  specialRegulations: string[]
  lastUpdated: Date
}

export interface RentRange {
  minRent: number
  maxRent: number
  category: string
  conditions: string[]
}