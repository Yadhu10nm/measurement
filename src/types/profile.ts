export interface UserProfile {
  id: string
  name: string
  heightCm: number
  weightKg?: number
  age?: number
  genderPreference: 'menswear' | 'womenswear' | 'unisex'
  createdAt: string
  updatedAt: string
}

export interface ProfileInput {
  name: string
  heightCm: number
  weightKg?: number
  age?: number
  genderPreference: 'menswear' | 'womenswear' | 'unisex'
}
