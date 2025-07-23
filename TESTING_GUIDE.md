# 🧪 Phase 2 Testing Guide - IoT & AI Features

## 📋 **Testing Overview**

This guide provides comprehensive testing procedures for Phase 2 implementation of MallOS Enterprise IoT & AI features.

## 🚀 **Prerequisites Setup**

### 1. **Environment Requirements**
```bash
# Required Software
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional)

# Check installations
node --version
npm --version
docker --version
docker-compose --version
```

### 2. **Install Dependencies**
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 3. **Environment Configuration**
```bash
# Copy environment template
cp env.example .env

# Configure environment variables
# Database, Redis, MQTT, AI models, etc.
```

## 🗄️ **Database Setup**

### 1. **PostgreSQL Setup**
```bash
# Create database
createdb mallos_enterprise

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### 2. **Redis Setup**
```bash
# Start Redis server
redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

## 🔧 **Backend Testing**

### 1. **Start Backend Server**
```bash
# Development mode
npm run dev

# Or production build
npm run build
npm start
```

### 2. **API Endpoint Testing**

#### **Authentication Tests**
```bash
# Test user registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mallos.com",
    "password": "secure123",
    "name": "Admin User",
    "role": "admin"
  }'

# Test user login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mallos.com",
    "password": "secure123"
  }'
```

#### **IoT API Tests**
```bash
# Get IoT devices
curl -X GET http://localhost:3001/api/iot/devices \
  -H "Authorization: Bearer YOUR_TOKEN"

# Register new IoT device
curl -X POST http://localhost:3001/api/iot/devices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "temp-sensor-001",
    "mallId": "mall-123",
    "name": "Temperature Sensor",
    "type": "sensor",
    "location": {
      "area": "Main Entrance",
      "floor": "1"
    }
  }'

# Get sensor data
curl -X GET http://localhost:3001/api/iot/devices/temp-sensor-001/data \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test real-time data stream
curl -N http://localhost:3001/api/iot/data/stream \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **AI API Tests**
```bash
# Get AI models
curl -X GET http://localhost:3001/api/ai/models \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create new AI model
curl -X POST http://localhost:3001/api/ai/models \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Revenue Forecast Model",
    "version": "1.0.0",
    "mallId": "mall-123",
    "type": "forecasting",
    "framework": "tensorflow",
    "description": "Revenue forecasting model"
  }'

# Train model
curl -X POST http://localhost:3001/api/ai/models/MODEL_ID/train \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataSource": "financial_data",
    "features": ["foot_traffic", "season", "events"],
    "target": "daily_revenue"
  }'

# Make prediction
curl -X POST http://localhost:3001/api/ai/predictions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "MODEL_ID",
    "type": "revenue_forecast",
    "input": {
      "foot_traffic": 1000,
      "season": "summer",
      "events": ["sale", "festival"]
    }
  }'
```

#### **Computer Vision API Tests**
```bash
# Get security cameras
curl -X GET http://localhost:3001/api/computer-vision/cameras \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add new camera
curl -X POST http://localhost:3001/api/computer-vision/cameras \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Entrance Camera",
    "location": "Main Entrance",
    "features": ["facial_recognition", "behavior_analysis"],
    "streamUrl": "rtsp://camera-ip:554/stream"
  }'

# Get detections
curl -X GET http://localhost:3001/api/computer-vision/detections \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get security alerts
curl -X GET http://localhost:3001/api/computer-vision/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. **Service Testing**

#### **IoT Service Test**
```javascript
// Test IoT device registration
const device = await iotService.registerDevice({
  deviceId: 'test-sensor-001',
  mallId: 'mall-123',
  name: 'Test Sensor',
  type: 'sensor',
  location: { area: 'Test Area' }
});

// Test sensor data processing
await iotService.processSensorData('test-sensor-001', 'mall-123', {
  temperature: 22.5,
  humidity: 45,
  timestamp: new Date()
});

// Test device command
await iotService.sendDeviceCommand({
  deviceId: 'test-sensor-001',
  command: 'calibrate',
  parameters: { duration: 30 }
});
```

#### **AI Analytics Service Test**
```javascript
// Test model creation
const model = await aiAnalyticsService.createModel({
  name: 'Test Model',
  version: '1.0.0',
  mallId: 'mall-123',
  type: 'prediction',
  framework: 'tensorflow'
});

// Test prediction
const prediction = await aiAnalyticsService.makePrediction({
  modelId: model.id,
  type: 'revenue_forecast',
  input: { features: { sales: 1000, season: 'summer' } }
});

// Test anomaly detection
const anomalies = await aiAnalyticsService.detectAnomalies('mall-123', 'temperature');
```

#### **Computer Vision Service Test**
```javascript
// Test camera stream processing
await computerVisionService.startCameraStream('camera-001', {
  streamUrl: 'rtsp://test-camera:554/stream',
  features: ['facial_recognition', 'behavior_analysis']
});

// Test detection processing
const detection = await computerVisionService.processFrameFeature(
  testFrame, 
  'facial_recognition', 
  'camera-001'
);
```

## 🎨 **Frontend Testing**

### 1. **Start Frontend Server**
```bash
cd frontend
npm run dev
```

### 2. **Dashboard Testing**

#### **IoT Dashboard Tests**
1. **Navigate to IoT Dashboard**
   - URL: `http://localhost:3000/iot`
   - Verify dashboard loads without errors
   - Check all UI components render correctly

2. **Device Management**
   - Test adding new IoT device
   - Verify device appears in device list
   - Test device status updates
   - Test device configuration

3. **Real-time Data**
   - Verify real-time sensor data updates
   - Test data visualization charts
   - Check alert notifications
   - Test data filtering and search

4. **Analytics**
   - Test energy consumption charts
   - Verify occupancy analytics
   - Test heatmap visualization
   - Check export functionality

#### **AI Analytics Dashboard Tests**
1. **Navigate to AI Dashboard**
   - URL: `http://localhost:3000/ai`
   - Verify dashboard loads correctly
   - Check model management interface

2. **Model Management**
   - Test creating new AI model
   - Verify model training interface
   - Test model deployment
   - Check model performance metrics

3. **Predictions**
   - Test making predictions
   - Verify prediction results display
   - Test revenue forecasting
   - Check anomaly detection

4. **Analytics**
   - Test customer behavior insights
   - Verify performance metrics
   - Test cost-benefit analysis
   - Check export functionality

#### **Computer Vision Dashboard Tests**
1. **Navigate to Computer Vision Dashboard**
   - URL: `http://localhost:3000/computer-vision`
   - Verify dashboard loads correctly
   - Check camera management interface

2. **Camera Management**
   - Test adding new security camera
   - Verify camera status monitoring
   - Test camera configuration
   - Check video stream display

3. **Detection Results**
   - Test facial recognition results
   - Verify behavior analysis
   - Test crowd analytics
   - Check security alerts

4. **Security Features**
   - Test threat detection
   - Verify alert acknowledgment
   - Test detection verification
   - Check analytics reports

### 3. **UI Component Testing**
```bash
# Test responsive design
# Test on different screen sizes
# Test accessibility features
# Test keyboard navigation
```

## 🔄 **Real-time Testing**

### 1. **Socket.IO Testing**
```javascript
// Test real-time connections
const socket = io('http://localhost:3001', {
  auth: { token: 'YOUR_TOKEN' }
});

// Subscribe to IoT data
socket.emit('subscribe-iot-data', {
  sensorType: 'temperature',
  deviceId: 'temp-sensor-001'
});

// Listen for real-time updates
socket.on('sensor-data', (data) => {
  console.log('Real-time sensor data:', data);
});
```

### 2. **Server-Sent Events Testing**
```javascript
// Test SSE for real-time alerts
const eventSource = new EventSource('/api/computer-vision/stream/alerts', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

eventSource.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  console.log('Real-time alert:', alert);
};
```

## 🐛 **Error Handling Testing**

### 1. **API Error Tests**
```bash
# Test invalid authentication
curl -X GET http://localhost:3001/api/iot/devices
# Should return 401 Unauthorized

# Test invalid input
curl -X POST http://localhost:3001/api/iot/devices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
# Should return 400 Bad Request

# Test rate limiting
# Make multiple rapid requests
# Should return 429 Too Many Requests
```

### 2. **Service Error Tests**
```javascript
// Test IoT service errors
try {
  await iotService.getDevice('non-existent-device');
} catch (error) {
  console.log('Expected error:', error.message);
}

// Test AI service errors
try {
  await aiAnalyticsService.makePrediction({
    modelId: 'invalid-model',
    type: 'invalid-type',
    input: {}
  });
} catch (error) {
  console.log('Expected error:', error.message);
}
```

## 📊 **Performance Testing**

### 1. **Load Testing**
```bash
# Test with multiple concurrent users
# Use tools like Apache Bench or Artillery
ab -n 1000 -c 10 http://localhost:3001/api/iot/devices

# Test database performance
# Monitor query execution times
# Check Redis cache hit rates
```

### 2. **Memory Testing**
```bash
# Monitor memory usage
# Test with large datasets
# Check for memory leaks
```

## 🔒 **Security Testing**

### 1. **Authentication Tests**
```bash
# Test JWT token validation
# Test role-based access control
# Test session management
```

### 2. **Input Validation Tests**
```bash
# Test SQL injection prevention
# Test XSS prevention
# Test CSRF protection
```

## 📝 **Test Results Documentation**

### 1. **Create Test Report**
```markdown
# Phase 2 Testing Report

## Test Summary
- Total Tests: X
- Passed: X
- Failed: X
- Success Rate: X%

## Issues Found
1. Issue 1: Description and resolution
2. Issue 2: Description and resolution

## Performance Metrics
- Average Response Time: Xms
- Throughput: X requests/second
- Memory Usage: X MB

## Recommendations
- Recommendations for improvements
- Next steps for optimization
```

## 🚀 **Production Deployment Testing**

### 1. **Docker Testing**
```bash
# Build Docker images
docker-compose build

# Test Docker containers
docker-compose up -d

# Verify all services start correctly
docker-compose ps

# Test application functionality
curl http://localhost:3001/api/health
```

### 2. **Environment Testing**
```bash
# Test production environment variables
# Test database connections
# Test external service integrations
# Test backup and recovery procedures
```

## ✅ **Testing Checklist**

- [ ] Backend API endpoints working
- [ ] Frontend dashboards loading correctly
- [ ] Real-time data streaming functional
- [ ] IoT device management working
- [ ] AI model training and predictions working
- [ ] Computer vision detections working
- [ ] Error handling implemented
- [ ] Security features tested
- [ ] Performance acceptable
- [ ] Documentation complete

## 🆘 **Troubleshooting**

### Common Issues
1. **Database Connection Issues**
   - Check PostgreSQL service status
   - Verify connection credentials
   - Check firewall settings

2. **Redis Connection Issues**
   - Check Redis service status
   - Verify Redis configuration
   - Check network connectivity

3. **MQTT Connection Issues**
   - Check MQTT broker status
   - Verify broker configuration
   - Check network connectivity

4. **Frontend Build Issues**
   - Clear node_modules and reinstall
   - Check TypeScript compilation
   - Verify environment variables

### Support
For additional support:
- Check application logs
- Review error messages
- Consult documentation
- Contact development team 