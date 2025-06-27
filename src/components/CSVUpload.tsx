
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CSVUploadSteps from './csv/CSVUploadSteps';

const CSVUpload = () => {
  const { checkFeatureAccess, getUpgradeMessage } = usePremiumFeatures();
  const navigate = useNavigate();

  const hasCSVAccess = checkFeatureAccess('csvUpload');

  if (!hasCSVAccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Premium Feature Required
          </CardTitle>
          <CardDescription>
            {getUpgradeMessage('csvUpload')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/billing')} className="w-full">
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <CSVUploadSteps />;
};

export default CSVUpload;
