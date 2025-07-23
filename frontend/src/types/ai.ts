export enum ModelType {
  PREDICTION = 'prediction',
  CLASSIFICATION = 'classification',
  ANOMALY_DETECTION = 'anomaly_detection',
  COMPUTER_VISION = 'computer_vision',
  NLP = 'nlp',
  RECOMMENDATION = 'recommendation',
  FORECASTING = 'forecasting'
}

export enum ModelStatus {
  TRAINING = 'training',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
  ERROR = 'error'
}

export enum ModelFramework {
  TENSORFLOW = 'tensorflow',
  PYTORCH = 'pytorch',
  SCIKIT_LEARN = 'scikit_learn',
  OPENCV = 'opencv',
  FACE_API = 'face_api',
  CUSTOM = 'custom'
}

export enum PredictionType {
  REVENUE_FORECAST = 'revenue_forecast',
  FOOT_TRAFFIC = 'foot_traffic',
  ENERGY_CONSUMPTION = 'energy_consumption',
  MAINTENANCE_SCHEDULE = 'maintenance_schedule',
  CROWD_DENSITY = 'crowd_density',
  PARKING_AVAILABILITY = 'parking_availability',
  TENANT_PERFORMANCE = 'tenant_performance',
  SECURITY_THREAT = 'security_threat',
  EQUIPMENT_FAILURE = 'equipment_failure',
  CUSTOMER_BEHAVIOR = 'customer_behavior',
  PRICING_OPTIMIZATION = 'pricing_optimization',
  ANOMALY_DETECTION = 'anomaly_detection'
}

export enum PredictionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export interface AIModel {
  id: string;
  name: string;
  version: string;
  mallId: string;
  type: ModelType;
  framework: ModelFramework;
  status: ModelStatus;
  description?: string;
  configuration: {
    inputShape?: number[];
    outputShape?: number[];
    layers?: any[];
    hyperparameters?: any;
    preprocessing?: any;
    postprocessing?: any;
  };
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    mae?: number;
    custom?: any;
  };
  trainingData?: {
    startDate?: Date;
    endDate?: Date;
    samples?: number;
    features?: string[];
    validationSplit?: number;
  };
  deployment?: {
    endpoint?: string;
    environment?: string;
    resources?: {
      cpu?: number;
      memory?: number;
      gpu?: boolean;
    };
    scaling?: {
      minInstances?: number;
      maxInstances?: number;
    };
  };
  performance?: {
    latency?: number;
    throughput?: number;
    errorRate?: number;
    lastUpdated?: Date;
  };
  modelFile?: {
    path?: string;
    size?: number;
    checksum?: string;
    format?: string;
  };
  dependencies?: {
    packages?: string[];
    versions?: Record<string, string>;
  };
  tags?: string[];
  isProduction: boolean;
  parentModelId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIPrediction {
  id: string;
  modelId: string;
  mallId: string;
  type: PredictionType;
  status: PredictionStatus;
  timestamp: Date;
  predictionDate?: Date;
  input: {
    features: Record<string, any>;
    parameters?: any;
    context?: any;
  };
  output: {
    prediction: any;
    confidence?: number;
    probability?: number;
    range?: { min: number; max: number };
    alternatives?: any[];
  };
  metadata?: {
    processingTime?: number;
    modelVersion?: string;
    algorithm?: string;
    features?: string[];
    preprocessing?: any;
  };
  accuracy?: {
    actualValue?: any;
    error?: number;
    accuracy?: number;
    validated?: boolean;
    validationDate?: Date;
  };
  alerts?: {
    triggered: boolean;
    threshold?: number;
    message?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
  recommendations?: {
    actions?: string[];
    priority?: 'low' | 'medium' | 'high';
    impact?: 'positive' | 'negative' | 'neutral';
    confidence?: number;
  };
  tags?: string[];
  isHistorical: boolean;
  createdAt: Date;
  model?: AIModel;
}

export interface ModelTrainingConfig {
  modelId: string;
  dataSource: string;
  features: string[];
  target: string;
  hyperparameters?: any;
  validationSplit?: number;
  epochs?: number;
  batchSize?: number;
}

export interface PredictionRequest {
  modelId: string;
  type: PredictionType;
  input: Record<string, any>;
  parameters?: any;
  context?: any;
}

export interface AIStats {
  totalModels: number;
  activeModels: number;
  totalPredictions: number;
  averageAccuracy: number;
  trainingJobs: number;
  activeJobs: number;
  averageLatency: number;
  totalRevenue: number;
  costSavings: number;
  anomalyDetections: number;
}

export interface AIAnalytics {
  predictionsByType: Record<PredictionType, number>;
  modelPerformance: { modelId: string; accuracy: number; latency: number }[];
  revenueForecasts: { timestamp: Date; predictedValue: number; actualValue?: number }[];
  footTrafficPredictions: { timestamp: Date; predictedValue: number; actualValue?: number }[];
  energyForecasts: { timestamp: Date; predictedValue: number; actualValue?: number }[];
  customerBehaviorInsights: {
    segments: { name: string; size: number; characteristics: string[] }[];
    patterns: { pattern: string; frequency: number; impact: number }[];
    recommendations: string[];
  };
  anomalyDetections: {
    timestamp: Date;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }[];
  modelAccuracyTrends: { timestamp: Date; modelId: string; accuracy: number }[];
  costBenefitAnalysis: {
    totalInvestment: number;
    totalSavings: number;
    roi: number;
    paybackPeriod: number;
    recommendations: string[];
  };
} 