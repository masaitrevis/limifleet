export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export type VehicleType = 'TRUCK' | 'VAN' | 'CAR' | 'MOTORCYCLE' | 'BUS' | 'TRAILER' | 'OTHER';

export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED';

export type FuelType = 'DIESEL' | 'GASOLINE' | 'ELECTRIC' | 'HYBRID' | 'LPG' | 'CNG';

export type DriverStatus = 'ACTIVE' | 'OFF_DUTY' | 'SUSPENDED' | 'ON_LEAVE' | 'TERMINATED';

export type BehaviorEventType = 'OVER_SPEEDING' | 'HARSH_BRAKING' | 'HARSH_ACCELERATION' | 'IDLING' | 'PHONE_USAGE' | 'SEATBELT_VIOLATION' | 'NIGHT_DRIVING' | 'CORNERING';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TripStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ABORTED';

export type MaintenanceType = 'OIL_CHANGE' | 'TIRE_ROTATION' | 'BRAKE_CHECK' | 'ENGINE_TUNING' | 'TRANSMISSION' | 'ELECTRICAL' | 'COOLING' | 'SUSPENSION' | 'OTHER';

export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type GeofenceType = 'INCLUSION' | 'EXCLUSION' | 'SPEED_LIMIT' | 'IDLE_ZONE';

export type AlertType = 'OVER_SPEEDING' | 'GEO_FENCE_VIOLATION' | 'MAINTENANCE_DUE' | 'FUEL_ANOMALY' | 'VEHICLE_OFFLINE' | 'DRIVER_BEHAVIOR' | 'OTHER';

export type NotificationType = 'ALERT' | 'MAINTENANCE_REMINDER' | 'SYSTEM' | 'REPORT';

export interface Company {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  vehicleId: string;
  registrationNumber: string;
  manufacturer: string;
  model: string;
  year?: number;
  type: VehicleType;
  status: VehicleStatus;
  fuelType: FuelType;
  tankCapacity?: number;
  licensePlate: string;
  vin?: string;
  color?: string;
  mileage: number;
  companyId: string;
  assignedDriverId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  driverId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: Date;
  status: DriverStatus;
  safetyScore: number;
  companyId: string;
  assignedVehicleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  tripId: string;
  vehicleId: string;
  driverId: string;
  startTime: Date;
  endTime?: Date;
  distanceKm: number;
  durationMin: number;
  status: TripStatus;
  startLocation?: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
  route?: any[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  amountL: number;
  cost?: number;
  odometerKm: number;
  station?: string;
  fuelType: FuelType;
  isAnomaly: boolean;
  anomalyReason?: string;
  recordedAt: Date;
  companyId: string;
  createdAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  title: string;
  description?: string;
  scheduledAt: Date;
  completedAt?: Date;
  cost?: number;
  status: MaintenanceStatus;
  priority: Priority;
  performedBy?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  description?: string;
  vehicleId?: string;
  driverId?: string;
  isRead: boolean;
  isResolved: boolean;
  occurredAt: Date;
  companyId: string;
  createdAt: Date;
}

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: GeofenceType;
  centerLat?: number;
  centerLng?: number;
  radius?: number;
  polygon?: any;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  offlineVehicles: number;
  driversOnline: number;
  todayTrips: number;
  totalDistanceToday: number;
  totalFuelToday: number;
  maintenanceDue: number;
  maintenanceOverdue: number;
  fuelAnomalies: number;
  unreadAlerts: number;
  fleetHealthScore: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
