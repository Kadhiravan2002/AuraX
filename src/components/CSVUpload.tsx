
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HealthDataRow {
  date: string;
  mood: number;
  energy: number;
  sleep_hours: number;
  exercise_minutes: number;
  stress_level: number;
  water_intake: number;
}

const CSVUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<HealthDataRow[] | null>(null);
  const { checkFeatureAccess, getUpgradeMessage } = usePremiumFeatures();
  const { toast } = useToast();
  const navigate = useNavigate();

  const hasCSVAccess = checkFeatureAccess('csvUpload');

  if (!hasCSVAccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Premium Feature Required
          </CardTitle>
          <CardDescription>
            {getUpgradeMessage('csvUpload')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/billing')} className="w-full">
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file',
        variant: 'destructive'
      });
    }
  };

  const parseCSV = (text: string): HealthDataRow[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Expected headers mapping
    const headerMapping: { [key: string]: keyof HealthDataRow } = {
      'date': 'date',
      'mood': 'mood',
      'energy': 'energy',
      'sleep hours': 'sleep_hours',
      'sleep_hours': 'sleep_hours',
      'exercise minutes': 'exercise_minutes',
      'exercise_minutes': 'exercise_minutes',
      'stress level': 'stress_level',
      'stress_level': 'stress_level',
      'water intake': 'water_intake',
      'water_intake': 'water_intake'
    };

    const data: HealthDataRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      const row: Partial<HealthDataRow> = {};
      
      headers.forEach((header, index) => {
        const mappedKey = headerMapping[header];
        if (mappedKey && values[index]) {
          if (mappedKey === 'date') {
            row[mappedKey] = values[index].trim();
          } else {
            row[mappedKey] = parseFloat(values[index].trim());
          }
        }
      });
      
      // Validate row has required fields
      if (row.date && typeof row.mood === 'number' && typeof row.energy === 'number') {
        data.push(row as HealthDataRow);
      }
    }
    
    return data;
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      
      if (parsedData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }
      
      setAnalyzedData(parsedData);
      toast({
        title: 'CSV uploaded successfully!',
        description: `Analyzed ${parsedData.length} health records`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to process CSV file',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const getInsights = () => {
    if (!analyzedData) return null;
    
    const avgMood = analyzedData.reduce((sum, row) => sum + row.mood, 0) / analyzedData.length;
    const avgEnergy = analyzedData.reduce((sum, row) => sum + row.energy, 0) / analyzedData.length;
    const avgSleep = analyzedData.reduce((sum, row) => sum + (row.sleep_hours || 0), 0) / analyzedData.length;
    
    return {
      totalRecords: analyzedData.length,
      avgMood: avgMood.toFixed(1),
      avgEnergy: avgEnergy.toFixed(1),
      avgSleep: avgSleep.toFixed(1),
      dateRange: {
        start: analyzedData[0]?.date,
        end: analyzedData[analyzedData.length - 1]?.date
      }
    };
  };

  const insights = getInsights();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Health Data CSV
          </CardTitle>
          <CardDescription>
            Upload your health data in CSV format to get advanced analytics and insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
              <p className="text-sm text-gray-500">
                CSV should include columns: date, mood, energy, sleep_hours, exercise_minutes, stress_level, water_intake
              </p>
            </div>
          </div>
          
          {file && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">{file.name}</span>
              <Button 
                onClick={handleUpload} 
                disabled={uploading}
                size="sm"
              >
                {uploading ? 'Processing...' : 'Analyze Data'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Data Analysis Results</CardTitle>
            <CardDescription>
              Insights from your uploaded health data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{insights.totalRecords}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{insights.avgMood}</div>
                <div className="text-sm text-gray-600">Avg Mood</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{insights.avgEnergy}</div>
                <div className="text-sm text-gray-600">Avg Energy</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{insights.avgSleep}</div>
                <div className="text-sm text-gray-600">Avg Sleep (hrs)</div>
              </div>
            </div>
            
            {insights.dateRange.start && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Date Range:</strong> {insights.dateRange.start} to {insights.dateRange.end}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVUpload;
