
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, ArrowRight, Download, Save, History } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCSVMappings } from '@/hooks/useCSVMappings';
import DataPreviewChart from './DataPreviewChart';

interface CSVRow {
  [key: string]: string;
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

const REQUIRED_FIELDS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'mood', label: 'Mood (1-10)', type: 'number' },
  { key: 'energy', label: 'Energy (1-10)', type: 'number' },
  { key: 'sleep_hours', label: 'Sleep Hours', type: 'number' },
  { key: 'exercise_minutes', label: 'Exercise Minutes', type: 'number' },
  { key: 'stress_level', label: 'Stress Level (1-10)', type: 'number' },
  { key: 'water_intake', label: 'Water Intake (glasses)', type: 'number' }
];

const CSVUploadSteps = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [mappedData, setMappedData] = useState<MappedData[]>([]);
  const [dataSummary, setDataSummary] = useState<any>(null);
  const [insertChoice, setInsertChoice] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { savedMappings, saveMapping, findSimilarMapping } = useCSVMappings();

  const parseCSV = (text: string): { headers: string[], data: CSVRow[] } => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: CSVRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: CSVRow = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return { headers, data };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || selectedFile.type !== 'text/csv') {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file',
        variant: 'destructive'
      });
      return;
    }

    try {
      const text = await selectedFile.text();
      const { headers, data } = parseCSV(text);
      
      setFile(selectedFile);
      setCsvHeaders(headers);
      setCsvData(data);
      setCurrentStep(2);
      
      // Try to find similar mapping first
      const similarMapping = findSimilarMapping(headers);
      if (similarMapping) {
        setColumnMapping(similarMapping.mapping);
        toast({
          title: 'Mapping loaded!',
          description: `Using similar mapping: ${similarMapping.name}`,
        });
        return;
      }
      
      // Auto-detect mappings based on common column names
      const autoMapping: ColumnMapping = {};
      REQUIRED_FIELDS.forEach(field => {
        const matchingHeader = headers.find(header => 
          header.toLowerCase().includes(field.key.toLowerCase()) ||
          header.toLowerCase().replace('_', ' ').includes(field.label.toLowerCase().split(' ')[0])
        );
        if (matchingHeader) {
          autoMapping[field.key] = matchingHeader;
        }
      });
      setColumnMapping(autoMapping);
      
    } catch (error) {
      toast({
        title: 'Error parsing CSV',
        description: 'Could not read the CSV file',
        variant: 'destructive'
      });
    }
  };

  const handleSaveMapping = () => {
    const mappingName = prompt('Enter a name for this column mapping:');
    if (mappingName && Object.keys(columnMapping).length > 0) {
      saveMapping(mappingName, columnMapping, csvHeaders);
      toast({
        title: 'Mapping saved!',
        description: `Column mapping "${mappingName}" has been saved for future use.`,
      });
    }
  };

  const handleColumnMapping = () => {
    // Validate all required fields are mapped
    const missingMappings = REQUIRED_FIELDS.filter(field => !columnMapping[field.key]);
    if (missingMappings.length > 0) {
      toast({
        title: 'Missing mappings',
        description: `Please map: ${missingMappings.map(f => f.label).join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Transform data based on mappings
    const transformed: MappedData[] = [];
    const errors: string[] = [];
    
    csvData.forEach((row, index) => {
      try {
        const mappedRow: any = {};
        
        REQUIRED_FIELDS.forEach(field => {
          const csvColumn = columnMapping[field.key];
          const value = row[csvColumn];
          
          if (!value || value.trim() === '') {
            throw new Error(`Missing ${field.label} in row ${index + 1}`);
          }
          
          if (field.type === 'number') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              throw new Error(`Invalid ${field.label} in row ${index + 1}: ${value}`);
            }
            mappedRow[field.key] = numValue;
          } else {
            mappedRow[field.key] = value;
          }
        });
        
        transformed.push(mappedRow);
      } catch (error: any) {
        errors.push(error.message);
      }
    });
    
    if (errors.length > 0 && errors.length === csvData.length) {
      toast({
        title: 'Data validation failed',
        description: `All rows have issues. Please check your column mappings.`,
        variant: 'destructive'
      });
      return;
    }
    
    setMappedData(transformed);
    
    // Generate summary
    const uniqueDates = new Set(transformed.map(d => d.date));
    const duplicates = csvData.length - transformed.length;
    const summary = {
      totalRows: transformed.length,
      duplicates,
      uniqueDates: uniqueDates.size,
      dateRange: {
        start: Math.min(...transformed.map(d => new Date(d.date).getTime())),
        end: Math.max(...transformed.map(d => new Date(d.date).getTime()))
      },
      averages: {
        mood: (transformed.reduce((sum, d) => sum + d.mood, 0) / transformed.length).toFixed(1),
        energy: (transformed.reduce((sum, d) => sum + d.energy, 0) / transformed.length).toFixed(1),
        sleep: (transformed.reduce((sum, d) => sum + d.sleep_hours, 0) / transformed.length).toFixed(1)
      }
    };
    
    setDataSummary(summary);
    setCurrentStep(3);
    
    if (errors.length > 0) {
      toast({
        title: 'Some rows skipped',
        description: `${errors.length} rows had issues and were skipped.`,
        variant: 'destructive'
      });
    }
  };

  const handleInsertData = async () => {
    if (!insertChoice) return;
    
    setProcessing(true);
    setCurrentStep(4);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Here you would implement the actual data insertion logic based on insertChoice
      console.log('Insert choice:', insertChoice);
      console.log('Data to insert:', mappedData);
      
      toast({
        title: '✅ Data uploaded successfully!',
        description: `${mappedData.length} entries added to your dashboard`,
      });
      
      setCurrentStep(5);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Could not save your data',
        variant: 'destructive'
      });
      setCurrentStep(3);
    } finally {
      setProcessing(false);
    }
  };

  const exportMergedData = () => {
    const csv = [
      REQUIRED_FIELDS.map(f => f.key).join(','),
      ...mappedData.map(row => 
        REQUIRED_FIELDS.map(f => row[f.key as keyof MappedData]).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aurax-health-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setCurrentStep(1);
    setFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setMappedData([]);
    setDataSummary(null);
    setInsertChoice('');
    setShowPreview(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Advanced CSV Health Data Import
          </CardTitle>
          <div className="space-y-2">
            <Progress value={(currentStep / 5) * 100} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Step {currentStep} of 5</span>
              <span>{Math.round((currentStep / 5) * 100)}% Complete</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>📥 Step 1: Upload Your CSV File</CardTitle>
            <CardDescription>
              Upload your health data CSV file. We'll automatically detect the structure and suggest mappings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto mb-4"
              />
              <p className="text-sm text-gray-500 mb-2">
                Select a CSV file with your health data
              </p>
              {savedMappings.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <History className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-600">
                    {savedMappings.length} saved mapping{savedMappings.length !== 1 ? 's' : ''} available
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>🔁 Step 2: Map Your Columns</CardTitle>
            <CardDescription>
              Match your CSV columns to our internal fields for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Preview first few rows */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Preview (first 5 rows):</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border rounded">
                    <thead className="bg-gray-50">
                      <tr>
                        {csvHeaders.map(header => (
                          <th key={header} className="px-3 py-2 text-left border-r">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t">
                          {csvHeaders.map(header => (
                            <td key={header} className="px-3 py-2 border-r">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Column Mapping Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REQUIRED_FIELDS.map(field => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      {field.label}
                      <Badge variant="secondary" className="text-xs">
                        {field.type}
                      </Badge>
                    </label>
                    <Select
                      value={columnMapping[field.key] || ''}
                      onValueChange={(value) => setColumnMapping(prev => ({
                        ...prev,
                        [field.key]: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={handleSaveMapping} variant="outline" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Mapping
                </Button>
                <Button onClick={handleColumnMapping} className="flex-1">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Analyze & Clean Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Data Summary & Insert Choice */}
      {currentStep === 3 && dataSummary && (
        <Card>
          <CardHeader>
            <CardTitle>🧠 Step 3: Data Analysis Complete</CardTitle>
            <CardDescription>
              Your data has been cleaned and analyzed. Choose how to save it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Data Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dataSummary.totalRows}</div>
                  <div className="text-sm text-gray-600">Valid Entries</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dataSummary.uniqueDates}</div>
                  <div className="text-sm text-gray-600">Unique Days</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{dataSummary.averages.mood}</div>
                  <div className="text-sm text-gray-600">Avg Mood</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{dataSummary.averages.energy}</div>
                  <div className="text-sm text-gray-600">Avg Energy</div>
                </div>
              </div>

              {dataSummary.duplicates > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    ⚠️ {dataSummary.duplicates} rows were skipped due to missing or invalid data
                  </p>
                </div>
              )}

              {/* Insert Options */}
              <div className="space-y-4">
                <h4 className="font-medium">Where would you like to insert this data?</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="insertChoice"
                      value="merge"
                      checked={insertChoice === 'merge'}
                      onChange={(e) => setInsertChoice(e.target.value)}
                    />
                    <div>
                      <div className="font-medium">🔄 Merge into existing dashboard</div>
                      <div className="text-sm text-gray-500">Add to your current health data</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="insertChoice"
                      value="new"
                      checked={insertChoice === 'new'}
                      onChange={(e) => setInsertChoice(e.target.value)}
                    />
                    <div>
                      <div className="font-medium">➕ Create new dashboard section</div>
                      <div className="text-sm text-gray-500">Keep this data separate</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="insertChoice"
                      value="overwrite"
                      checked={insertChoice === 'overwrite'}
                      onChange={(e) => setInsertChoice(e.target.value)}
                    />
                    <div>
                      <div className="font-medium">⚠️ Overwrite overlapping dates</div>
                      <div className="text-sm text-gray-500">Replace existing data for same dates</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowPreview(true)}
                  variant="outline"
                  className="flex-1"
                >
                  📊 Preview Charts
                </Button>
                <Button 
                  onClick={handleInsertData}
                  disabled={!insertChoice}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Processing */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>⏳ Processing Your Data...</CardTitle>
            <CardDescription>
              Saving and analyzing your health data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Please wait while we process your data...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Success */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              ✅ Upload Complete!
            </CardTitle>
            <CardDescription>
              Your health data has been successfully imported and analyzed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">
                  🎉 {mappedData.length} new entries added. Your trends are up to date!
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={exportMergedData} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export Merged Data
                </Button>
                <Button onClick={() => window.location.href = '/'} className="flex-1">
                  View Dashboard
                </Button>
              </div>
              
              <Button onClick={resetUpload} variant="outline" className="w-full mt-4">
                Upload Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📊 Data Preview Charts</DialogTitle>
            <DialogDescription>
              Preview of your health data trends before saving
            </DialogDescription>
          </DialogHeader>
          <DataPreviewChart data={mappedData} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CSVUploadSteps;
