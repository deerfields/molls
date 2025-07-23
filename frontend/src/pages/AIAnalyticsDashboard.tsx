/**
 * MallOS Enterprise - AI Analytics Dashboard
 * Machine learning model management and predictive analytics
 */

import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { ModelType, ModelStatus, ModelFramework } from '@/types/ai';
import { PredictionType, PredictionStatus } from '@/types/prediction';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AIModel {
  id: string;
  name: string;
  version: string;
  type: ModelType;
  framework: ModelFramework;
  status: ModelStatus;
  description?: string;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    mae?: number;
  };
  isProduction: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AIPrediction {
  id: string;
  modelId: string;
  type: PredictionType;
  status: PredictionStatus;
  timestamp: Date;
  predictionDate?: Date;
  input: {
    features: Record<string, any>;
  };
  output: {
    prediction: any;
    confidence?: number;
    probability?: number;
  };
  accuracy?: {
    actualValue?: any;
    error?: number;
    accuracy?: number;
  };
  recommendations?: {
    actions?: string[];
    priority?: string;
    impact?: string;
    confidence?: number;
  };
}

interface AIStats {
  totalModels: number;
  activeModels: number;
  inactiveModels: number;
  totalPredictions: number;
  todayPredictions: number;
  loadedModels: number;
  activeTrainingJobs: number;
}

interface AIAnalytics {
  modelPerformance: {
    averageAccuracy: number;
    bestModel: string;
    worstModel: string;
  };
  predictions: {
    total: number;
    successful: number;
    failed: number;
    accuracy: number;
  };
  insights: string[];
}

const AIAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [models, setModels] = useState<AIModel[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [analytics, setAnalytics] = useState<AIAnalytics | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedPredictionType, setSelectedPredictionType] = useState<PredictionType | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueForecast, setRevenueForecast] = useState<any[]>([]);
  const [customerBehavior, setCustomerBehavior] = useState<any>(null);

  const pullRef = useRef<HTMLDivElement>(null)
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPulling(true)
      setPullDistance(0)
    }
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (pulling) {
      const dist = Math.min(e.touches[0].clientY - e.targetTouches[0].clientY, 80)
      setPullDistance(dist > 0 ? dist : 0)
    }
  }
  const handleTouchEnd = () => {
    if (pulling && pullDistance > 40) {
      fetchDashboardData()
    }
    setPulling(false)
    setPullDistance(0)
  }

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch models
      const modelsResponse = await api.get('/ai/models');
      setModels(modelsResponse.data.data);

      // Fetch predictions
      const predictionsResponse = await api.get('/ai/predictions');
      setPredictions(predictionsResponse.data.data);

      // Fetch statistics
      const statsResponse = await api.get('/ai/status');
      setStats(statsResponse.data.data);

      // Fetch analytics
      const analyticsResponse = await api.get('/ai/analytics');
      setAnalytics(analyticsResponse.data.data.analytics);

    } catch (err) {
      setError('Failed to load AI dashboard data');
      console.error('AI dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRevenueForecast = async () => {
    try {
      const response = await api.post('/ai/forecast/revenue', {
        mallId: user.mallId,
        days: 30
      });
      setRevenueForecast(response.data.data);
    } catch (err) {
      console.error('Revenue forecast error:', err);
    }
  };

  const analyzeCustomerBehavior = async () => {
    try {
      const response = await api.post('/ai/analytics/customer-behavior', {
        mallId: user.mallId
      });
      setCustomerBehavior(response.data.data);
    } catch (err) {
      console.error('Customer behavior analysis error:', err);
    }
  };

  const detectAnomalies = async () => {
    try {
      const response = await api.post('/ai/anomalies', {
        mallId: user.mallId,
        sensorType: 'temperature'
      });
      console.log('Anomalies detected:', response.data.data);
    } catch (err) {
      console.error('Anomaly detection error:', err);
    }
  };

  // Chart configurations
  const modelPerformanceData = {
    labels: models.map(m => m.name),
    datasets: [
      {
        label: 'Accuracy',
        data: models.map(m => m.metrics.accuracy || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      },
      {
        label: 'F1 Score',
        data: models.map(m => m.metrics.f1Score || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1
      }
    ]
  };

  const predictionStatusData = {
    labels: ['Completed', 'Processing', 'Failed', 'Pending'],
    datasets: [
      {
        data: [
          predictions.filter(p => p.status === 'completed').length,
          predictions.filter(p => p.status === 'processing').length,
          predictions.filter(p => p.status === 'failed').length,
          predictions.filter(p => p.status === 'pending').length
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 205, 86)',
          'rgb(255, 99, 132)',
          'rgb(153, 102, 255)'
        ],
        borderWidth: 1
      }
    ]
  };

  const modelTypeData = {
    labels: Object.values(ModelType),
    datasets: [
      {
        label: 'Models',
        data: Object.values(ModelType).map(type => 
          models.filter(m => m.type === type).length
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }
    ]
  };

  const revenueForecastData = {
    labels: revenueForecast.map((_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Revenue Forecast',
        data: revenueForecast.map(p => p.output.prediction),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'AI Analytics'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const getStatusColor = (status: ModelStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-500';
      case 'deprecated': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getModelTypeIcon = (type: ModelType) => {
    switch (type) {
      case 'prediction': return '🔮';
      case 'classification': return '🏷️';
      case 'anomaly_detection': return '⚠️';
      case 'computer_vision': return '👁️';
      case 'nlp': return '💬';
      case 'recommendation': return '💡';
      case 'forecasting': return '📈';
      default: return '🤖';
    }
  };

  const getFrameworkIcon = (framework: ModelFramework) => {
    switch (framework) {
      case 'tensorflow': return '🧠';
      case 'pytorch': return '🔥';
      case 'scikit_learn': return '🔬';
      case 'opencv': return '📷';
      case 'face_api': return '👤';
      case 'custom': return '⚙️';
      default: return '🔧';
    }
  };

  if (isLoading && !pulling) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-14">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <span className="text-gray-500 text-sm">Loading AI Analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className="container mx-auto px-2 sm:px-4 py-4 space-y-6"
      ref={pullRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div className={`flex justify-center items-center transition-all duration-200 ${pulling || isLoading ? 'h-10 opacity-100' : 'h-0 opacity-0'}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Analytics Dashboard</h1>
          <p className="text-gray-600 text-sm">Machine learning models and predictive analytics</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button onClick={fetchDashboardData} variant="outline" className="w-full sm:w-auto min-h-[44px] min-w-[44px] transition active:scale-95 focus-visible:ring-2">Refresh</Button>
          <Button onClick={generateRevenueForecast} variant="outline" className="w-full sm:w-auto min-h-[44px] min-w-[44px] transition active:scale-95 focus-visible:ring-2">Generate Forecast</Button>
          <Button onClick={analyzeCustomerBehavior} variant="outline" className="w-full sm:w-auto min-h-[44px] min-w-[44px] transition active:scale-95 focus-visible:ring-2">Analyze Behavior</Button>
          <Button onClick={detectAnomalies} variant="outline" className="w-full sm:w-auto min-h-[44px] min-w-[44px] transition active:scale-95 focus-visible:ring-2">Detect Anomalies</Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Models</CardTitle>
            <span className="text-2xl">🤖</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalModels || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeModels || 0} active, {stats?.inactiveModels || 0} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Predictions</CardTitle>
            <span className="text-2xl">🔮</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayPredictions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total: {stats?.totalPredictions || 0} predictions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loaded Models</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.loadedModels || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTrainingJobs || 0} training jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediction Accuracy</CardTitle>
            <span className="text-2xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.predictions.accuracy ? Math.round(analytics.predictions.accuracy * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.predictions.successful || 0} successful predictions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 w-full">
          <TabsTrigger value="overview" className="flex-1 min-h-[44px]">Overview</TabsTrigger>
          <TabsTrigger value="models" className="flex-1 min-h-[44px]">Models</TabsTrigger>
          <TabsTrigger value="predictions" className="flex-1 min-h-[44px]">Predictions</TabsTrigger>
          <TabsTrigger value="insights" className="flex-1 min-h-[44px]">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-48 sm:h-64 overflow-x-auto">
                  <Bar data={modelPerformanceData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Prediction Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-48 sm:h-64 overflow-x-auto">
                  <Doughnut data={predictionStatusData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Model Types and Revenue Forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-48 sm:h-64 overflow-x-auto">
                  <Bar data={modelTypeData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-48 sm:h-64 overflow-x-auto">
                  <Line data={revenueForecastData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.insights && analytics.insights.length > 0 ? (
                <div className="space-y-4">
                  {analytics.insights.map((insight, index) => (
                    <Alert key={index}>
                      <AlertDescription>{insight}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No insights available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          {/* Model Management */}
          <Card>
            <CardHeader>
              <CardTitle>AI Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.map(model => (
                  <Card key={model.id} className="cursor-pointer hover:shadow-lg transition-shadow min-h-[64px] active:scale-95 focus-visible:ring-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getModelTypeIcon(model.type)}</span>
                          <div>
                            <CardTitle className="text-sm">{model.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">v{model.version}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(model.status) + ' min-h-[32px] min-w-[44px] flex items-center justify-center'}>{model.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Framework:</span>
                          <span className="flex items-center space-x-1">
                            <span>{getFrameworkIcon(model.framework)}</span>
                            <span className="capitalize">{model.framework}</span>
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Type:</span>
                          <span className="capitalize">{model.type.replace('_', ' ')}</span>
                        </div>
                        {model.metrics.accuracy && (
                          <div className="flex justify-between text-xs">
                            <span>Accuracy:</span>
                            <span>{Math.round(model.metrics.accuracy * 100)}%</span>
                          </div>
                        )}
                        {model.isProduction && (
                          <Badge variant="default" className="text-xs">
                            Production
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 overflow-x-auto min-w-[300px]">
                {predictions.slice(0, 10).map(prediction => (
                  <Card key={prediction.id} className="p-4 min-h-[64px] active:scale-95 focus-visible:ring-2 transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="min-h-[32px] min-w-[44px] flex items-center justify-center">
                            {prediction.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant={prediction.status === 'completed' ? 'default' : 'secondary'} className="min-h-[32px] min-w-[44px] flex items-center justify-center">
                            {prediction.status}
                          </Badge>
                        </div>
                        <p className="text-sm">
                          Prediction: {typeof prediction.output.prediction === 'number' 
                            ? prediction.output.prediction.toFixed(2)
                            : prediction.output.prediction}
                        </p>
                        {prediction.output.confidence && (
                          <p className="text-xs text-muted-foreground">
                            Confidence: {Math.round(prediction.output.confidence * 100)}%
                          </p>
                        )}
                        {prediction.recommendations && prediction.recommendations.actions && (
                          <div className="mt-2">
                            <p className="text-xs font-medium">Recommendations:</p>
                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                              {prediction.recommendations.actions.slice(0, 2).map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(prediction.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Customer Behavior Analysis */}
          {customerBehavior && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Behavior Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {customerBehavior.clusters?.map((cluster: any, index: number) => (
                      <Card key={index} className="p-4 min-h-[64px]">
                        <h4 className="font-medium">{cluster.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Size: {Math.round(cluster.size * 100)}%
                        </p>
                        <ul className="text-xs text-muted-foreground mt-2">
                          {cluster.characteristics?.map((char: string, i: number) => (
                            <li key={i}>• {char}</li>
                          ))}
                        </ul>
                      </Card>
                    ))}
                  </div>
                  {customerBehavior.insights && (
                    <div>
                      <h4 className="font-medium mb-2">Key Insights</h4>
                      <ul className="space-y-1">
                        {customerBehavior.insights.map((insight: string, index: number) => (
                          <li key={index} className="text-sm">• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {customerBehavior.recommendations && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {customerBehavior.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Model Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.modelPerformance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {Math.round(analytics.modelPerformance.averageAccuracy * 100)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Average Accuracy</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium">
                        {analytics.modelPerformance.bestModel}
                      </div>
                      <p className="text-sm text-muted-foreground">Best Performing Model</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium">
                        {analytics.modelPerformance.worstModel}
                      </div>
                      <p className="text-sm text-muted-foreground">Needs Improvement</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No performance data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalyticsDashboard; 