export type TabType = 
  | 'matrimony' 
  | 'directory' 
  | 'kundali'
  | 'guest-list'
  | 'booklet' 
  | 'events' 
  | 'signup' 
  | 'dashboard'
  | 'create-profile' 
  | 'advertise-shop'
  | 'family-details'
  | 'admin';

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
  ownerId?: string;
  ownerName?: string;
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
  adTier?: 'standard' | 'featured' | 'spotlight';
  adPricePaid?: number;
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
  method: 'Google' | 'Phone' | 'Password' | 'UsernamePassword';
  name?: string;
  email?: string;
  photoUrl?: string;
  phone?: string;
  username?: string;
  loggedInAt: string;
  verified?: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  password: string;
  phone?: string;
  email?: string;
  gotra?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  profileId: number | string;
  sender: 'user' | 'candidate';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ProfileAdmirer {
  id: string | number;
  admirerProfileId?: number | string;
  admirerName: string;
  admirerGotra: string;
  admirerCity: string;
  admirerAge: number;
  admirerEducation: string;
  admirerProfession?: string;
  admirerPhoto?: string;
  admirerPhone: string;
  likedAt: string;
  message?: string;
}

export interface GuestItem {
  id: string;
  name: string;
  phone: string;
  address: string;
  city?: string;
  category?: 'Groom Side' | 'Bride Side' | 'Family/Relatives' | 'Friends' | 'Samaj Dignitaries' | 'Other';
  membersCount: number;
  status: 'Pending' | 'Card Sent' | 'Confirmed' | 'Declined';
  notes?: string;
  updatedAt?: string;
}

export interface GuestListOccasion {
  id: string;
  title: string;
  date?: string;
  venue?: string;
  description?: string;
  guests: GuestItem[];
  createdAt: string;
}

export interface UserSubscriptionStatus {
  active: boolean;
  plan: 'annual' | 'lifetime';
  pricePaid: number;
  activatedAt: string;
}

export interface AdminRuntimeConfig {
  // Monetization & Subscription Controls
  subscriptionEnabled: boolean;
  contactAccessMode: 'free' | 'limited_3_views' | 'subscription_required';
  annualPlanEnabled: boolean;
  annualPlanPrice: number;
  lifetimePlanEnabled: boolean;
  lifetimePlanPrice: number;

  // Shop Advertisement Monetization & Pricing
  adsMonetizationEnabled: boolean;
  featuredAdsEnabled: boolean;
  adBillingCycle: 'monthly' | 'quarterly' | 'yearly';
  standardAdPrice: number;
  featuredAdPrice: number;
  spotlightAdPrice: number;

  // All App Feature Toggles
  featureMatrimonyEnabled: boolean;
  featureChatEnabled: boolean;
  featureLikesEnabled: boolean;
  featureKundaliEnabled: boolean;
  kundaliAstrologerServiceEnabled: boolean;
  featureGuestListEnabled: boolean;
  featureBusinessDirectoryEnabled: boolean;
  featureBookletEnabled: boolean;
  allowGuestDownloads: boolean;
  featureEventsEnabled: boolean;
  allowUserEventPosting: boolean;
  featureProfileCreationEnabled: boolean;
  requireAdminVerification: boolean;
  featureWhatsAppShareEnabled: boolean;

  // Broadcast Banner
  bannerBroadcastMessage: string;
  isBroadcastActive: boolean;
}


