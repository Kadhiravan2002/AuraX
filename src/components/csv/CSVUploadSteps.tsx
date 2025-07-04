import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Upload, FileText, Database, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCSVMappings } from '@/hooks/useCSVMappings';
import { toast } from '@/hooks/use-toast';
import DataPreviewChart from './DataPreviewChart';

interface CSVUploadStepsProps {
  onUploadSuccess?: () => void;
}

const CSVUploadSteps = ({ onUploadSuccess }: CSVUploadStepsProps) => {
  const { user } = useAuth();
  const { savedMappings, saveMapping, findSimilarMapping } = useCSVMappings();
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [mappingName, setMappingName] = useState('');

  // Field mappings for health data
  const fieldMappings = {
    'date': 'date',
    'sleep_hours': 'sleep_hours',
    'water_intake': 'water_intake', 
    'exercise_minutes': 'exercise_minutes',
    'stress_level': 'stress_level',
    'mood': 'mood',
    'energy': 'energy'
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCurrentStep(2);
      processCSVData(selectedFile);
    }
  };

  const processCSVData = (selectedFile: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const lines = csvText.split('\n');
      const headerRow = lines[0].split(',');
      const dataRows = lines.slice(1);

      const extractedHeaders = headerRow.map(header => header.trim());
      setHeaders(extractedHeaders);

      const initialMapping = {};
      Object.keys(fieldMappings).forEach(key => {
        initialMapping[key] = '';
      });
      setColumnMapping(initialMapping);

      const extractedCsvData: any[] = [];
      dataRows.forEach(row => {
        const values = row.split(',');
        const rowData = {};
        for (let i = 0; i < extractedHeaders.length; i++) {
          rowData[extractedHeaders[i]] = values[i] ? values[i].trim() : '';
        }
        extractedCsvData.push(rowData);
      });
      setCsvData(extractedCsvData);

      // Attempt to find a similar mapping
      const similarMapping = findSimilarMapping(extractedHeaders);
      if (similarMapping) {
        setColumnMapping(similarMapping.mapping);
        toast({
          title: "Similar mapping found!",
          description: `Loaded mapping "${similarMapping.name}"`,
        });
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleColumnMappingChange = (field: string, header: string) => {
    setColumnMapping(prevMapping => ({
      ...prevMapping,
      [field]: header,
    }));
  };

  const generatePreview = useCallback(() => {
    const mappedData = csvData.map(row => {
      const mappedRecord: any = {};
      Object.entries(fieldMappings).forEach(([key, field]) => {
        const header = columnMapping[key];
        mappedRecord[field] = header ? row[header] : null;
      });
      return mappedRecord;
    });

    // Convert strings to numbers where appropriate
    const typedData = mappedData.map(item => ({
      date: item.date || new Date().toISOString().split('T')[0],
      sleep_hours: item.sleep_hours ? parseFloat(item.sleep_hours) : null,
      water_intake: item.water_intake ? parseFloat(item.water_intake) : null,
      exercise_minutes: item.exercise_minutes ? parseFloat(item.exercise_minutes) : null,
      stress_level: item.stress_level ? parseInt(item.stress_level) : null,
      mood: item.mood ? parseInt(item.mood) : null,
      energy: item.energy ? parseInt(item.energy) : null
    }));

    setPreviewData(typedData);
    setCurrentStep(3);
  }, [csvData, columnMapping, fieldMappings]);

  const uploadData = async () => {
    if (!user || previewData.length === 0) return;

    try {
      setUploadProgress(10);
      
      console.log('Starting data upload for user:', user.id);
      console.log('Preview data:', previewData);

      // Ensure all records have user_id assigned
      const dataWithUserId = previewData.map(record => ({
        ...record,
        user_id: user.id // Automatically assign current user's ID
      }));

      console.log('Data with user_id:', dataWithUserId);

      setUploadProgress(50);

      // Insert data in batches
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < dataWithUserId.length; i += batchSize) {
        batches.push(dataWithUserId.slice(i, i + batchSize));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Uploading batch ${i + 1}/${batches.length}:`, batch);
        
        const { error } = await supabase
          .from('health_data')
          .upsert(batch, {
            onConflict: 'user_id,date',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`Error uploading batch ${i + 1}:`, error);
          throw error;
        }

        setUploadProgress(50 + ((i + 1) / batches.length) * 40);
      }

      console.log('Successfully uploaded all data batches');

      // Now trigger health alerts analysis
      setUploadProgress(90);
      console.log('Triggering health alerts analysis...');
      
      try {
        const { data: alertsData, error: alertsError } = await supabase.functions.invoke('trigger-health-alerts', {
          body: { after_csv_upload: true }
        });

        if (alertsError) {
          console.error('Error triggering health alerts:', alertsError);
          // Don't fail the upload if alerts fail
        } else {
          console.log('Health alerts analysis triggered:', alertsData);
        }
      } catch (alertError) {
        console.error('Failed to trigger health alerts:', alertError);
        // Don't fail the upload if alerts fail
      }

      setUploadProgress(100);

      toast({
        title: "Data uploaded successfully!",
        description: `${dataWithUserId.length} health records have been imported and analyzed.`,
      });

      // Save successful mapping
      if (mappingName) {
        saveMapping(mappingName, columnMapping, headers);
      }

      setCurrentStep(4);
      
      // Notify parent component
      if (onUploadSuccess) {
        setTimeout(() => onUploadSuccess(), 1000);
      }

    } catch (error: any) {
      console.error('Error uploading data:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload CSV data",
        variant: "destructive"
      });
      setUploadProgress(0);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CardContent className="grid gap-4">
            <p>
              To get started, upload a CSV file containing your health data.
            </p>
            <Input type="file" id="upload" accept=".csv" onChange={handleFileSelect} className="hidden" />
            <Label htmlFor="upload" className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer hover:bg-blue-600 transition-colors">
              <Upload className="w-4 h-4 mr-2 inline-block" />
              Select CSV File
            </Label>
          </CardContent>
        );
      case 2:
        return (
          <CardContent className="grid gap-4">
            <p>
              Map the columns from your CSV to the corresponding health data fields.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(fieldMappings).map(([key, field]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`select-${key}`}>{field}</Label>
                  <Select onValueChange={(value) => handleColumnMappingChange(key, value)}>
                    <SelectTrigger id={`select-${key}`}>
                      <SelectValue placeholder="Select a column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapping-name">Mapping Name (optional)</Label>
              <Input
                type="text"
                id="mapping-name"
                placeholder="e.g., MyFitnessPal Export"
                value={mappingName}
                onChange={(e) => setMappingName(e.target.value)}
              />
            </div>
            <Button onClick={generatePreview} disabled={headers.length === 0}>
              Generate Preview
            </Button>
          </CardContent>
        );
      case 3:
        return (
          <CardContent className="grid gap-4">
            <p>
              Here's a preview of how your data will be imported.
            </p>
            {previewData.length > 0 ? (
              <>
                <DataPreviewChart data={previewData} />
                <div className="w-full">
                  <Progress value={uploadProgress} />
                </div>
                <Button onClick={uploadData} disabled={uploadProgress > 0 && uploadProgress < 100}>
                  Upload Data
                </Button>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No data to preview. Please check your column mappings and try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        );
      case 4:
        return (
          <CardContent className="grid gap-4">
            <div className="flex items-center space-x-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              <h4 className="text-lg font-medium">Upload Complete!</h4>
            </div>
            <p>
              Your data has been successfully uploaded and is being analyzed.
            </p>
            <Button onClick={onUploadSuccess}>
              Go to Dashboard
            </Button>
          </CardContent>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>CSV Upload</CardTitle>
        <CardDescription>Import your health data from a CSV file.</CardDescription>
      </CardHeader>
      {renderStepContent()}
    </Card>
  );
};

export default CSVUploadSteps;
