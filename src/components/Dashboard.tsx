
import { useHealthData } from '@/hooks/useHealthData';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import HealthScore from './HealthScore';
import HealthChart from './HealthChart';
import MLSuggestions from './MLSuggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Activity, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { healthData, loading, refreshData } = useHealthData();
  const { checkFeatureAccess } = usePremiumFeatures();
  const hasFullDashboard = checkFeatureAccess('fullDashboard');

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Transform data for chart components
  const transformedData = healthData.map(entry => ({
    date: entry.date,
    sleep: entry.sleep_hours || 0,
    water: entry.water_intake || 0,
    steps: entry.exercise_minutes ? entry.exercise_minutes * 100 : 0, // Estimate steps from exercise minutes
    calories: entry.exercise_minutes ? entry.exercise_minutes * 8 : 1800, // Estimate calories
    stress: entry.stress_level || 1,
    mood: entry.mood >= 8 ? 'Happy' : entry.mood >= 6 ? 'Normal' : entry.mood >= 4 ? 'Okay' : 'Tired'
  }));

  // Get the latest entry for the health score
  const latestEntry = transformedData[0];

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {hasFullDashboard ? 'Complete Health Dashboard' : 'Basic Health Overview'}
          </h2>
          <p className="text-gray-600">
            {healthData.length > 0 
              ? `${healthData.length} health entries tracked`
              : 'No health data yet - start logging or upload CSV data'
            }
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {healthData.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Welcome to AuraX
            </CardTitle>
            <CardDescription>
              Start tracking your health journey by logging data or uploading a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <Card className="p-4 border-dashed border-2 hover:border-blue-300 transition-colors">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-medium mb-1">Manual Entry</h3>
                  <p className="text-sm text-gray-600">Log your daily health metrics</p>
                </Card>
                <Card className="p-4 border-dashed border-2 hover:border-green-300 transition-colors">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h3 className="font-medium mb-1">CSV Upload</h3>
                  <p className="text-sm text-gray-600">Import your existing data</p>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Health Score Overview */}
          {latestEntry && <HealthScore data={latestEntry} />}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HealthChart data={transformedData} />
            {hasFullDashboard && latestEntry && <MLSuggestions data={latestEntry} />}
          </div>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
              <CardDescription>Your latest health data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthData.slice(0, hasFullDashboard ? 10 : 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{new Date(entry.date).toLocaleDateString()}</p>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Mood: {entry.mood || 0}/10</span>
                        <span>Energy: {entry.energy || 0}/10</span>
                        <span>Sleep: {entry.sleep_hours || 0}h</span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <div>Exercise: {entry.exercise_minutes || 0}min</div>
                      <div>Water: {entry.water_intake || 0} glasses</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
