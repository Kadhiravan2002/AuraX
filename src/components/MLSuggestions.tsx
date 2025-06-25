
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

interface MLSuggestionsProps {
  data: HealthData;
}

const MLSuggestions = ({ data }: MLSuggestionsProps) => {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Health Suggestions</CardTitle>
          <CardDescription>Log your health data to get personalized recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            📊 No data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const generateSuggestions = (data: HealthData) => {
    const suggestions = [];

    // Sleep suggestions
    if (data.sleep < 7) {
      suggestions.push({
        type: 'sleep',
        icon: '😴',
        title: 'Improve Sleep Quality',
        message: `You slept ${data.sleep} hours. Aim for 7-9 hours for optimal health and better energy levels.`,
        priority: 'high',
        color: 'border-blue-200 bg-blue-50'
      });
    } else if (data.sleep > 9) {
      suggestions.push({
        type: 'sleep',
        icon: '⏰',
        title: 'Sleep Duration',
        message: 'You may be oversleeping. Try maintaining 7-9 hours for better sleep quality.',
        priority: 'medium',
        color: 'border-yellow-200 bg-yellow-50'
      });
    }

    // Water suggestions
    if (data.water < 2) {
      suggestions.push({
        type: 'water',
        icon: '💧',
        title: 'Stay Hydrated',
        message: `You drank ${data.water}L today. Try to reach 2-3 liters for better hydration and health.`,
        priority: 'high',
        color: 'border-cyan-200 bg-cyan-50'
      });
    }

    // Activity suggestions
    if (data.steps < 8000) {
      suggestions.push({
        type: 'activity',
        icon: '👟',
        title: 'Increase Activity',
        message: `You walked ${data.steps.toLocaleString()} steps. Try to reach 8,000-10,000 steps daily for better cardiovascular health.`,
        priority: 'medium',
        color: 'border-green-200 bg-green-50'
      });
    }

    // Stress suggestions
    if (data.stress >= 4) {
      suggestions.push({
        type: 'stress',
        icon: '🧘',
        title: 'Manage Stress',
        message: 'Your stress level is high. Try deep breathing, meditation, or a 10-minute walk to relax.',
        priority: 'high',
        color: 'border-purple-200 bg-purple-50'
      });
    }

    // Mood-based suggestions
    if (data.mood === 'Tired' || data.mood === 'Sad') {
      suggestions.push({
        type: 'mood',
        icon: '☀️',
        title: 'Boost Your Mood',
        message: 'Consider some light exercise, listening to music, or spending time outdoors to lift your spirits.',
        priority: 'medium',
        color: 'border-orange-200 bg-orange-50'
      });
    }

    // Calorie suggestions
    if (data.calories < 1500) {
      suggestions.push({
        type: 'nutrition',
        icon: '🍎',
        title: 'Adequate Nutrition',
        message: 'Your calorie intake seems low. Ensure you\'re eating enough nutritious food to fuel your body.',
        priority: 'high',
        color: 'border-red-200 bg-red-50'
      });
    } else if (data.calories > 2500) {
      suggestions.push({
        type: 'nutrition',
        icon: '🥗',
        title: 'Mindful Eating',
        message: 'Consider portion control and choosing nutrient-dense foods over high-calorie options.',
        priority: 'medium',
        color: 'border-yellow-200 bg-yellow-50'
      });
    }

    // If everything is good
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'positive',
        icon: '🌟',
        title: 'Great Job!',
        message: 'Your health metrics look excellent today! Keep up the great work maintaining your healthy lifestyle.',
        priority: 'positive',
        color: 'border-green-200 bg-green-50'
      });
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  const suggestions = generateSuggestions(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI Health Suggestions</CardTitle>
        <CardDescription>Personalized recommendations based on your data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${suggestion.color} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-lg">{suggestion.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {suggestion.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-2">
            <div className="text-sm">🤖</div>
            <div className="text-xs text-gray-600">
              <strong>AI Insight:</strong> These suggestions are generated based on established health guidelines and your personal data patterns.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MLSuggestions;
