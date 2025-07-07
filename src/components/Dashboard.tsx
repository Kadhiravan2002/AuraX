
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useHealthAlerts } from '@/hooks/useHealthAlerts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, Activity, Brain, Crown, Upload, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import HealthChart from './HealthChart';
import HealthScore from './HealthScore';
import MLSuggestions from './MLSuggestions';
import HealthAlerts from './HealthAlerts';
import HealthAlertsStatus from './HealthAlertsStatus';
import NewUserWelcome from './NewUserWelcome';

interface DashboardProps {
  onStartCSVUpload: () => void;
  onStartManualEntry: () => void;
  userName: string;
  refreshTrigger: number;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onStartCSVUpload, 
  onStartManualEntry, 
  userName,
  refreshTrigger 
}) => {
  const { user } = useAuth();
  const { checkFeatureAccess } = usePremiumFeatures();
  const { alerts, loading: alertsLoading } = useHealthAlerts();
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHealthData, setHasHealthData] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchHealthData = async () => {
    if (!user) return;

    try {
      console.log('Fetching health data for user:', user.id);
      
      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching health data:', error);
        toast({
          title: "Error loading health data",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Fetched health data:', data);
      setHealthData(data || []);
      setHasHealthData((data || []).length > 0);
    } catch (error) {
      console.error('Error in fetchHealthData:', error);
      toast({
        title: "Error",
        description: "Failed to load health data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerHealthAnalysis = async () => {
    setIsTriggering(true);
    try {
      console.log('Triggering health alerts analysis...');
      
      const { data, error } = await supabase.functions.invoke('trigger-health-alerts');
      
      if (error) {
        console.error('Error triggering health analysis:', error);
        toast({
          title: "Error triggering analysis",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Health analysis triggered successfully:', data);
      toast({
        title: "Analysis triggered",
        description: "Health alerts analysis has been triggered successfully.",
      });
    } catch (error) {
      console.error('Error in triggerHealthAnalysis:', error);
      toast({
        title: "Error",
        description: "Failed to trigger health analysis",
        variant: "destructive"
      });
    } finally {
      setIsTriggering(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHealthData();
    }
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasHealthData) {
    return (
      <NewUserWelcome 
        userName={userName}
        onStartCSVUpload={onStartCSVUpload}
        onStartManualEntry={onStartManualEntry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {userName}! 👋</h2>
        <p className="text-cyan-100">
          Here's your personalized health dashboard with insights from your recent data.
        </p>
      </div>

      {/* Health Alerts */}
      {!alertsLoading && alerts.length > 0 && (
        <HealthAlerts />
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData.length}</div>
            <p className="text-xs text-muted-foreground">
              Health data entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.filter(d => d.date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Entries in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <HealthScore healthData={healthData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Active</div>
            <p className="text-xs text-muted-foreground">
              {checkFeatureAccess('aiSuggestions') ? 'Premium insights enabled' : 'Basic insights'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <HealthChart data={healthData} />
          {checkFeatureAccess('aiSuggestions') && (
            <MLSuggestions healthData={healthData} />
          )}
        </div>
        
        <div className="space-y-6">
          <HealthAlertsStatus />
          
          {/* Manual Analysis Trigger */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" />
                Manual Analysis
              </CardTitle>
              <CardDescription>
                Trigger health alerts analysis manually to check for patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={triggerHealthAnalysis}
                disabled={isTriggering}
                className="w-full"
              >
                {isTriggering ? 'Analyzing...' : 'Run Health Analysis Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Add more health data to get better insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={onStartManualEntry} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Log Health Data
          </Button>
          <Button 
            onClick={onStartCSVUpload} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={!checkFeatureAccess('csvUpload')}
          >
            <Upload className="w-4 h-4" />
            CSV Upload
            {!checkFeatureAccess('csvUpload') && (
              <Crown className="w-3 h-3 ml-1 text-amber-500" />
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
