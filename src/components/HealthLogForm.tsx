
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useHealthData } from '@/hooks/useHealthData';
import { Heart, Zap, Moon, Dumbbell, Droplets, Brain } from 'lucide-react';

const HealthLogForm = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mood: [7],
    energy: [7],
    sleep_hours: 8,
    exercise_minutes: 30,
    stress_level: [5],
    water_intake: 8,
  });

  const { addSingleEntry } = useHealthData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await addSingleEntry({
      date: formData.date,
      mood: formData.mood[0],
      energy: formData.energy[0],
      sleep_hours: formData.sleep_hours,
      exercise_minutes: formData.exercise_minutes,
      stress_level: formData.stress_level[0],
      water_intake: formData.water_intake,
    });

    if (success) {
      // Reset form to default values
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mood: [7],
        energy: [7],
        sleep_hours: 8,
        exercise_minutes: 30,
        stress_level: [5],
        water_intake: 8,
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Log Your Health Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            {/* Mood */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Mood: {formData.mood[0]}/10
              </Label>
              <Slider
                value={formData.mood}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mood: value }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Very Sad</span>
                <span>Very Happy</span>
              </div>
            </div>

            {/* Energy */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Energy: {formData.energy[0]}/10
              </Label>
              <Slider
                value={formData.energy}
                onValueChange={(value) => setFormData(prev => ({ ...prev, energy: value }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Exhausted</span>
                <span>Energized</span>
              </div>
            </div>

            {/* Sleep Hours */}
            <div className="space-y-2">
              <Label htmlFor="sleep" className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-blue-500" />
                Sleep Hours
              </Label>
              <Input
                id="sleep"
                type="number"
                value={formData.sleep_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, sleep_hours: parseFloat(e.target.value) }))}
                min="0"
                max="24"
                step="0.5"
                required
              />
            </div>

            {/* Exercise Minutes */}
            <div className="space-y-2">
              <Label htmlFor="exercise" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-green-500" />
                Exercise Minutes
              </Label>
              <Input
                id="exercise"
                type="number"
                value={formData.exercise_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, exercise_minutes: parseInt(e.target.value) }))}
                min="0"
                required
              />
            </div>

            {/* Stress Level */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Stress Level: {formData.stress_level[0]}/10
              </Label>
              <Slider
                value={formData.stress_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, stress_level: value }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Very Relaxed</span>
                <span>Very Stressed</span>
              </div>
            </div>

            {/* Water Intake */}
            <div className="space-y-2">
              <Label htmlFor="water" className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-500" />
                Water Intake (glasses)
              </Label>
              <Input
                id="water"
                type="number"
                value={formData.water_intake}
                onChange={(e) => setFormData(prev => ({ ...prev, water_intake: parseInt(e.target.value) }))}
                min="0"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Log Health Data'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthLogForm;
