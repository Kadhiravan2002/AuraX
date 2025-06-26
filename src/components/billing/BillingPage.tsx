
import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PricingCard from './PricingCard';
import { Calendar, CreditCard, Settings } from 'lucide-react';

const BillingPage = () => {
  const { subscription, loading, createCheckoutSession, createCustomerPortalSession } = useSubscription();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const plans = [
    {
      id: 'free',
      title: 'Free Plan',
      price: '0',
      period: 'forever',
      description: 'Perfect for getting started with basic health tracking',
      features: [
        'Limited features access',
        '7-day health history',
        'Basic mood prediction',
        'Simple dashboard view',
        'Community support'
      ]
    },
    {
      id: 'quarterly',
      title: 'Quarterly Plan',
      price: '199',
      period: '3 months',
      description: 'Enhanced tracking with extended history and exports',
      features: [
        'Full dashboard access',
        '30-day health history',
        'Advanced mood analytics',
        'CSV data export',
        'Priority email support',
        'Custom health goals'
      ]
    },
    {
      id: 'halfyearly',
      title: 'Half-Yearly Plan',
      price: '349',
      period: '6 months',
      description: 'Complete health insights with professional reports',
      features: [
        'Everything in Quarterly',
        'Professional PDF reports',
        'Weekly email summaries',
        'Advanced trend analysis',
        'Health recommendations',
        'Integration with fitness apps'
      ]
    },
    {
      id: 'annual',
      title: 'Annual Plan',
      price: '599',
      period: 'year',
      description: 'Ultimate health companion with AI-powered features',
      features: [
        'Everything in Half-Yearly',
        'AI-powered health planner',
        'Streak badges & achievements',
        'Priority phone support',
        '24/7 chat assistance',
        'Early access to new features'
      ],
      isPopular: true
    }
  ];

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'free') return;
    
    setCheckoutLoading(planId);
    try {
      const url = await createCheckoutSession(planId);
      window.open(url, '_blank');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive'
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const url = await createCustomerPortalSession();
      window.open(url, '_blank');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to open customer portal',
        variant: 'destructive'
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-300';
      case 'expired': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your <span className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">AuraX</span> Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock powerful health insights and take control of your wellness journey with our premium features
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription && subscription.plan !== 'free' && (
          <Card className="mb-8 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg capitalize">{subscription.plan} Plan</p>
                  <p className="text-gray-600">Started on {formatDate(subscription.start_date)}</p>
                </div>
                <Badge variant="secondary" className={getStatusColor(subscription.payment_status)}>
                  {subscription.payment_status.charAt(0).toUpperCase() + subscription.payment_status.slice(1)}
                </Badge>
              </div>
              
              {subscription.end_date && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Renews on {formatDate(subscription.end_date)}</span>
                </div>
              )}
              
              <Separator />
              
              <Button 
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                {portalLoading ? 'Loading...' : 'Manage Subscription'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={plan.features}
              isPopular={plan.isPopular}
              isCurrentPlan={subscription?.plan === plan.id && subscription?.payment_status === 'active'}
              onSelect={() => handlePlanSelect(plan.id)}
              loading={checkoutLoading === plan.id}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I change my plan anytime?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated automatically.</p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">Is my data secure?</h3>
              <p className="text-gray-600">Absolutely! We use enterprise-grade encryption and follow strict privacy standards to protect your health data.</p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, debit cards, UPI, and net banking through our secure payment partner Stripe.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingPage;
