import React, { createContext, useContext, useState } from 'react';
import { AdminRuntimeConfig, UserSubscriptionStatus } from '../types';

export const DEFAULT_ADMIN_CONFIG: AdminRuntimeConfig = {
  // Monetization & Subscription
  subscriptionEnabled: false,
  contactAccessMode: 'limited_3_views',
  annualPlanEnabled: true,
  annualPlanPrice: 499,
  lifetimePlanEnabled: true,
  lifetimePlanPrice: 1499,

  // Shop Advertisement Monetization & Pricing
  adsMonetizationEnabled: false,
  featuredAdsEnabled: true,
  adBillingCycle: 'yearly',
  standardAdPrice: 199,
  featuredAdPrice: 500,
  spotlightAdPrice: 999,

  // All App Feature Flags (Enabled by default)
  featureMatrimonyEnabled: true,
  featureChatEnabled: true,
  featureLikesEnabled: true,
  featureKundaliEnabled: true,
  kundaliAstrologerServiceEnabled: true,
  featureGuestListEnabled: true,
  featureBusinessDirectoryEnabled: true,
  featureBookletEnabled: true,
  allowGuestDownloads: true,
  featureEventsEnabled: true,
  allowUserEventPosting: true,
  featureProfileCreationEnabled: true,
  requireAdminVerification: false,
  featureWhatsAppShareEnabled: true,

  // Broadcast Banner
  bannerBroadcastMessage:
    'Jai Mataji Ki! Welcome to Rathore Rishtey Portal. All community matrimonial biodatas are verified.',
  isBroadcastActive: true
};

const CONFIG_STORAGE_KEY = 'samaj_admin_config';
const USER_SUBSCRIPTION_KEY = 'samaj_user_subscription';

interface AdminConfigContextValue {
  config: AdminRuntimeConfig;
  updateConfig: (partial: Partial<AdminRuntimeConfig>) => void;
  resetConfig: () => void;
  userSubscription: UserSubscriptionStatus | null;
  activateUserSubscription: (plan: 'annual' | 'lifetime') => void;
  clearUserSubscription: () => void;
}

const AdminConfigContext = createContext<AdminConfigContextValue>({
  config: DEFAULT_ADMIN_CONFIG,
  updateConfig: () => {},
  resetConfig: () => {},
  userSubscription: null,
  activateUserSubscription: () => {},
  clearUserSubscription: () => {}
});

export const AdminConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AdminRuntimeConfig>(() => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_ADMIN_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load admin config:', e);
    }
    return DEFAULT_ADMIN_CONFIG;
  });

  const [userSubscription, setUserSubscription] = useState<UserSubscriptionStatus | null>(() => {
    try {
      const stored = localStorage.getItem(USER_SUBSCRIPTION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load user subscription:', e);
    }
    return null;
  });

  const updateConfig = (partial: Partial<AdminRuntimeConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save admin config:', e);
      }
      return updated;
    });
  };

  const resetConfig = () => {
    setConfig(DEFAULT_ADMIN_CONFIG);
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_CONFIG));
    } catch (e) {
      console.error('Failed to reset admin config:', e);
    }
  };

  const activateUserSubscription = (plan: 'annual' | 'lifetime') => {
    const status: UserSubscriptionStatus = {
      active: true,
      plan,
      pricePaid: plan === 'annual' ? config.annualPlanPrice : config.lifetimePlanPrice,
      activatedAt: new Date().toISOString()
    };
    setUserSubscription(status);
    try {
      localStorage.setItem(USER_SUBSCRIPTION_KEY, JSON.stringify(status));
    } catch (e) {
      console.error('Failed to save user subscription:', e);
    }
  };

  const clearUserSubscription = () => {
    setUserSubscription(null);
    try {
      localStorage.removeItem(USER_SUBSCRIPTION_KEY);
    } catch (e) {
      console.error('Failed to clear user subscription:', e);
    }
  };

  return (
    <AdminConfigContext.Provider
      value={{
        config,
        updateConfig,
        resetConfig,
        userSubscription,
        activateUserSubscription,
        clearUserSubscription
      }}
    >
      {children}
    </AdminConfigContext.Provider>
  );
};

export const useAdminConfig = () => useContext(AdminConfigContext);
