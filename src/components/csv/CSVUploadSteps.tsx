import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Settings, Database, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useCSVMappings } from '@/hooks/useCSVMappings';
import { useHealthData } from '@/hooks/useHealthData';
import DataPreviewChart from './DataPreviewChart';
import { toast } from 'sonner';

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface MappedData {
  date: string;
  mood: number;
  energy: number;
  sleep_hours: number;
  exercise_minutes: number;
  stress_level: number;
  water_intake: number;
}

interface ColumnMapping {
  [internalField: string]: string;
}

type InsertMode = 'merge' | 'overwrite' | 'new';

const INTERNAL_FIELDS = [
  { key: 'date', label: 'Date', required: true },
  { key: 'mood', label: 'Mood (1-10)', required: true },
  { key: 'energy', label: 'Energy (1-10)', required: true },
  { key: 'sleep_hours', label: 'Sleep Hours', required: true },
  { key: 'exercise_minutes', label: 'Exercise Minutes', required: true },
  { key: 'stress_level', label: 'Stress Level (1-10)', required: true },
  { key: 'water_intake', label: 'Water Intake (glasses)', required: true },
];

const CSVUploadSteps = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [mappedData, setMappedData] = useState<MappedData[]>([]);
  const [insertMode, setInsertMode] = useState<InsertMode>('merge');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [importResults, setImportResults<{ added: number; skipped: number; replaced: number } | null>](null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { savedMappings, saveMapping, loadMapping, deleteMapping, findSimilarMapping } = useCSVMappings();
  const { insertHealthData, refreshData } = useHealthData();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      setCsvData({ headers, rows });
      
      // Try to find similar mapping
      const similarMapping = findSimilarMapping(headers);
      if (similarMapping) {
        setColumnMapping(similarMapping.mapping);
        toast.success(`Applied saved mapping: ${similarMapping.name}`);
      }
      
      setCurrentStep(2);
    };
    reader.readAsText(file);
  };

  const validateMapping = () => {
    const errors: string[] = [];
    const requiredFields = INTERNAL_FIELDS.filter(field => field.required);
    
    for (const field of requiredFields) {
      if (!columnMapping[field.key]) {
        errors.push(`${field.label} must be mapped to a CSV column`);
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleMappingComplete = () => {
    if (!validateMapping() || !csvData) return;

    setIsProcessing(true);
    setProcessingProgress(20);

    try {
      const mapped: MappedData[] = [];
      const errors: string[] = [];

      for (let i = 0; i < csvData.rows.length; i++) {
        const row = csvData.rows[i];
        const entry: any = {};

        // Map each field
        for (const field of INTERNAL_FIELDS) {
          const csvColumnIndex = csvData.headers.indexOf(columnMapping[field.key]);
          if (csvColumnIndex === -1) continue;

          const value = row[csvColumnIndex];
          
          if (field.key === 'date') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              errors.push(`Row ${i + 1}: Invalid date format "${value}"`);
              continue;
            }
            entry[field.key] = date.toISOString().split('T')[0];
          } else {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              errors.push(`Row ${i + 1}: Invalid number "${value}" for ${field.label}`);
              continue;
            }
            entry[field.key] = numValue;
          }
        }

        // Validate ranges
        if (entry.mood && (entry.mood < 1 || entry.mood > 10)) {
          errors.push(`Row ${i + 1}: Mood must be between 1-10`);
        }
        if (entry.energy && (entry.energy < 1 || entry.energy > 10)) {
          errors.push(`Row ${i + 1}: Energy must be between 1-10`);
        }
        if (entry.stress_level && (entry.stress_level < 1 || entry.stress_level > 10)) {
          errors.push(`Row ${i + 1}: Stress level must be between 1-10`);
        }
        if (entry.sleep_hours && (entry.sleep_hours < 0 || entry.sleep_hours > 24)) {
          errors.push(`Row ${i + 1}: Sleep hours must be between 0-24`);
        }

        if (Object.keys(entry).length === INTERNAL_FIELDS.length) {
          mapped.push(entry);
        }
      }

      setProcessingProgress(60);

      if (errors.length > 0) {
        setValidationErrors(errors);
        setIsProcessing(false);
        setProcessingProgress(0);
        return;
      }

      // Remove duplicates based on date
      const uniqueEntries = mapped.filter((entry, index, self) => 
        index === self.findIndex(e => e.date === entry.date)
      );

      setMappedData(uniqueEntries);
      setValidationErrors([]);
      setProcessingProgress(100);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error processing CSV data:', error);
      toast.error('Error processing CSV data');
      setValidationErrors(['Error processing CSV data. Please check your file format.']);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleSaveData = async () => {
    if (mappedData.length === 0) {
      toast.error('No data to save');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      setProcessingProgress(25);
      
      const results = await insertHealthData(mappedData, insertMode);
      
      setProcessingProgress(75);
      
      if (results.success) {
        setImportResults(results);
        setProcessingProgress(100);
        setCurrentStep(4);
        
        // Refresh dashboard data
        await refreshData();
      } else {
        toast.error('Failed to save data to database');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Error saving data to database');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleSaveMapping = () => {
    const mappingName = prompt('Enter a name for this mapping:');
    if (mappingName && csvData) {
      saveMapping(mappingName, columnMapping, csvData.headers);
      toast.success('Mapping saved successfully!');
    }
  };

  const handleLoadMapping = (mappingId: string) => {
    const mapping = loadMapping(mappingId);
    if (mapping) {
      setColumnMapping(mapping.mapping);
      toast.success('Mapping loaded successfully!');
    }
  };

  const exportMergedData = () => {
    if (mappedData.length === 0) return;
    
    const headers = ['date', 'mood', 'energy', 'sleep_hours', 'exercise_minutes', 'stress_level', 'water_intake'];
    const csvContent = [
      headers.join(','),
      ...mappedData.map(row => headers.map(header => row[header as keyof MappedData]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'health_data_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setCsvData(null);
    setColumnMapping({});
    setMappedData([]);
    setValidationErrors([]);
    setImportResults(null);
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`rounded-full w-10 h-10 flex items-center justify-center ${
              currentStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 4 && <div className={`w-16 h-1 mx-2 ${
              currentStep > step ? 'bg-blue-500' : 'bg-gray-200'
            }`} />}
          </div>
        ))}
      </div>

      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Choose your CSV file</p>
              <p className="text-gray-600 mb-4">Upload a CSV file with your health data</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {currentStep === 2 && csvData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Map Your Columns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {INTERNAL_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-4">
                    <div className="w-48">
                      <label className="text-sm font-medium">{field.label}</label>
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    <Select
                      value={columnMapping[field.key] || ''}
                      onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [field.key]: value }))}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select CSV column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvData.headers.map((header) => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {validationErrors.length > 0 && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4 mt-6">
                <Button onClick={handleMappingComplete} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Analyze Data'}
                </Button>
                <Button variant="outline" onClick={handleSaveMapping}>
                  Save Mapping
                </Button>
              </div>

              {/* Saved mappings */}
              {savedMappings.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Saved Mappings:</p>
                  <div className="flex flex-wrap gap-2">
                    {savedMappings.map((mapping) => (
                      <Button
                        key={mapping.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadMapping(mapping.id)}
                      >
                        {mapping.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {csvData.headers.map((header) => (
                        <th key={header} className="text-left p-2">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="p-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.rows.length > 5 && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing first 5 rows of {csvData.rows.length} total rows
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Review and Insert Options */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Review & Choose Insert Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Data Analysis Complete</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Total entries: <Badge variant="secondary">{mappedData.length}</Badge></div>
                    <div>Date range: <Badge variant="outline">
                      {mappedData.length > 0 ? `${mappedData[mappedData.length - 1]?.date} to ${mappedData[0]?.date}` : 'N/A'}
                    </Badge></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">How would you like to insert this data?</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="insertMode"
                        value="merge"
                        checked={insertMode === 'merge'}
                        onChange={(e) => setInsertMode(e.target.value as InsertMode)}
                        className="w-4 h-4"
                      />
                      <div>
                        <div className="font-medium">Merge into existing data</div>
                        <div className="text-sm text-gray-600">Update existing entries, add new ones</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="insertMode"
                        value="overwrite"
                        checked={insertMode === 'overwrite'}
                        onChange={(e) => setInsertMode(e.target.value as InsertMode)}
                        className="w-4 h-4"
                      />
                      <div>
                        <div className="font-medium">Overwrite existing data</div>
                        <div className="text-sm text-gray-600">Replace data for overlapping dates</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="insertMode"
                        value="new"
                        checked={insertMode === 'new'}
                        onChange={(e) => setInsertMode(e.target.value as InsertMode)}
                        className="w-4 h-4"
                      />
                      <div>
                        <div className="font-medium">Add as new entries only</div>
                        <div className="text-sm text-gray-600">Skip dates that already exist</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSaveData} disabled={isProcessing}>
                    {isProcessing ? 'Saving...' : `Save ${mappedData.length} Entries`}
                  </Button>
                  <Button variant="outline" onClick={exportMergedData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart Preview */}
          {mappedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <DataPreviewChart data={mappedData} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 4: Success */}
      {currentStep === 4 && importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{importResults.added}</div>
                    <div className="text-sm">Added</div>
                  </div>
                  {importResults.replaced > 0 && (
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{importResults.replaced}</div>
                      <div className="text-sm">Updated</div>
                    </div>
                  )}
                  {importResults.skipped > 0 && (
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{importResults.skipped}</div>
                      <div className="text-sm">Skipped</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-gray-600">Your dashboard has been updated with the new data!</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => window.location.reload()}>
                    View Updated Dashboard
                  </Button>
                  <Button variant="outline" onClick={resetUpload}>
                    Upload Another File
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVUploadSteps;
