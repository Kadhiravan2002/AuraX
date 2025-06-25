
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const HealthLogForm = () => {
  const [formData, setFormData] = useState({
    sleep: '',
    water: '',
    steps: '',
    calories: '',
    stress: '3',
    mood: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEntry: HealthData = {
      date: new Date().toISOString().split('T')[0],
      sleep: parseFloat(formData.sleep),
      water: parseFloat(formData.water),
      steps: parseInt(formData.steps),
      calories: parseInt(formData.calories),
      stress: parseInt(formData.stress),
      mood: formData.mood,
    };

    // Save to localStorage
    const existingData = JSON.parse(localStorage.getItem('healthData') || '[]');
    const updatedData = [...existingData, newEntry];
    localStorage.setItem('healthData', JSON.stringify(updatedData));

    toast({
      title: "Health data logged successfully!",
      description: "Your daily health metrics have been recorded.",
    });

    // Reset form
    setFormData({
      sleep: '',
      water: '',
      steps: '',
      calories: '',
      stress: '3',
      mood: '',
    });
  };

  const stressLevels = [
    { value: '1', label: '1 - Very Low', color: 'text-green-600' },
    { value: '2', label: '2 - Low', color: 'text-green-500' },
    { value: '3', label: '3 - Moderate', color: 'text-yellow-500' },
    { value: '4', label: '4 - High', color: 'text-orange-500' },
    { value: '5', label: '5 - Very High', color: 'text-red-500' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-900">
            Daily Health Log
          </CardTitle>
          <CardDescription className="text-center">
            Track your daily health metrics to get personalized insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sleep Duration */}
            <div className="space-y-2">
              <Label htmlFor="sleep" className="text-sm font-medium text-gray-700">
                Sleep Duration (hours)
              </Label>
              <div className="relative">
                <Input
                  id="sleep"
                  type="number"
                  step="0.5"
                  min="0"
                  max="12"
                  placeholder="e.g., 7.5"
                  value={formData.sleep}
                  onChange={(e) => setFormData(prev => ({ ...prev, sleep: e.target.value }))}
                  className="pl-10"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  😴
                </div>
              </div>
            </div>

            {/* Water Intake */}
            <div className="space-y-2">
              <Label htmlFor="water" className="text-sm font-medium text-gray-700">
                Water Intake (liters)
              </Label>
              <div className="relative">
                <Input
                  id="water"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="e.g., 2.5"
                  value={formData.water}
                  onChange={(e) => setFormData(prev => ({ ...prev, water: e.target.value }))}
                  className="pl-10"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  💧
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <Label htmlFor="steps" className="text-sm font-medium text-gray-700">
                Steps Walked
              </Label>
              <div className="relative">
                <Input
                  id="steps"
                  type="number"
                  min="0"
                  max="50000"
                  placeholder="e.g., 8000"
                  value={formData.steps}
                  onChange={(e) => setFormData(prev => ({ ...prev, steps: e.target.value }))}
                  className="pl-10"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  👟
                </div>
              </div>
            </div>

            {/* Calories */}
            <div className="space-y-2">
              <Label htmlFor="calories" className="text-sm font-medium text-gray-700">
                Calories Consumed
              </Label>
              <div className="relative">
                <Input
                  id="calories"
                  type="number"
                  min="0"
                  max="5000"
                  placeholder="e.g., 2000"
                  value={formData.calories}
                  onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                  className="pl-10"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🍎
                </div>
              </div>
            </div>

            {/* Stress Level */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Stress Level (1-5 scale)
              </Label>
              <Select value={formData.stress} onValueChange={(value) => setFormData(prev => ({ ...prev, stress: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stress level" />
                </SelectTrigger>
                <SelectContent>
                  {stressLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <span className={level.color}>{level.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Current Mood
              </Label>
              <Select value={formData.mood} onValueChange={(value) => setFormData(prev => ({ ...prev, mood: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Happy">😊 Happy</SelectItem>
                  <SelectItem value="Energetic">⚡ Energetic</SelectItem>
                  <SelectItem value="Normal">😐 Normal</SelectItem>
                  <SelectItem value="Tired">😴 Tired</SelectItem>
                  <SelectItem value="Stressed">😰 Stressed</SelectItem>
                  <SelectItem value="Sad">😢 Sad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-3"
            >
              Log Health Data
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthLogForm;
