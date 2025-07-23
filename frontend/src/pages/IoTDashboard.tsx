/**
 * MallOS Enterprise - IoT Dashboard
 * Real-time IoT data visualization and device monitoring
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
import { DeviceType, DeviceStatus } from '@/types/iot';
import { SensorType } from '@/types/sensor';

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

interface IoTDevice {
  id: string;
  deviceId: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location: {
    area?: string;
    floor?: string;
    coordinates?: { lat: number; lng: number };
  };
  lastSeen?: Date;
  lastData?: any;
}

interface SensorData {
  id: string;
  deviceId: string;
  sensorType: SensorType;
  timestamp: Date;
  data: {
    value: number;
    unit?: string;
  };
  quality: string;
  alerts?: {
    triggered: boolean;
    severity: string;
    message: string;
  };
}

interface IoTStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalReadings: number;
  todayReadings: number;
  uptime: number;
  mqttConnected: boolean;
}

interface SensorAnalytics {
  temperature: {
    average: number;
    min: number;
    max: number;
    trend: string;
  };
  humidity: {
    average: number;
    min: number;
    max: number;
    trend: string;
  };
  occupancy: {
    average: number;
    peak: number;
    trend: string;
  };
}

const IoTDashboard: React.FC = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [stats, setStats] = useState<IoTStats | null>(null);
  const [analytics, setAnalytics] = useState<SensorAnalytics | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedSensorType, setSelectedSensorType] = useState<SensorType | ''>('');
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeData, setRealTimeData] = useState<SensorData[]>([]);
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

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Set up real-time data stream
  useEffect(() => {
    const eventSource = new EventSource('/api/iot/data/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sensor_data') {
        setRealTimeData(prev => [data.data, ...prev.slice(0, 99)]);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Real-time data stream error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch devices
      const devicesResponse = await api.get('/iot/devices');
      setDevices(devicesResponse.data.data);

      // Fetch statistics
      const statsResponse = await api.get('/iot/status');
      setStats(statsResponse.data.data);

      // Fetch analytics
      const analyticsResponse = await api.get('/iot/analytics');
      setAnalytics(analyticsResponse.data.data.sensorAnalytics);

      // Fetch recent sensor data
      const dataResponse = await api.get('/iot/devices/data', {
        params: { limit: 100 }
      });
      setSensorData(dataResponse.data.data);

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeviceData = async (deviceId: string) => {
    try {
      const response = await api.get(`/iot/devices/${deviceId}/data`, {
        params: {
          sensorType: selectedSensorType || undefined,
          limit: 1000
        }
      });
      setSensorData(response.data.data);
    } catch (err) {
      console.error('Device data fetch error:', err);
    }
  };

  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceData(selectedDevice);
    }
  }, [selectedDevice, selectedSensorType]);

  // Chart configurations
  const temperatureChartData = {
    labels: sensorData.slice(-20).map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: sensorData
          .filter(d => d.sensorType === 'temperature')
          .slice(-20)
          .map(d => d.data.value),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const humidityChartData = {
    labels: sensorData.slice(-20).map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Humidity (%)',
        data: sensorData
          .filter(d => d.sensorType === 'humidity')
          .slice(-20)
          .map(d => d.data.value),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const occupancyChartData = {
    labels: sensorData.slice(-20).map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Occupancy Count',
        data: sensorData
          .filter(d => d.sensorType === 'occupancy')
          .slice(-20)
          .map(d => d.data.value),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      }
    ]
  };

  const deviceStatusData = {
    labels: ['Online', 'Offline', 'Maintenance', 'Error'],
    datasets: [
      {
        data: [
          stats?.onlineDevices || 0,
          stats?.offlineDevices || 0,
          devices.filter(d => d.status === 'maintenance').length,
          devices.filter(d => d.status === 'error').length
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 99, 132)',
          'rgb(255, 205, 86)',
          'rgb(255, 159, 64)'
        ],
        borderWidth: 1
      }
    ]
  };

  const sensorTypeData = {
    labels: Object.values(SensorType),
    datasets: [
      {
        label: 'Data Points',
        data: Object.values(SensorType).map(type => 
          sensorData.filter(d => d.sensorType === type).length
        ),
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1
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
        text: 'Real-time Sensor Data'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // D3.js Heatmap
  useEffect(() => {
    if (heatmapRef.current && devices.length > 0) {
      const width = 600;
      const height = 400;
      const margin = { top: 20, right: 20, bottom: 30, left: 40 };

      // Clear previous content
      d3.select(heatmapRef.current).selectAll('*').remove();

      const svg = d3.select(heatmapRef.current)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      // Create heatmap data
      const heatmapData = devices.map((device, i) => ({
        x: i % 10,
        y: Math.floor(i / 10),
        value: device.status === 'online' ? 1 : 0,
        device: device
      }));

      const xScale = d3.scaleLinear()
        .domain([0, 9])
        .range([margin.left, width - margin.right]);

      const yScale = d3.scaleLinear()
        .domain([0, Math.ceil(devices.length / 10) - 1])
        .range([margin.top, height - margin.bottom]);

      const colorScale = d3.scaleSequential()
        .domain([0, 1])
        .interpolator(d3.interpolateRdYlGn);

      // Add heatmap cells
      svg.selectAll('rect')
        .data(heatmapData)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.x))
        .attr('y', d => yScale(d.y))
        .attr('width', 50)
        .attr('height', 50)
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('opacity', 0.7);
          // Show tooltip
          svg.append('text')
            .attr('class', 'tooltip')
            .attr('x', xScale(d.x) + 25)
            .attr('y', yScale(d.y) - 5)
            .attr('text-anchor', 'middle')
            .attr('fill', 'black')
            .text(d.device.name);
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 1);
          svg.selectAll('.tooltip').remove();
        });

      // Add axes
      svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

      svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
    }
  }, [devices]);

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getDeviceTypeIcon = (type: DeviceType) => {
    switch (type) {
      case 'sensor': return '📡';
      case 'camera': return '📹';
      case 'controller': return '🎛️';
      case 'gateway': return '🌐';
      case 'actuator': return '⚙️';
      default: return '📱';
    }
  };

  if (isLoading && !pulling) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-14">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <span className="text-gray-500 text-sm">Loading IoT Dashboard...</span>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">IoT Dashboard</h1>
          <p className="text-gray-600 text-sm">Real-time monitoring and analytics</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button onClick={fetchDashboardData} variant="outline" className="w-full sm:w-auto min-h-[44px] min-w-[44px] transition active:scale-95 focus-visible:ring-2">Refresh</Button>
          <Badge variant={stats?.mqttConnected ? 'default' : 'destructive'} className="min-h-[32px] min-w-[44px] flex items-center justify-center">{stats?.mqttConnected ? 'MQTT Connected' : 'MQTT Disconnected'}</Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <span className="text-2xl">📱</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDevices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.onlineDevices || 0} online, {stats?.offlineDevices || 0} offline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Readings</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayReadings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total: {stats?.totalReadings || 0} readings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <span className="text-2xl">⏱️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.uptime ? Math.floor(stats.uptime / 3600) : 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.uptime ? Math.floor((stats.uptime % 3600) / 60) : 0}m
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sensorData.filter(d => d.quality === 'excellent' || d.quality === 'good').length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {sensorData.length} readings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 w-full">
          <TabsTrigger value="overview" className="flex-1 min-h-[44px]">Overview</TabsTrigger>
          <TabsTrigger value="devices" className="flex-1 min-h-[44px]">Devices</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 min-h-[44px]">Analytics</TabsTrigger>
          <TabsTrigger value="alerts" className="flex-1 min-h-[44px]">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Temperature Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-48 sm:h-64 overflow-x-auto">
                  <Line data={temperatureChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Humidity Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-48 sm:h-64 overflow-x-auto">
                  <Line data={humidityChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Device Status and Sensor Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-48 sm:h-64 overflow-x-auto">
                  <Doughnut data={deviceStatusData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sensor Data Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-48 sm:h-64 overflow-x-auto">
                  <Bar data={sensorTypeData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Device Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={heatmapRef} className="flex justify-center overflow-x-auto"></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          {/* Device Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Device Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 mb-4">
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger className="w-full sm:w-48 min-h-[44px]"> <SelectValue placeholder="Select Device" /> </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Devices</SelectItem>
                    {devices.map(device => (
                      <SelectItem key={device.id} value={device.deviceId}>{device.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSensorType} onValueChange={setSelectedSensorType}>
                  <SelectTrigger className="w-full sm:w-48 min-h-[44px]"> <SelectValue placeholder="Sensor Type" /> </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {Object.values(SensorType).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-full sm:w-32 min-h-[44px]"> <SelectValue /> </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Devices Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map(device => (
                  <Card key={device.id} className="cursor-pointer hover:shadow-lg transition-shadow min-h-[64px] active:scale-95 focus-visible:ring-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getDeviceTypeIcon(device.type)}</span>
                          <div>
                            <CardTitle className="text-sm">{device.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{device.deviceId}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(device.status) + ' min-h-[32px] min-w-[44px] flex items-center justify-center'}>{device.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Type:</span>
                          <span className="capitalize">{device.type}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Location:</span>
                          <span>{device.location.area || 'Unknown'}</span>
                        </div>
                        {device.lastSeen && (
                          <div className="flex justify-between text-xs">
                            <span>Last Seen:</span>
                            <span>{new Date(device.lastSeen).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Temperature Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.temperature ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average:</span>
                      <span className="font-bold">{analytics.temperature.average}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Range:</span>
                      <span>{analytics.temperature.min}°C - {analytics.temperature.max}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trend:</span>
                      <Badge variant={analytics.temperature.trend === 'stable' ? 'default' : 'secondary'}>
                        {analytics.temperature.trend}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Humidity Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.humidity ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average:</span>
                      <span className="font-bold">{analytics.humidity.average}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Range:</span>
                      <span>{analytics.humidity.min}% - {analytics.humidity.max}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trend:</span>
                      <Badge variant={analytics.humidity.trend === 'stable' ? 'default' : 'secondary'}>
                        {analytics.humidity.trend}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Occupancy Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.occupancy ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average:</span>
                      <span className="font-bold">{analytics.occupancy.average}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peak:</span>
                      <span>{analytics.occupancy.peak}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trend:</span>
                      <Badge variant={analytics.occupancy.trend === 'stable' ? 'default' : 'secondary'}>
                        {analytics.occupancy.trend}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Occupancy Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-48 sm:h-64 overflow-x-auto">
                <Bar data={occupancyChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {sensorData.filter(d => d.alerts?.triggered).length > 0 ? (
                <div className="space-y-4">
                  {sensorData
                    .filter(d => d.alerts?.triggered)
                    .slice(0, 10)
                    .map(alert => (
                      <Alert key={alert.id} variant={alert.alerts?.severity === 'critical' ? 'destructive' : 'default'}>
                        <AlertDescription>
                          <div className="flex justify-between items-center">
                            <span>{alert.alerts?.message}</span>
                            <Badge variant={alert.alerts?.severity === 'critical' ? 'destructive' : 'secondary'} className="min-h-[32px] min-w-[44px] flex items-center justify-center">{alert.alerts?.severity}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString()} - {alert.deviceId}
                          </p>
                        </AlertDescription>
                      </Alert>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No alerts in the last 24 hours</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Data Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Data Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64 overflow-y-auto space-y-2">
            {realTimeData.length > 0 ? (
              realTimeData.map((data, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded min-h-[44px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{data.sensorType}</span>
                    <span className="text-sm">{data.data.value}{data.data.unit}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={data.quality === 'excellent' ? 'default' : 'secondary'} className="min-h-[32px] min-w-[44px] flex items-center justify-center">{data.quality}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(data.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Waiting for real-time data...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IoTDashboard; 