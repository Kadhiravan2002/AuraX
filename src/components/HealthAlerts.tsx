
import { AlertTriangle, X, Moon, Brain, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useHealthAlerts } from '@/hooks/useHealthAlerts';

const HealthAlerts = () => {
  const { alerts, loading, dismissAlert } = useHealthAlerts();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'sleep_deficiency':
        return <Moon className="h-4 w-4" />;
      case 'high_stress':
        return <Brain className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'sleep_deficiency':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'high_stress':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      default:
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    }
  };

  // Show fallback message if no alerts
  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center text-green-700">
            <CheckCircle className="h-5 w-5 mr-3" />
            <div>
              <h3 className="font-medium">No current health warnings</h3>
              <p className="text-sm text-green-600 mt-1">
                Your recent health patterns look good! Keep up the great work.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
        Health Alerts
      </h3>
      
      {alerts.map((alert) => (
        <Alert key={alert.id} className={`${getAlertColor(alert.alert_type)} relative`}>
          <div className="flex items-start">
            {getAlertIcon(alert.alert_type)}
            <div className="ml-3 flex-1">
              <AlertTitle className="text-sm font-medium">
                {alert.alert_type === 'sleep_deficiency' ? 'Sleep Alert' : 'Stress Alert'}
              </AlertTitle>
              <AlertDescription className="mt-1 text-sm">
                {alert.alert_message}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAlert(alert.id)}
              className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-white/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default HealthAlerts;
