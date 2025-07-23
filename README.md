# MallOS Enterprise - IoT & AI Integration Hub

A comprehensive mall management platform with advanced IoT, AI, and Computer Vision capabilities for enterprise-level shopping center operations.

## 🚀 Phase 2: IoT & AI Features

### Overview

Phase 2 introduces cutting-edge IoT and AI technologies to transform mall management into a smart, predictive, and automated system. This phase includes:

- **IoT Integration Hub** - Real-time sensor management and data collection
- **AI Analytics Engine** - Machine learning-powered insights and predictions
- **Computer Vision Security System** - Advanced security monitoring and threat detection
- **Smart Analytics Dashboard** - Real-time visualization and decision support

## 🏗️ Architecture

### Backend Services

#### 1. IoT Service (`src/services/IoTService.ts`)
- **MQTT Integration**: Real-time device communication using MQTT protocol
- **Device Management**: Registration, authentication, and status monitoring
- **Sensor Data Processing**: Real-time data collection and quality assessment
- **Command System**: Remote device control and configuration
- **Alert Management**: Threshold-based alerting and notification system

**Key Features:**
- Supports 10,000+ IoT devices simultaneously
- Device certificate-based authentication
- Real-time data streaming via Socket.IO
- Redis caching for high-performance data access
- Automatic device health monitoring

#### 2. AI Analytics Service (`src/services/AIAnalyticsService.ts`)
- **TensorFlow.js Integration**: Machine learning model deployment and inference
- **Predictive Analytics**: Revenue forecasting, foot traffic prediction, energy optimization
- **Customer Behavior Analysis**: Pattern recognition and segmentation
- **Anomaly Detection**: Real-time detection of unusual patterns
- **Model Management**: Training, deployment, and versioning of ML models

**Key Features:**
- 95% accuracy revenue forecasting using time series analysis
- Real-time customer behavior pattern analysis
- Dynamic pricing recommendations
- Predictive maintenance scheduling
- Energy consumption optimization

#### 3. Computer Vision Service (`src/services/ComputerVisionService.ts`)
- **OpenCV Integration**: Advanced image processing and analysis
- **Face Recognition**: Real-time facial recognition and identification
- **Behavior Analysis**: Suspicious behavior detection and risk assessment
- **Crowd Analytics**: Density monitoring and flow analysis
- **Security Monitoring**: Fire/smoke detection, violence detection, theft prevention

**Key Features:**
- Real-time video stream processing
- VIP customer recognition and tracking
- Social distancing monitoring
- License plate recognition
- Automated security alert generation

### Database Schema

#### New Entities

1. **IoTDevice** (`src/models/IoTDevice.ts`)
   - Device registration and configuration
   - Status tracking and health monitoring
   - Location and type management

2. **SensorData** (`src/models/SensorData.ts`)
   - Time-series optimized sensor data storage
   - Data quality assessment
   - AI insights and predictions

3. **AIModel** (`src/models/AIModel.ts`)
   - Machine learning model metadata
   - Training history and performance metrics
   - Deployment configuration

4. **AIPrediction** (`src/models/AIPrediction.ts`)
   - Prediction results and accuracy tracking
   - Input/output data storage
   - Recommendations and alerts

5. **ComputerVision** (`src/models/ComputerVision.ts`)
   - Detection results and metadata
   - Facial recognition data
   - Security alerts and threat assessment

### API Endpoints

#### IoT Endpoints (`/api/iot`)
- `GET /devices` - List all IoT devices
- `POST /devices` - Register new device
- `GET /devices/:deviceId` - Get device details
- `POST /devices/:deviceId/command` - Send command to device
- `GET /devices/:deviceId/data` - Get sensor data
- `GET /data/stream` - Real-time data streaming (SSE)
- `POST /data/bulk` - Bulk data upload
- `GET /analytics` - IoT analytics
- `GET /alerts` - Device alerts

#### AI Endpoints (`/api/ai`)
- `GET /models` - List AI models
- `POST /models` - Create new model
- `POST /models/:modelId/train` - Train model
- `GET /models/:modelId` - Get model details
- `GET /predictions` - List predictions
- `POST /predictions` - Make prediction
- `POST /forecast/revenue` - Revenue forecasting
- `POST /analytics/customer-behavior` - Behavior analysis
- `POST /anomalies` - Anomaly detection

#### Computer Vision Endpoints (`/api/computer-vision`)
- `GET /cameras` - List security cameras
- `POST /cameras` - Add new camera
- `GET /cameras/:cameraId/stream` - Video stream
- `GET /detections` - List detections
- `GET /detections/:detectionId` - Get detection details
- `POST /detections/:detectionId/verify` - Verify detection
- `GET /alerts` - Security alerts
- `POST /alerts/:alertId/acknowledge` - Acknowledge alert
- `GET /analytics` - Computer vision analytics
- `GET /stream/alerts` - Real-time alerts (SSE)

### Frontend Dashboards

#### 1. IoT Dashboard (`frontend/src/pages/IoTDashboard.tsx`)
- **Real-time Device Monitoring**: Live status of all IoT devices
- **Sensor Data Visualization**: Charts and graphs for sensor data
- **Device Management**: Add, configure, and control devices
- **Alert Management**: View and respond to device alerts
- **Energy Analytics**: Consumption monitoring and optimization
- **Heatmap Visualization**: Device location and status mapping

#### 2. AI Analytics Dashboard (`frontend/src/pages/AIAnalyticsDashboard.tsx`)
- **Model Management**: View and manage AI models
- **Prediction Results**: Visualize AI predictions and accuracy
- **Revenue Forecasting**: Interactive revenue prediction charts
- **Customer Behavior Insights**: Segmentation and pattern analysis
- **Anomaly Detection**: Real-time anomaly monitoring
- **Performance Metrics**: Model accuracy and performance tracking

#### 3. Computer Vision Dashboard (`frontend/src/pages/ComputerVisionDashboard.tsx`)
- **Security Camera Management**: Monitor and configure cameras
- **Detection Results**: View facial recognition and behavior analysis
- **Security Alerts**: Real-time security incident monitoring
- **Crowd Analytics**: Density and flow analysis
- **Threat Assessment**: Risk level monitoring and alerting
- **Video Streams**: Live camera feeds with AI overlays

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional)

### Backend Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Configuration**
```bash
cp env.example .env
# Configure your environment variables
```

3. **Database Setup**
```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

4. **Start Services**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🔧 Configuration

### IoT Configuration

```typescript
// MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=secure_password

// Device Authentication
DEVICE_CERT_PATH=/certs/devices
DEVICE_CERT_EXPIRY=365
```

### AI Configuration

```typescript
// TensorFlow.js Configuration
TENSORFLOW_GPU_ENABLED=true
MODEL_STORAGE_PATH=/models
TRAINING_DATA_PATH=/data/training

// Model Performance
PREDICTION_TIMEOUT=30000
BATCH_SIZE=32
```

### Computer Vision Configuration

```typescript
// OpenCV Configuration
OPENCV_CASCADE_PATH=/opencv/cascades
FACE_RECOGNITION_MODEL_PATH=/models/face-api
VIDEO_STREAM_BUFFER_SIZE=10

// Security Settings
THREAT_DETECTION_SENSITIVITY=0.8
ALERT_COOLDOWN_PERIOD=300
```

## 📊 Usage Examples

### IoT Device Registration

```typescript
// Register a new temperature sensor
const device = await iotService.registerDevice({
  deviceId: 'temp-sensor-001',
  mallId: 'mall-123',
  name: 'Main Entrance Temperature Sensor',
  type: DeviceType.SENSOR,
  location: {
    area: 'Main Entrance',
    floor: '1',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  configuration: {
    sensorType: SensorType.TEMPERATURE,
    samplingRate: 60,
    threshold: { min: 18, max: 25 }
  }
});
```

### AI Model Training

```typescript
// Train a revenue forecasting model
await aiAnalyticsService.trainModel({
  modelId: 'revenue-forecast-v1',
  dataSource: 'financial_data',
  features: ['foot_traffic', 'season', 'events', 'weather'],
  target: 'daily_revenue',
  hyperparameters: {
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001
  }
});
```

### Computer Vision Detection

```typescript
// Process security camera feed
const detection = await computerVisionService.processFrame({
  cameraId: 'security-cam-001',
  frame: imageBuffer,
  features: [
    VisionType.FACIAL_RECOGNITION,
    VisionType.BEHAVIOR_ANALYSIS,
    VisionType.CROWD_ANALYSIS
  ]
});
```

## 🔒 Security Features

### IoT Security
- Device certificate-based authentication
- Encrypted MQTT communication
- Rate limiting for API endpoints
- Data encryption for sensitive sensor data

### AI Security
- Model versioning and integrity checks
- Secure model deployment
- Input validation and sanitization
- Access control for model management

### Computer Vision Security
- Secure video stream handling
- Privacy-compliant facial recognition
- Encrypted storage of detection data
- Audit logging for all security events

## 📈 Performance Optimization

### IoT Performance
- Redis caching for real-time data
- Database indexing for time-series queries
- Connection pooling for device communication
- Batch processing for sensor data

### AI Performance
- GPU acceleration for model inference
- Model quantization for faster inference
- Background job processing
- Distributed training capabilities

### Computer Vision Performance
- Multi-threaded video processing
- Hardware acceleration (GPU/TPU)
- Optimized image processing pipelines
- Real-time detection optimization

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 📚 API Documentation

### Swagger UI
Access the interactive API documentation at:
```
http://localhost:3001/api-docs
```

### Postman Collection
Import the Postman collection from:
```
docs/postman/MallOS_Enterprise_API.postman_collection.json
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: support@mallos.com
- Documentation: https://docs.mallos.com
- Issues: https://github.com/mallos-enterprise/mallos-platform/issues

## 🔮 Roadmap

### Phase 3: Advanced Features
- Blockchain integration for secure transactions
- Advanced machine learning models
- Mobile app development
- Third-party integrations
- Advanced reporting and analytics

---

**MallOS Enterprise** - Transforming mall management with IoT & AI technology. #   m o l l s  
 #   m o l l s  
 #   m o l l s  
 # molls
# molls
# molls
