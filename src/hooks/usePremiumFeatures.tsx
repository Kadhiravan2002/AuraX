
import { useSubscription } from '@/hooks/useSubscription';

export const usePremiumFeatures = () => {
  const { subscription } = useSubscription();
  
  const isPremium = subscription?.payment_status === 'active' && subscription?.plan !== 'free';
  const plan = subscription?.plan || 'free';
  
  // Feature access based on plan
  const features = {
    // Free plan features
    basicDashboard: true,
    sevenDayHistory: true,
    basicMoodPrediction: true,
    communitySupport: true,
    
    // Quarterly plan and above
    fullDashboard: isPremium,
    thirtyDayHistory: isPremium,
    advancedAnalytics: isPremium,
    csvExport: isPremium,
    prioritySupport: isPremium,
    customGoals: isPremium,
    
    // Half-yearly plan and above
    professionalReports: ['halfyearly', 'annual'].includes(plan),
    weeklyEmailSummaries: ['halfyearly', 'annual'].includes(plan),
    advancedTrendAnalysis: ['halfyearly', 'annual'].includes(plan),
    healthRecommendations: ['halfyearly', 'annual'].includes(plan),
    fitnessAppIntegration: ['halfyearly', 'annual'].includes(plan),
    
    // Annual plan only
    aiHealthPlanner: plan === 'annual',
    streakBadges: plan === 'annual',
    phoneSupport: plan === 'annual',
    chatAssistance: plan === 'annual',
    earlyAccess: plan === 'annual',
    
    // CSV upload feature (premium only)
    csvUpload: isPremium
  };
  
  const checkFeatureAccess = (feature: keyof typeof features) => {
    return features[feature];
  };
  
  const getUpgradeMessage = (feature: keyof typeof features) => {
    if (features[feature]) return null;
    
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
  
  return {
    isPremium,
    plan,
    features,
    checkFeatureAccess,
    getUpgradeMessage
  };
};
