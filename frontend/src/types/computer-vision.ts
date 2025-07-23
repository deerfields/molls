export enum VisionType {
  FACIAL_RECOGNITION = 'facial_recognition',
  BEHAVIOR_ANALYSIS = 'behavior_analysis',
  CROWD_ANALYSIS = 'crowd_analysis',
  LICENSE_PLATE = 'license_plate',
  FIRE_SMOKE = 'fire_smoke',
  SOCIAL_DISTANCING = 'social_distancing',
  VIOLENCE_DETECTION = 'violence_detection',
  THEFT_PREVENTION = 'theft_prevention',
  VIP_RECOGNITION = 'vip_recognition',
  ANOMALY_DETECTION = 'anomaly_detection',
  OCCUPANCY_COUNTING = 'occupancy_counting',
  TRAFFIC_FLOW = 'traffic_flow'
}

export enum DetectionStatus {
  DETECTED = 'detected',
  VERIFIED = 'verified',
  FALSE_POSITIVE = 'false_positive',
  PENDING_REVIEW = 'pending_review',
  IGNORED = 'ignored'
}

export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  features: VisionType[];
  lastDetection?: Date;
  threatLevel?: ThreatLevel;
  configuration?: any;
}

export interface Detection {
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
    features?: any[];
    matchConfidence?: number;
  };
  behaviorData?: {
    action?: string;
    duration?: number;
    trajectory?: any[];
    riskScore?: number;
    patterns?: string[];
  };
  crowdData?: {
    count?: number;
    density?: number;
    flow?: { direction: string; speed: number };
    heatmap?: any;
    bottlenecks?: any[];
  };
  securityData?: {
    threatLevel?: ThreatLevel;
    alertType?: string;
    description?: string;
    location?: { area: string; coordinates?: any };
    responseRequired?: boolean;
  };
  imageData?: {
    originalPath?: string;
    processedPath?: string;
    thumbnailPath?: string;
    metadata?: {
      resolution?: string;
      format?: string;
      size?: number;
      compression?: string;
    };
  };
  aiInsights?: {
    anomaly?: boolean;
    prediction?: any;
    recommendations?: string[];
    riskAssessment?: number;
  };
  alerts?: {
    triggered: boolean;
    message?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    acknowledged?: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
  };
  tags?: string[];
  isProcessed: boolean;
  metadata?: {
    processingTime?: number;
    modelVersion?: string;
    algorithm?: string;
    quality?: number;
  };
  createdAt: Date;
}

export interface SecurityAlert {
  id: string;
  cameraId: string;
  type: VisionType;
  threatLevel: ThreatLevel;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  response?: string;
  notes?: string;
}

export interface ComputerVisionStats {
  totalCameras: number;
  onlineCameras: number;
  totalDetections: number;
  activeAlerts: number;
  facialRecognitions: number;
  behaviorAnalyses: number;
  crowdAnalyses: number;
  securityIncidents: number;
  averageProcessingTime: number;
  modelAccuracy: number;
}

export interface ComputerVisionAnalytics {
  detectionsByType: Record<VisionType, number>;
  detectionsByHour: { hour: number; count: number }[];
  threatLevelDistribution: Record<ThreatLevel, number>;
  cameraPerformance: { cameraId: string; detections: number; accuracy: number }[];
  crowdDensityTrends: { timestamp: Date; density: number }[];
  securityIncidents: { timestamp: Date; count: number }[];
  facialRecognitionStats: {
    totalFaces: number;
    knownFaces: number;
    unknownFaces: number;
    averageConfidence: number;
  };
  behaviorAnalysisStats: {
    totalAnalyses: number;
    highRiskBehaviors: number;
    averageRiskScore: number;
    commonPatterns: string[];
  };
  crowdAnalysisStats: {
    averageDensity: number;
    peakHours: number[];
    bottleneckLocations: string[];
    flowEfficiency: number;
  };
} 