
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, PenTool, Sparkles } from 'lucide-react';

interface NewUserWelcomeProps {
  userName: string;
  onStartCSVUpload: () => void;
  onStartManualEntry: () => void;
}

const NewUserWelcome = ({ userName, onStartCSVUpload, onStartManualEntry }: NewUserWelcomeProps) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-2xl w-full mx-4 bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
            🎉 Welcome to AuraX, {userName}!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-6">
              You haven't added any data yet. Start by:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={onStartCSVUpload}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Upload your first CSV</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import your existing health data from a CSV file
                </p>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  📄 Upload CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={onStartManualEntry}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <PenTool className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Manual entry</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Start tracking by entering today's health info
                </p>
                <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                  ✍️ Enter Data
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">What you can track:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="mr-2">😴</span> Sleep hours
              </div>
              <div className="flex items-center">
                <span className="mr-2">💧</span> Water intake
              </div>
              <div className="flex items-center">
                <span className="mr-2">👟</span> Steps
              </div>
              <div className="flex items-center">
                <span className="mr-2">🍎</span> Calories
              </div>
              <div className="flex items-center">
                <span className="mr-2">😊</span> Mood
              </div>
              <div className="flex items-center">
                <span className="mr-2">💪</span> Stress level
              </div>
              <div className="flex items-center">
                <span className="mr-2">⚡</span> Energy
              </div>
              <div className="flex items-center">
                <span className="mr-2">🏃</span> Exercise
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewUserWelcome;
