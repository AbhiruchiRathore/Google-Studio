export type TabType = 
  | 'matrimony' 
  | 'directory' 
  | 'booklet' 
  | 'events' 
  | 'signup' 
  | 'create-profile' 
  | 'advertise-shop'
  | 'family-details';

export type GenderType = 'all' | 'Male' | 'Female';

export interface MatrimonyProfile {
  id: number | string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  gotra: string;
  city: string;
  state?: string;
  education: string;
  profession: string;
  income?: string;
  height?: string;
  dob?: string;
  birthTime?: string;
  familyDetails?: string;
  photo?: string;
  verified?: boolean;
  contact: string;
  phone?: string;
  about?: string;
  native?: string;
  location?: string;
  createdAt?: string;
}

export interface BusinessAd {
  id: number | string;
  title: string;
  owner: string;
  category: string;
  city?: string;
  address: string;
  phone: string;
  tagline?: string;
  offer?: string;
  rating?: string;
  isFeatured?: boolean;
  banner?: string;
  description?: string;
  createdAt?: string;
}

export interface SamajEvent {
  id?: number | string;
  title: string;
  date: string;
  time?: string;
  location: string;
  venue?: string;
  organizedBy?: string;
  description: string;
  link?: string;
  badge?: string;
}

export interface AuthSession {
  method: 'Google' | 'Phone';
  name?: string;
  email?: string;
  photoUrl?: string;
  phone?: string;
  loggedInAt: string;
  verified?: boolean;
}
