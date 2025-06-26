
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  onSelect: () => void;
  loading?: boolean;
}

const PricingCard = ({
  title,
  price,
  period,
  description,
  features,
  isPopular = false,
  isCurrentPlan = false,
  onSelect,
  loading = false
}: PricingCardProps) => {
  return (
    <Card className={`relative h-full transition-all duration-300 hover:shadow-lg ${
      isPopular ? 'border-2 border-gradient-to-r from-cyan-500 to-purple-600 shadow-lg scale-105' : ''
    } ${isCurrentPlan ? 'border-green-500 bg-green-50' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-3 py-1 text-sm font-medium">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-3">
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold text-gray-900">₹{price}</span>
          <span className="text-gray-600 ml-1">/{period}</span>
        </div>
        <CardDescription className="text-gray-600 mt-2">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button 
          onClick={onSelect}
          disabled={loading || isCurrentPlan}
          className={`w-full py-3 font-medium transition-colors ${
            isPopular 
              ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white' 
              : isCurrentPlan
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {loading ? 'Processing...' : isCurrentPlan ? 'Current Plan' : 'Get Started'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingCard;
