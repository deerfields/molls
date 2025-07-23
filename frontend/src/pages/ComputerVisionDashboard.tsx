import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import * as d3 from 'd3';
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
import { VisionType, DetectionStatus, ThreatLevel } from '@/types/computer-vision';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  features: VisionType[];
  lastDetection?: Date;
  threatLevel?: ThreatLevel;
}

interface Detection {
  id: string;
  cameraId: string;
  type: VisionType;
  status: DetectionStatus;
  timestamp: Date;
  confidence: number;
  threatLevel?: ThreatLevel;
  facialData?: {
    faceId?: string;
    personId?: string;
    name?: string;
    age?: number;
    gender?: string;
    emotions?: Record<string, number>;
  };
  behaviorData?: {
    action?: string;
    duration?: number;
    riskScore?: number;
  };
  crowdData?: {
    count?: number;
    density?: number;
    flow?: { direction: string; speed: number };
  };
  securityData?: {
    alertType?: string;
    description?: string;
    responseRequired?: boolean;
  };
}

interface SecurityAlert {
  id: string;
  cameraId: string;
  type: VisionType;
  threatLevel: ThreatLevel;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

interface ComputerVisionStats {
  totalCameras: number;
  onlineCameras: number;
  totalDetections: number;
  activeAlerts: number;
  facialRecognitions: number;
  behaviorAnalyses: number;
  crowdAnalyses: number;
  securityIncidents: number;
}

interface ComputerVisionAnalytics {
  detectionsByType: Record<VisionType, number>;
  detectionsByHour: { hour: number; count: number }[];
  threatLevelDistribution: Record<ThreatLevel, number>;
  cameraPerformance: { cameraId: string; detections: number; accuracy: number }[];
  crowdDensityTrends: { timestamp: Date; density: number }[];
  securityIncidents: { timestamp: Date; count: number }[];
}

const ComputerVisionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState<ComputerVisionStats | null>(null);
  const [analytics, setAnalytics] = useState<ComputerVisionAnalytics | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedDetectionType, setSelectedDetectionType] = useState<VisionType | ''>('');
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeAlerts, setRealTimeAlerts] = useState<SecurityAlert[]>([]);
  const heatmapRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Setup Server-Sent Events for real-time alerts
    const eventSource = new EventSource('/api/computer-vision/stream/alerts', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    eventSource.onmessage = (event) => {
      const alert = JSON.parse(event.data);
      setRealTimeAlerts(prev => [alert, ...prev.slice(0, 9)]);
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [camerasRes, detectionsRes, alertsRes, statsRes, analyticsRes] = await Promise.all([
        api.get('/computer-vision/cameras'),
        api.get('/computer-vision/detections'),
        api.get('/computer-vision/alerts'),
        api.get('/computer-vision/status'),
        api.get('/computer-vision/analytics')
      ]);

      setCameras(camerasRes.data);
      setDetections(detectionsRes.data);
      setAlerts(alertsRes.data);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCameraDetections = async (cameraId: string) => {
    try {
      const response = await api.get(`/computer-vision/detections?cameraId=${cameraId}&limit=100`);
      setDetections(response.data);
    } catch (err: any) {
      console.error('Failed to fetch camera detections:', err);
    }
  };

  useEffect(() => {
    if (selectedCamera) {
      fetchCameraDetections(selectedCamera);
    }
  }, [selectedCamera]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await api.post(`/computer-vision/alerts/${alertId}/acknowledge`, {
        response: 'Acknowledged',
        notes: 'Alert acknowledged by operator'
      });
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledgedBy: user?.id, acknowledgedAt: new Date() }
          : alert
      ));
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const verifyDetection = async (detectionId: string, verified: boolean) => {
    try {
      await api.post(`/computer-vision/detections/${detectionId}/verify`, {
        verified,
        notes: verified ? 'Detection verified' : 'False positive'
      });
      
      // Update local state
      setDetections(prev => prev.map(detection => 
        detection.id === detectionId 
          ? { ...detection, status: verified ? DetectionStatus.VERIFIED : DetectionStatus.FALSE_POSITIVE }
          : detection
      ));
    } catch (err: any) {
      console.error('Failed to verify detection:', err);
    }
  };

  const getThreatLevelColor = (level: ThreatLevel) => {
    switch (level) {
      case ThreatLevel.LOW: return 'bg-green-500';
      case ThreatLevel.MEDIUM: return 'bg-yellow-500';
      case ThreatLevel.HIGH: return 'bg-orange-500';
      case ThreatLevel.CRITICAL: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDetectionTypeColor = (type: VisionType) => {
    switch (type) {
      case VisionType.FACIAL_RECOGNITION: return 'bg-blue-500';
      case VisionType.BEHAVIOR_ANALYSIS: return 'bg-purple-500';
      case VisionType.CROWD_ANALYSIS: return 'bg-green-500';
      case VisionType.SECURITY_THREAT: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading && !pulling) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-14">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <span className="text-gray-500 text-sm">Loading Security Dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className="space-y-6 px-2 sm:px-4 py-4"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Computer Vision Security</h1>
          <p className="text-gray-600 text-sm">Real-time security monitoring and AI-powered threat detection</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button onClick={fetchDashboardData} variant="outline" className="w-full sm:w-auto min-h-[44px] min-w-[44px] transition active:scale-95 focus-visible:ring-2">Refresh</Button>
        </div>
      </div>

      {/* Real-time Alerts */}
      {realTimeAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">🚨 Real-time Alerts:</span>
              {realTimeAlerts.map(alert => (
                <Badge key={alert.id} className={getThreatLevelColor(alert.threatLevel) + ' min-h-[32px] min-w-[44px] flex items-center justify-center'}>
                  {alert.message}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
              <Badge variant="outline">{stats.onlineCameras}/{stats.totalCameras} Online</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCameras}</div>
              <Progress value={(stats.onlineCameras / stats.totalCameras) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
              <Badge variant="outline">Last 24h</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDetections}</div>
              <p className="text-xs text-muted-foreground">
                {stats.facialRecognitions} facial, {stats.behaviorAnalyses} behavior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Badge variant="destructive">{alerts.filter(a => !a.acknowledged).length} Unacknowledged</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAlerts}</div>
              <p className="text-xs text-muted-foreground">
                {alerts.filter(a => a.threatLevel === ThreatLevel.CRITICAL).length} critical
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
              <Badge variant="outline">Last 24h</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.securityIncidents}</div>
              <p className="text-xs text-muted-foreground">
                {detections.filter(d => d.threatLevel === ThreatLevel.HIGH || d.threatLevel === ThreatLevel.CRITICAL).length} high threat
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="cameras" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2 w-full">
          <TabsTrigger value="cameras" className="flex-1 min-h-[44px]">Security Cameras</TabsTrigger>
          <TabsTrigger value="detections" className="flex-1 min-h-[44px]">Detections</TabsTrigger>
          <TabsTrigger value="alerts" className="flex-1 min-h-[44px]">Security Alerts</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 min-h-[44px]">Analytics</TabsTrigger>
        </TabsList>

        {/* Cameras Tab */}
        <TabsContent value="cameras" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 mb-4">
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger className="w-full sm:w-48 min-h-[44px]"> <SelectValue placeholder="Select Camera" /> </SelectTrigger>
              <SelectContent>
                {cameras.map(camera => (
                  <SelectItem key={camera.id} value={camera.id}>{camera.name} - {camera.location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.map(camera => (
              <Card key={camera.id} className="cursor-pointer hover:shadow-lg transition-shadow min-h-[64px] active:scale-95 focus-visible:ring-2">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <div>
                      <CardTitle className="text-lg">{camera.name}</CardTitle>
                      <p className="text-sm text-gray-600">{camera.location}</p>
                    </div>
                    <Badge 
                      variant={camera.status === 'online' ? 'default' : 'secondary'}
                      className={(camera.status === 'online' ? 'bg-green-500' : 'bg-gray-500') + ' min-h-[32px] min-w-[44px] flex items-center justify-center'}
                    >
                      {camera.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {camera.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs min-h-[32px] min-w-[44px] flex items-center justify-center">
                          {feature.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    {camera.lastDetection && (
                      <p className="text-xs text-gray-500">
                        Last detection: {new Date(camera.lastDetection).toLocaleString()}
                      </p>
                    )}
                    {camera.threatLevel && (
                      <Badge className={getThreatLevelColor(camera.threatLevel) + ' text-white min-h-[32px] min-w-[44px] flex items-center justify-center'}>
                        {camera.threatLevel} Threat
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Detections Tab */}
        <TabsContent value="detections" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 mb-4">
            <Select value={selectedDetectionType} onValueChange={setSelectedDetectionType}>
              <SelectTrigger className="w-full sm:w-48 min-h-[44px]"> <SelectValue placeholder="Filter by Type" /> </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {Object.values(VisionType).map(type => (
                  <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            {detections
              .filter(d => !selectedDetectionType || d.type === selectedDetectionType)
              .slice(0, 20)
              .map(detection => (
              <Card key={detection.id} className="min-h-[64px] active:scale-95 focus-visible:ring-2 transition">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <div>
                      <CardTitle className="text-lg">
                        {detection.type.replace('_', ' ')} Detection
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Camera: {cameras.find(c => c.id === detection.cameraId)?.name || detection.cameraId}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getDetectionTypeColor(detection.type) + ' min-h-[32px] min-w-[44px] flex items-center justify-center'}>
                        {detection.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant={detection.status === DetectionStatus.VERIFIED ? 'default' : 'secondary'} className="min-h-[32px] min-w-[44px] flex items-center justify-center">
                        {detection.status}
                      </Badge>
                      {detection.threatLevel && (
                        <Badge className={getThreatLevelColor(detection.threatLevel) + ' min-h-[32px] min-w-[44px] flex items-center justify-center'}>
                          {detection.threatLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between text-sm gap-1 sm:gap-0">
                      <span>Confidence: {Math.round(detection.confidence * 100)}%</span>
                      <span>{new Date(detection.timestamp).toLocaleString()}</span>
                    </div>
                    {detection.facialData && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-blue-900">Facial Recognition</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span>Name: {detection.facialData.name || 'Unknown'}</span>
                          <span>Age: {detection.facialData.age || 'N/A'}</span>
                          <span>Gender: {detection.facialData.gender || 'N/A'}</span>
                          <span>Match: {Math.round((detection.facialData.matchConfidence || 0) * 100)}%</span>
                        </div>
                      </div>
                    )}
                    {detection.behaviorData && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-purple-900">Behavior Analysis</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span>Action: {detection.behaviorData.action}</span>
                          <span>Duration: {detection.behaviorData.duration}s</span>
                          <span>Risk Score: {detection.behaviorData.riskScore}/100</span>
                        </div>
                      </div>
                    )}
                    {detection.crowdData && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-green-900">Crowd Analysis</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span>Count: {detection.crowdData.count}</span>
                          <span>Density: {Math.round(detection.crowdData.density || 0)}%</span>
                          <span>Flow: {detection.crowdData.flow?.direction}</span>
                          <span>Speed: {detection.crowdData.flow?.speed}</span>
                        </div>
                      </div>
                    )}
                    {detection.securityData && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-red-900">Security Alert</h4>
                        <p className="text-sm">{detection.securityData.description}</p>
                        {detection.securityData.responseRequired && (
                          <Badge variant="destructive" className="mt-2 min-h-[32px] min-w-[44px] flex items-center justify-center">Response Required</Badge>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => verifyDetection(detection.id, true)}
                        disabled={detection.status === DetectionStatus.VERIFIED}
                        className="min-h-[44px] min-w-[44px] transition active:scale-95 focus-visible:ring-2"
                      >
                        Verify
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => verifyDetection(detection.id, false)}
                        disabled={detection.status === DetectionStatus.FALSE_POSITIVE}
                        className="min-h-[44px] min-w-[44px] transition active:scale-95 focus-visible:ring-2"
                      >
                        False Positive
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id} className={(alert.acknowledged ? 'opacity-75' : '') + ' min-h-[64px]'}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <div>
                      <CardTitle className="text-lg">{alert.message}</CardTitle>
                      <p className="text-sm text-gray-600">
                        Camera: {cameras.find(c => c.id === alert.cameraId)?.name || alert.cameraId}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getThreatLevelColor(alert.threatLevel) + ' min-h-[32px] min-w-[44px] flex items-center justify-center'}>
                        {alert.threatLevel}
                      </Badge>
                      <Badge variant={alert.acknowledged ? 'secondary' : 'destructive'} className="min-h-[32px] min-w-[44px] flex items-center justify-center">
                        {alert.acknowledged ? 'Acknowledged' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between text-sm gap-1 sm:gap-0">
                      <span>Type: {alert.type.replace('_', ' ')}</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    {alert.acknowledged && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">
                          Acknowledged by {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt!).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {!alert.acknowledged && (
                      <Button 
                        size="sm" 
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="bg-green-600 hover:bg-green-700 min-h-[44px] min-w-[44px] transition active:scale-95 focus-visible:ring-2"
                      >
                        Acknowledge Alert
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* Detection Types Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Detections by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-48 sm:h-64 overflow-x-auto">
                    <Doughnut
                      data={{
                        labels: Object.keys(analytics.detectionsByType).map(key => key.replace('_', ' ')),
                        datasets: [{
                          data: Object.values(analytics.detectionsByType),
                          backgroundColor: [
                            '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
                            '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
                          ]
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Detections by Hour */}
              <Card>
                <CardHeader>
                  <CardTitle>Detections by Hour (Last 24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-48 sm:h-64 overflow-x-auto">
                    <Line
                      data={{
                        labels: analytics.detectionsByHour.map(d => `${d.hour}:00`),
                        datasets: [{
                          label: 'Detections',
                          data: analytics.detectionsByHour.map(d => d.count),
                          borderColor: '#3B82F6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          fill: true
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Threat Level Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Threat Level Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-48 sm:h-64 overflow-x-auto">
                    <Bar
                      data={{
                        labels: Object.keys(analytics.threatLevelDistribution).map(key => key.toUpperCase()),
                        datasets: [{
                          label: 'Incidents',
                          data: Object.values(analytics.threatLevelDistribution),
                          backgroundColor: [
                            '#10B981', '#F59E0B', '#F97316', '#EF4444'
                          ]
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Camera Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Camera Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.cameraPerformance.map(camera => (
                      <div key={camera.cameraId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg min-h-[44px]">
                        <div>
                          <p className="font-medium">
                            {cameras.find(c => c.id === camera.cameraId)?.name || camera.cameraId}
                          </p>
                          <p className="text-sm text-gray-600">
                            {camera.detections} detections, {Math.round(camera.accuracy * 100)}% accuracy
                          </p>
                        </div>
                        <Progress value={camera.accuracy * 100} className="w-full sm:w-32 mt-2 sm:mt-0" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComputerVisionDashboard; 