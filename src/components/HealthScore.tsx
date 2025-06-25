
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HealthData {
  date: string;
  sleep: number;
  water: number;
  steps: number;
  calories: number;
  stress: number;
  mood: string;
}

interface HealthScoreProps {
  data: HealthData;
}

const HealthScore = ({ data }: HealthScoreProps) => {
  if (!data) {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold">No Data Available</h3>
            <p className="text-blue-100">Log your first health entry to see your score!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculateHealthScore = (data: HealthData): number => {
    let score = 0;
    
    // Sleep score (25 points) - optimal range 7-9 hours
    if (data.sleep >= 7 && data.sleep <= 9) {
      score += 25;
    } else if (data.sleep >= 6 && data.sleep <= 10) {
      score += 20;
    } else if (data.sleep >= 5 && data.sleep <= 11) {
      score += 15;
    } else {
      score += 10;
    }

    // Water score (20 points) - optimal 2-3 liters
    if (data.water >= 2 && data.water <= 3) {
      score += 20;
    } else if (data.water >= 1.5 && data.water <= 3.5) {
      score += 15;
    } else if (data.water >= 1 && data.water <= 4) {
      score += 10;
    } else {
      score += 5;
    }

    // Steps score (25 points) - optimal 8000+ steps
    if (data.steps >= 10000) {
      score += 25;
    } else if (data.steps >= 8000) {
      score += 20;
    } else if (data.steps >= 6000) {
      score += 15;
    } else if (data.steps >= 4000) {
      score += 10;
    } else {
      score += 5;
    }

    // Stress score (15 points) - lower is better
    if (data.stress <= 2) {
      score += 15;
    } else if (data.stress === 3) {
      score += 10;
    } else if (data.stress === 4) {
      score += 5;
    } else {
      score += 0;
    }

    // Mood score (15 points)
    if (data.mood === 'Happy' || data.mood === 'Energetic') {
      score += 15;
    } else if (data.mood === 'Normal') {
      score += 10;
    } else {
      score += 5;
    }

    return Math.min(score, 100);
  };

  const score = calculateHealthScore(data);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <Card className={`bg-gradient-to-r ${getScoreColor(score)} text-white shadow-lg`}>
      <CardHeader>
        <CardTitle className="text-xl">Today's Health Score</CardTitle>
        <CardDescription className="text-white/80">
          Based on your latest health metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold">{score}/100</div>
            <div className="text-lg font-medium text-white/90">{getScoreText(score)}</div>
          </div>
          <div className="text-right">
            <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center bg-white/10">
              <div className="text-2xl">
                {score >= 80 ? '🌟' : score >= 60 ? '👍' : score >= 40 ? '⚠️' : '📈'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 text-xs">
          <div className="bg-white/10 rounded p-2 text-center">
            <div className="font-medium">Sleep</div>
            <div>{data.sleep}h</div>
          </div>
          <div className="bg-white/10 rounded p-2 text-center">
            <div className="font-medium">Water</div>
            <div>{data.water}L</div>
          </div>
          <div className="bg-white/10 rounded p-2 text-center">
            <div className="font-medium">Steps</div>
            <div>{data.steps.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 rounded p-2 text-center">
            <div className="font-medium">Stress</div>
            <div>{data.stress}/5</div>
          </div>
          <div className="bg-white/10 rounded p-2 text-center">
            <div className="font-medium">Mood</div>
            <div>{data.mood}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthScore;
