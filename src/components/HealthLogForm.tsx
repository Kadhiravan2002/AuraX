import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface HealthLogFormProps {
  onDataSaved?: () => void;
}

const HealthLogForm = ({ onDataSaved }: HealthLogFormProps) => {
  const [formData, setFormData] = useState({
    sleep: '',
    water: '',
    exercise: '',
    stress: '3',
    mood: '3',
    energy: '5'
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to save health data",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('health_data')
        .upsert({
          user_id: user.id,
          date: today,
          sleep_hours: parseFloat(formData.sleep),
          water_intake: parseFloat(formData.water),
          exercise_minutes: parseInt(formData.exercise),
          stress_level: parseInt(formData.stress),
          mood: parseInt(formData.mood),
          energy: parseInt(formData.energy)
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('Error saving health data:', error);
        toast({
          title: "Error saving data",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Health data saved successfully!",
        description: "Your daily health metrics have been recorded.",
      });

      // Reset form
      setFormData({
        sleep: '',
        water: '',
        exercise: '',
        stress: '3',
        mood: '3',
        energy: '5'
      });

      // Call the callback if provided
      if (onDataSaved) {
        onDataSaved();
      }

      // Trigger a refresh of the dashboard data
      window.dispatchEvent(new CustomEvent('healthDataUpdated'));
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "Failed to save health data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const stressLevels = [
    { value: '1', label: '1 - Very Low', color: 'text-green-600' },
    { value: '2', label: '2 - Low', color: 'text-green-500' },
    { value: '3', label: '3 - Moderate', color: 'text-yellow-500' },
    { value: '4', label: '4 - High', color: 'text-orange-500' },
    { value: '5', label: '5 - Very High', color: 'text-red-500' },
  ];

  const moodLevels = [
    { value: '1', label: '😢 Sad' },
    { value: '2', label: '😴 Tired' },
    { value: '3', label: '😐 Normal' },
    { value: '4', label: '😊 Happy' },
    { value: '5', label: '⚡ Energetic' },
  ];

  const energyLevels = [
    { value: '1', label: '1 - Very Low' },
    { value: '2', label: '2 - Low' },
    { value: '3', label: '3 - Moderate' },
    { value: '4', label: '4 - High' },
    { value: '5', label: '5 - Very High' },
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
                  max="24"
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

            {/* Exercise Minutes */}
            <div className="space-y-2">
              <Label htmlFor="exercise" className="text-sm font-medium text-gray-700">
                Exercise Minutes
              </Label>
              <div className="relative">
                <Input
                  id="exercise"
                  type="number"
                  min="0"
                  max="300"
                  placeholder="e.g., 30"
                  value={formData.exercise}
                  onChange={(e) => setFormData(prev => ({ ...prev, exercise: e.target.value }))}
                  className="pl-10"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🏃
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
                  {moodLevels.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Energy Level */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Energy Level (1-5 scale)
              </Label>
              <Select value={formData.energy} onValueChange={(value) => setFormData(prev => ({ ...prev, energy: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select energy level" />
                </SelectTrigger>
                <SelectContent>
                  {energyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-3"
              disabled={loading}
            >
              {loading ? "Saving..." : "Log Health Data"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthLogForm;
