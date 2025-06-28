
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import HealthChart from './HealthChart';
import HealthScore from './HealthScore';
import MLSuggestions from './MLSuggestions';
import NewUserWelcome from './NewUserWelcome';

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
}

const Dashboard = ({ onStartCSVUpload, onStartManualEntry, userName }: DashboardProps) => {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [isNewUser, setIsNewUser] = useState(false);

  const loadHealthData = () => {
    // Load existing data from localStorage
    const savedData = localStorage.getItem('healthData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setHealthData(parsedData);
      setIsNewUser(parsedData.length === 0);
    } else {
      // Don't generate sample data for new users
      setHealthData([]);
      setIsNewUser(true);
    }
  };

  const generateSampleData = (): HealthData[] => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        sleep: Math.floor(Math.random() * 4) + 5, // 5-9 hours
        water: Math.floor(Math.random() * 2) + 1.5, // 1.5-3.5 liters
        steps: Math.floor(Math.random() * 5000) + 5000, // 5000-10000 steps
        calories: Math.floor(Math.random() * 800) + 1500, // 1500-2300 calories
        stress: Math.floor(Math.random() * 5) + 1, // 1-5
        mood: ['Happy', 'Normal', 'Tired', 'Energetic'][Math.floor(Math.random() * 4)]
      });
    }
    return data;
  };

  useEffect(() => {
    loadHealthData();

    // Listen for storage changes (when CSV data is uploaded)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'healthData' && e.newValue) {
        const newData = JSON.parse(e.newValue);
        setHealthData(newData);
        setIsNewUser(newData.length === 0);
      }
    };

    // Listen for custom events (for same-tab updates)
    const handleDataUpdate = () => {
      loadHealthData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('healthDataUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('healthDataUpdated', handleDataUpdate);
    };
  }, []);

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
