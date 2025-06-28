
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Save,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { useCSVMappings } from '@/hooks/useCSVMappings';
import { useHealthData } from '@/hooks/useHealthData';
import DataPreviewChart from './DataPreviewChart';

interface CSVRow {
  [key: string]: string;
}

interface HealthDataEntry {
  date: string;
  mood?: number | null;
  energy?: number | null;
  sleep_hours?: number | null;
  exercise_minutes?: number | null;
  stress_level?: number | null;
  water_intake?: number | null;
}

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const isValidNumber = (value: string): boolean => {
  if (value === '') return true; // Allow empty values
  return !isNaN(Number(value));
};

const CSVUploadSteps = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
  const [insertMode, setInsertMode] = useState<'merge' | 'overwrite' | 'new'>('merge');
  const [cleanedData, setCleanedData] = useState<HealthDataEntry[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ added: number; skipped: number; replaced: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { savedMappings, saveMapping, loadMapping, deleteMapping, findSimilarMapping } = useCSVMappings();
  const { insertHealthData } = useHealthData();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setCsvFile(file);
      setCsvData([]);
      setHeaders([]);
      setColumnMapping({});
      setCleanedData([]);
      setValidationErrors([]);
      setCurrentStep(2);
      parseCSV(file);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const parsedHeaders = lines[0].split(',').map(header => header.trim());
      const parsedData: CSVRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === parsedHeaders.length) {
          const row: CSVRow = {};
          for (let j = 0; j < parsedHeaders.length; j++) {
            row[parsedHeaders[j]] = values[j].trim();
          }
          parsedData.push(row);
        }
      }

      setHeaders(parsedHeaders);
      setCsvData(parsedData);
    };

    reader.readAsText(file);
  };

  const handleMappingChange = (header: string, field: string) => {
    setColumnMapping(prevMapping => ({
      ...prevMapping,
      [header]: field,
    }));
  };

  const validateRow = (row: any): string[] => {
    const errors: string[] = [];

    const dateValue = row[columnMapping['date']];
    if (!dateValue || !isValidDate(dateValue)) {
      errors.push(`Invalid date: ${dateValue}`);
    }

    const moodValue = row[columnMapping['mood']];
    if (moodValue && !isValidNumber(moodValue)) {
      errors.push(`Invalid mood: ${moodValue}`);
    }

    const energyValue = row[columnMapping['energy']];
    if (energyValue && !isValidNumber(energyValue)) {
      errors.push(`Invalid energy: ${energyValue}`);
    }

    const sleepValue = row[columnMapping['sleep_hours']];
    if (sleepValue && !isValidNumber(sleepValue)) {
      errors.push(`Invalid sleep hours: ${sleepValue}`);
    }

    const exerciseValue = row[columnMapping['exercise_minutes']];
    if (exerciseValue && !isValidNumber(exerciseValue)) {
      errors.push(`Invalid exercise minutes: ${exerciseValue}`);
    }

     const stressValue = row[columnMapping['stress_level']];
    if (stressValue && !isValidNumber(stressValue)) {
      errors.push(`Invalid stress level: ${stressValue}`);
    }

    const waterValue = row[columnMapping['water_intake']];
    if (waterValue && !isValidNumber(waterValue)) {
      errors.push(`Invalid water intake: ${waterValue}`);
    }

    return errors;
  };

  const cleanAndValidateData = () => {
    const cleaned: HealthDataEntry[] = [];
    const errors: string[] = [];

    csvData.forEach((row, index) => {
      const rowErrors = validateRow(row);
      if (rowErrors.length > 0) {
        errors.push(`Row ${index + 1}: ${rowErrors.join(', ')}`);
      } else {
        const cleanedRow: HealthDataEntry = {
          date: row[columnMapping['date']],
          mood: row[columnMapping['mood']] ? Number(row[columnMapping['mood']]) : null,
          energy: row[columnMapping['energy']] ? Number(row[columnMapping['energy']]) : null,
          sleep_hours: row[columnMapping['sleep_hours']] ? Number(row[columnMapping['sleep_hours']]) : null,
          exercise_minutes: row[columnMapping['exercise_minutes']] ? Number(row[columnMapping['exercise_minutes']]) : null,
          stress_level: row[columnMapping['stress_level']] ? Number(row[columnMapping['stress_level']]) : null,
          water_intake: row[columnMapping['water_intake']] ? Number(row[columnMapping['water_intake']]) : null,
        };
        cleaned.push(cleanedRow);
      }
    });

    setCleanedData(cleaned);
    setValidationErrors(errors);
    return { cleaned, errors };
  };

  const handleCleanAndValidate = () => {
    const { errors } = cleanAndValidateData();
    if (errors.length === 0) {
      toast.success('Data validated successfully!');
      setCurrentStep(3);
    } else {
      toast.error('Please fix validation errors before proceeding.');
    }
  };

  const handleSaveMapping = async (mappingName: string) => {
    if (Object.keys(columnMapping).length === 0) {
      toast.error('No column mappings to save.');
      return;
    }

    const mappingToSave = {
      name: mappingName,
      mapping: columnMapping,
      headers: headers,
    };

    const success = await saveMapping(mappingToSave);
    if (success) {
      toast.success('Mapping saved successfully!');
    } else {
      toast.error('Failed to save mapping.');
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    const success = await deleteMapping(mappingId);
    if (success) {
      toast.success('Mapping deleted successfully!');
    } else {
      toast.error('Failed to delete mapping.');
    }
  };

  const handleLoadMapping = async (mappingId: string) => {
    const loadedMapping = await loadMapping(mappingId);
    if (loadedMapping) {
      setColumnMapping(loadedMapping.mapping);
      toast.success('Mapping loaded successfully!');
    } else {
      toast.error('Failed to load mapping.');
    }
  };

  const handleFindSimilarMapping = async () => {
    const similarMapping = await findSimilarMapping(headers);
    if (similarMapping) {
      setColumnMapping(similarMapping.mapping);
      toast.success('Similar mapping found and loaded!');
    } else {
      toast.info('No similar mapping found.');
    }
  };

  const handleImport = async () => {
    if (cleanedData.length === 0) {
      toast.error('No valid data to import');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Transform the cleaned data to match our database schema
      const transformedData = cleanedData.map(row => ({
        date: row.date,
        mood: row.mood || null,
        energy: row.energy || null,
        sleep_hours: row.sleep_hours || null,
        exercise_minutes: row.exercise_minutes || null,
        stress_level: row.stress_level || null,
        water_intake: row.water_intake || null,
      }));

      const result = await insertHealthData(transformedData, insertMode);
      
      if (result.success) {
        setImportResults({
          added: result.added,
          skipped: result.skipped,
          replaced: result.replaced
        });
        setCurrentStep(4);
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(100);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setCsvFile(null);
    setCsvData([]);
    setHeaders([]);
    setColumnMapping({});
    setCleanedData([]);
    setValidationErrors([]);
    setImportResults(null);
    setCurrentStep(1);
  };

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProcessingProgress(oldProgress => {
          const newProgress = oldProgress + 10;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>CSV Upload</CardTitle>
        <CardDescription>Import your health data from a CSV file.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentStep === 1 && (
          <div className="space-y-2">
            <Label htmlFor="csv-upload">Select CSV File</Label>
            <Input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
            {csvFile && <p>Selected file: {csvFile.name}</p>}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Map Columns</h3>
            <p>Map the columns from your CSV to the corresponding data fields.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {headers.map((header) => (
                <div key={header} className="space-y-2">
                  <Label htmlFor={`select-${header}`}>{header}</Label>
                  <Select onValueChange={(value) => handleMappingChange(header, value)}>
                    <SelectTrigger id={`select-${header}`}>
                      <SelectValue placeholder="Select Field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="mood">Mood (1-10)</SelectItem>
                      <SelectItem value="energy">Energy (1-10)</SelectItem>
                      <SelectItem value="sleep_hours">Sleep (Hours)</SelectItem>
                      <SelectItem value="exercise_minutes">Exercise (Minutes)</SelectItem>
                      <SelectItem value="stress_level">Stress Level (1-10)</SelectItem>
                      <SelectItem value="water_intake">Water Intake (Glasses)</SelectItem>
                      <SelectItem value="">Ignore Column</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => resetFileInput()}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <div>
                <Button variant="secondary" onClick={handleFindSimilarMapping} className="mr-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  Auto-Map
                </Button>
                <Button onClick={handleCleanAndValidate}>
                  Validate Data
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <Input type="text" id="mapping-name" placeholder="Mapping Name" className="flex-1" />
              <Button variant="outline" onClick={() => {
                const mappingName = (document.getElementById('mapping-name') as HTMLInputElement)?.value;
                handleSaveMapping(mappingName);
              }}>
                <Save className="h-4 w-4 mr-2" />
                Save Mapping
              </Button>
            </div>

            {savedMappings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Load Saved Mapping</h4>
                <div className="flex flex-wrap gap-2">
                  {savedMappings.map((mapping) => (
                    <Badge key={mapping.id} className="cursor-pointer" onClick={() => handleLoadMapping(mapping.id)}>
                      {mapping.name}
                      <Button variant="ghost" size="icon" onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMapping(mapping.id);
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Review and Import</h3>
            {validationErrors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-red-500 font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Validation Errors
                </h4>
                <ul className="list-disc pl-5">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-red-500">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {cleanedData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Data Preview</h4>
                <DataPreviewChart data={cleanedData.map(item => ({
                  ...item,
                  mood: item.mood || 0,
                  energy: item.energy || 0,
                  sleep_hours: item.sleep_hours || 0,
                  exercise_minutes: item.exercise_minutes || 0,
                  stress_level: item.stress_level || 0,
                  water_intake: item.water_intake || 0,
                }))} />
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mood
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Energy
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sleep (Hours)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exercise (Minutes)
                        </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stress Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Water Intake (Glasses)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cleanedData.map((row, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">{row.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{row.mood}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{row.energy}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{row.sleep_hours}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{row.exercise_minutes}</td>
                           <td className="px-6 py-4 whitespace-nowrap">{row.stress_level}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{row.water_intake}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Insert Mode</Label>
              <Select 
                onValueChange={(value: 'merge' | 'overwrite' | 'new') => setInsertMode(value)} 
                defaultValue="merge"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select insert mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">Merge (Update existing, add new)</SelectItem>
                  <SelectItem value="overwrite">Overwrite (Replace existing, add new)</SelectItem>
                  <SelectItem value="new">New Only (Add new, skip existing)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleImport} disabled={isProcessing}>
              {isProcessing ? 'Importing...' : 'Import Data'}
              {isProcessing && <Progress value={processingProgress} className="w-24 ml-2" />}
              <Upload className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {currentStep === 4 && importResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import Results</h3>
            <p>
              <CheckCircle className="inline-block h-5 w-5 text-green-500 mr-2 align-middle" />
              Import completed successfully!
            </p>
            <ul className="list-disc pl-5">
              <li>{importResults.added} entries added.</li>
              <li>{importResults.replaced} entries updated.</li>
              <li>{importResults.skipped} entries skipped.</li>
            </ul>
            <Button onClick={resetFileInput}>
              Import Another File
              <FileText className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CSVUploadSteps;
