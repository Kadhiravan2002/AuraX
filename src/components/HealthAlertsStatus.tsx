
import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const HealthAlertsStatus = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Health Alerts Automation
        </CardTitle>
        <CardDescription>
          Automated daily health pattern analysis and email notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Daily Analysis</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Active
          </Badge>
        </div>
        
        <div className="text-sm text-gray-600 space-y-2">
          <p>• Runs daily at 8:00 AM UTC</p>
          <p>• Analyzes sleep and stress patterns</p>
          <p>• Sends email notifications for health concerns</p>
          <p>• Monitors 7-day rolling health data</p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Alert Triggers:</p>
            <p>• Sleep deficiency: Less than 5 hours for 3+ consecutive days</p>
            <p>• High stress: Stress level above 6 for 4+ days in a week</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthAlertsStatus;
