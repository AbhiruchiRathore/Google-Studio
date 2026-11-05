export type TabType = 
  | 'matrimony' 
  | 'directory' 
  | 'kundali'
  | 'booklet' 
  | 'events' 
  | 'signup' 
  | 'dashboard'
  | 'create-profile' 
  | 'advertise-shop'
  | 'family-details';

export type GenderType = 'all' | 'Male' | 'Female';

export type ProfileStatus = 'active' | 'draft' | 'archived';
export type VisibilitySetting = 'public' | 'verified_only' | 'private';

export interface UserMediaAsset {
  id: string;
  url: string;
  title: string;
  type: 'avatar' | 'cover' | 'gallery' | 'document';
  uploadedAt: string;
  size?: string;
}

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
  coverPhoto?: string;
  gallery?: string[];
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    website?: string;
  };
  visibility?: VisibilitySetting;
  status?: ProfileStatus;
  verified?: boolean;
  contact: string;
  phone?: string;
  about?: string;
  native?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
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
  status?: 'active' | 'draft' | 'paused';
  viewsCount?: number;
  inquiriesCount?: number;
  banner?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
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
