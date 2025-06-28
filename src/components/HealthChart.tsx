
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface HealthData {
  date: string;
  sleep: number;
  water: number;
  steps: number;
  calories: number;
  stress: number;
  mood: string;
}

interface HealthChartProps {
  data: HealthData[];
}

const HealthChart = ({ data }: HealthChartProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = data.map(item => ({
    ...item,
    date: formatDate(item.date),
    stepsK: Math.round(item.steps / 1000 * 10) / 10, // Convert to thousands
    caloriesK: Math.round(item.calories / 100) / 10, // Convert to hundreds for better scaling
  }));

  return (
    <div className="space-y-6">
      {/* Sleep vs Mood Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sleep & Activity Trends</CardTitle>
          <CardDescription>Your daily sleep hours and step count over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sleep" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Sleep (hours)"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="stepsK" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Steps (K)"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Water & Stress Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wellness Indicators</CardTitle>
          <CardDescription>Daily water intake and stress levels</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="water" 
                fill="#06B6D4" 
                name="Water (L)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="stress" 
                fill="#F59E0B" 
                name="Stress Level"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthChart;
