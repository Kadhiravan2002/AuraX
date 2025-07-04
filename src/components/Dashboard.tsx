import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import HealthChart from './HealthChart';
import HealthScore from './HealthScore';
import MLSuggestions from './MLSuggestions';
import NewUserWelcome from './NewUserWelcome';
import { toast } from '@/hooks/use-toast';

interface HealthData {
  date: string;
  sleep: number;
  water: number;
  steps: number;
  calories: number;
  stress: number;
  mood: string;
}

interface DashboardProps {
  onStartCSVUpload?: () => void;
  onStartManualEntry?: () => void;
  userName?: string;
  refreshTrigger?: number; // Add refresh trigger prop
}

const Dashboard = ({ onStartCSVUpload, onStartManualEntry, userName, refreshTrigger }: DashboardProps) => {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadHealthData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Loading health data for user:', user.id);
      
      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading health data:', error);
        toast({
          title: "Error loading health data",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Loaded health data:', data);

      // Transform the data to match the expected format
      const transformedData = data.map(item => ({
        date: item.date,
        sleep: item.sleep_hours || 0,
        water: item.water_intake || 0,
        steps: item.exercise_minutes ? item.exercise_minutes * 100 : 0, // Convert minutes to approximate steps
        calories: 2000, // Default calories since we don't have this field in DB
        stress: item.stress_level || 3,
        mood: item.mood ? getMoodText(item.mood) : 'Normal'
      }));

      console.log('Transformed health data:', transformedData);
      setHealthData(transformedData);
      setIsNewUser(transformedData.length === 0);
    } catch (error) {
      console.error('Error in loadHealthData:', error);
      toast({
        title: "Error",
        description: "Failed to load health data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMoodText = (moodValue: number): string => {
    const moodMap: { [key: number]: string } = {
      1: 'Sad',
      2: 'Tired',
      3: 'Normal',
      4: 'Happy',
      5: 'Energetic'
    };
    return moodMap[moodValue] || 'Normal';
  };

  useEffect(() => {
    if (user) {
      loadHealthData();
    }
  }, [user]);

  // Add effect to refresh data when refreshTrigger changes
  useEffect(() => {
    if (user && refreshTrigger) {
      console.log('Refreshing dashboard data due to trigger:', refreshTrigger);
      loadHealthData();
    }
  }, [refreshTrigger, user]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Show welcome screen for new users
  if (isNewUser && userName) {
    return (
      <NewUserWelcome
        userName={userName}
        onStartCSVUpload={onStartCSVUpload || (() => {})}
        onStartManualEntry={onStartManualEntry || (() => {})}
      />
    );
  }

  const filteredData = healthData.slice(timeRange === 'week' ? -7 : -30);
  const latestData = healthData[healthData.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="text-gray-600">Track your wellness journey with personalized insights</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Health Score */}
      <HealthScore data={latestData} />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                😴
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Sleep</p>
                <p className="text-lg font-bold text-blue-900">{latestData?.sleep || 0}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center mr-3">
                💧
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-700">Water</p>
                <p className="text-lg font-bold text-cyan-900">{latestData?.water || 0}L</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                👟
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Steps</p>
                <p className="text-lg font-bold text-green-900">{latestData?.steps?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                🍎
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">Calories</p>
                <p className="text-lg font-bold text-orange-900">{latestData?.calories || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Suggestions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <HealthChart data={filteredData} />
        </div>
        <div>
          <MLSuggestions data={latestData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
