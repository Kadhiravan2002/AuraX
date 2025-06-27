
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { shouldGrantPremiumAccess } from '@/utils/premiumWhitelist';

export const usePremiumFeatures = () => {
  const { subscription } = useSubscription();
  const { user } = useAuth();
  
  // Check if user has premium access via subscription OR whitelist
  const hasWhitelistAccess = user?.email ? shouldGrantPremiumAccess(user.email) : false;
  const hasSubscriptionAccess = subscription?.payment_status === 'active' && subscription?.plan !== 'free';
  const hasMetadataAccess = user?.user_metadata?.isPremium === true;
  
  const isPremium = hasWhitelistAccess || hasSubscriptionAccess || hasMetadataAccess;
  const plan = subscription?.plan || 'free';
  
  // Feature access based on plan or whitelist
  const features = {
    // Free plan features
    basicDashboard: true,
    sevenDayHistory: true,
    basicMoodPrediction: true,
    communitySupport: true,
    
    // Quarterly plan and above (or whitelist access)
    fullDashboard: isPremium,
    thirtyDayHistory: isPremium,
    advancedAnalytics: isPremium,
    csvExport: isPremium,
    prioritySupport: isPremium,
    customGoals: isPremium,
    
    // Half-yearly plan and above (or whitelist access)
    professionalReports: isPremium && (['halfyearly', 'annual'].includes(plan) || hasWhitelistAccess),
    weeklyEmailSummaries: isPremium && (['halfyearly', 'annual'].includes(plan) || hasWhitelistAccess),
    advancedTrendAnalysis: isPremium && (['halfyearly', 'annual'].includes(plan) || hasWhitelistAccess),
    healthRecommendations: isPremium && (['halfyearly', 'annual'].includes(plan) || hasWhitelistAccess),
    fitnessAppIntegration: isPremium && (['halfyearly', 'annual'].includes(plan) || hasWhitelistAccess),
    
    // Annual plan only (or whitelist access)
    aiHealthPlanner: (plan === 'annual') || hasWhitelistAccess,
    streakBadges: (plan === 'annual') || hasWhitelistAccess,
    phoneSupport: (plan === 'annual') || hasWhitelistAccess,
    chatAssistance: (plan === 'annual') || hasWhitelistAccess,
    earlyAccess: (plan === 'annual') || hasWhitelistAccess,
    
    // CSV upload feature (premium only)
    csvUpload: isPremium
  };
  
  const checkFeatureAccess = (feature: keyof typeof features) => {
    return features[feature];
  };
  
  const getUpgradeMessage = (feature: keyof typeof features) => {
    if (features[feature]) return null;
    
    // Don't show upgrade message for whitelisted users
    if (hasWhitelistAccess) return null;
    
    if (['csvUpload', 'fullDashboard', 'thirtyDayHistory', 'advancedAnalytics'].includes(feature)) {
      return 'Upgrade to Quarterly plan or higher to access this feature';
    }
    
    if (['professionalReports', 'weeklyEmailSummaries'].includes(feature)) {
      return 'Upgrade to Half-Yearly plan or higher to access this feature';
    }
    
    if (['aiHealthPlanner', 'streakBadges'].includes(feature)) {
      return 'Upgrade to Annual plan to access this feature';
    }
    
    return 'Upgrade your plan to access this feature';
  };
  
  const getPremiumAccessType = () => {
    if (hasWhitelistAccess) return 'whitelist';
    if (hasMetadataAccess) return 'metadata';
    if (hasSubscriptionAccess) return 'subscription';
    return null;
  };
  
  return {
    isPremium,
    plan,
    features,
    checkFeatureAccess,
    getUpgradeMessage,
    hasWhitelistAccess,
    getPremiumAccessType
  };
};
