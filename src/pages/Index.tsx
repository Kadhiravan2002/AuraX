import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import AuthPage from '@/components/auth/AuthPage';
import Dashboard from '@/components/Dashboard';
import HealthLogForm from '@/components/HealthLogForm';
import CSVUpload from '@/components/CSVUpload';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Crown, Settings, Upload } from 'lucide-react';

const Index = () => {
  const { user, session, loading, signOut } = useAuth();
  const { subscription } = useSubscription();
  const { isPremium, checkFeatureAccess, hasWhitelistAccess, getPremiumAccessType } = usePremiumFeatures();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'dashboard' | 'log' | 'csv'>('dashboard');
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if user is not authenticated
  if (!user || !session) {
    return <AuthPage />;
  }

  const renderPremiumBadge = () => {
    if (!isPremium) return null;
    
    const accessType = getPremiumAccessType();
    
    if (accessType === 'whitelist') {
      return (
        <Badge className="bg-gradient-to-r from-purple-400 to-pink-500 text-white text-xs">
          <Crown className="w-3 h-3 mr-1" />
          Premium (Test Access)
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
        <Crown className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    );
  };

  const handleStartCSVUpload = () => {
    setCurrentView('csv');
  };

  const handleStartManualEntry = () => {
    setCurrentView('log');
  };

  const handleDataUploadSuccess = () => {
    console.log('Data upload successful, refreshing dashboard');
    setDashboardRefreshTrigger(prev => prev + 1);
    setCurrentView('dashboard');
  };

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <div className="relative">
                  <img 
                    src="/lovable-uploads/809c6650-cb5d-4f7c-a284-48e1fd16dbd7.png" 
                    alt="AuraX Logo" 
                    className="h-8 w-8 rounded-xl shadow-lg bg-gradient-to-br from-cyan-100 to-purple-100 p-1.5 border border-white/30 backdrop-blur-sm"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-400/20 blur-sm -z-10"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
                    AuraX
                  </h1>
                  {renderPremiumBadge()}
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'dashboard'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {checkFeatureAccess('fullDashboard') ? 'Dashboard' : 'Basic Dashboard'}
                  </button>
                  <button
                    onClick={() => setCurrentView('log')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'log'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Log Health Data
                  </button>
                  <button
                    onClick={() => setCurrentView('csv')}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                      currentView === 'csv'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    CSV Upload
                    {!checkFeatureAccess('csvUpload') && (
                      <Crown className="w-3 h-3 ml-1 text-amber-500" />
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/billing')}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Billing
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {subscription && !hasWhitelistAccess && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    isPremium ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                </Badge>
              )}
              {hasWhitelistAccess && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                  Test Account
                </Badge>
              )}
              <span className="text-sm text-gray-700">
                Welcome, {userName}
              </span>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentView === 'dashboard' && (
          <Dashboard 
            onStartCSVUpload={handleStartCSVUpload}
            onStartManualEntry={handleStartManualEntry}
            userName={userName}
            refreshTrigger={dashboardRefreshTrigger}
          />
        )}
        {currentView === 'log' && (
          <HealthLogForm onDataSaved={handleDataUploadSuccess} />
        )}
        {currentView === 'csv' && (
          <CSVUpload onUploadSuccess={handleDataUploadSuccess} />
        )}
      </main>
    </div>
  );
};

export default Index;
