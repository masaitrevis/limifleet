import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Demo Fleet Company',
      code: 'DEMO-001',
      address: '123 Main Street',
      city: 'San Francisco',
      country: 'USA',
      phone: '+1-555-0100',
      email: 'fleet@demo.com',
      website: 'https://demo.com',
      isActive: true,
      settings: {
        create: {
          timezone: 'America/Los_Angeles',
          distanceUnit: 'km',
          fuelUnit: 'L',
          temperatureUnit: 'celsius',
          speedLimit: 80,
          maxIdleTime: 30,
          maintenanceAlertDays: 7,
          overSpeedThreshold: 10,
          geofenceCheckInterval: 60,
          enableFuelAnomalyDetection: true,
          enableMaintenancePrediction: true,
          enableDriverBehaviorAnalysis: true,
          enableRealTimeAlerts: true,
          enableEmailNotifications: false,
          enablePushNotifications: false,
          enableSmsNotifications: false,
        },
      },
    },
  });

  console.log('Created company:', company.name);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      companyId: company.id,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create vehicles
  const vehicles = await prisma.vehicle.createMany({
    data: [
      {
        companyId: company.id,
        vehicleId: 'VH-001',
        registrationNumber: 'ABC-1234',
        manufacturer: 'Toyota',
        model: 'Hilux',
        year: 2022,
        type: 'TRUCK',
        status: 'ACTIVE',
        fuelType: 'DIESEL',
        tankCapacity: 70,
        licensePlate: 'ABC-1234',
        vin: 'JTMBK32V7050XXXX1',
        color: 'White',
        mileage: 45000,
      },
      {
        companyId: company.id,
        vehicleId: 'VH-002',
        registrationNumber: 'DEF-5678',
        manufacturer: 'Ford',
        model: 'Transit',
        year: 2021,
        type: 'VAN',
        status: 'ACTIVE',
        fuelType: 'DIESEL',
        tankCapacity: 60,
        licensePlate: 'DEF-5678',
        vin: 'WF0XXXBCDEXYXXXX2',
        color: 'Blue',
        mileage: 32000,
      },
      {
        companyId: company.id,
        vehicleId: 'VH-003',
        registrationNumber: 'GHI-9012',
        manufacturer: 'Tesla',
        model: 'Model 3',
        year: 2023,
        type: 'CAR',
        status: 'ACTIVE',
        fuelType: 'ELECTRIC',
        tankCapacity: 50,
        licensePlate: 'GHI-9012',
        vin: '5YJ3E1EA8PFXXXX3',
        color: 'Red',
        mileage: 12000,
      },
      {
        companyId: company.id,
        vehicleId: 'VH-004',
        registrationNumber: 'JKL-3456',
        manufacturer: 'Mercedes',
        model: 'Actros',
        year: 2020,
        type: 'TRUCK',
        status: 'MAINTENANCE',
        fuelType: 'DIESEL',
        tankCapacity: 300,
        licensePlate: 'JKL-3456',
        vin: 'WDB9634XXXXX0004',
        color: 'Silver',
        mileage: 78000,
      },
      {
        companyId: company.id,
        vehicleId: 'VH-005',
        registrationNumber: 'MNO-7890',
        manufacturer: 'Volkswagen',
        model: 'Crafter',
        year: 2023,
        type: 'VAN',
        status: 'INACTIVE',
        fuelType: 'DIESEL',
        tankCapacity: 75,
        licensePlate: 'MNO-7890',
        vin: 'WV1ZZZ2EZXD0XXXX5',
        color: 'Black',
        mileage: 5000,
      },
    ],
  });

  console.log('Created 5 vehicles');

  // Create drivers
  const drivers = await prisma.driver.createMany({
    data: [
      {
        companyId: company.id,
        driverId: 'DR-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@demo.com',
        phone: '+1-555-0101',
        licenseNumber: 'DL-001-ABC',
        licenseExpiry: new Date('2026-06-15'),
        status: 'ACTIVE',
        safetyScore: 95,
        assignedVehicleId: (await prisma.vehicle.findFirst({ where: { vehicleId: 'VH-001' } }))!.id,
      },
      {
        companyId: company.id,
        driverId: 'DR-002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@demo.com',
        phone: '+1-555-0102',
        licenseNumber: 'DL-002-DEF',
        licenseExpiry: new Date('2027-03-22'),
        status: 'ACTIVE',
        safetyScore: 88,
        assignedVehicleId: (await prisma.vehicle.findFirst({ where: { vehicleId: 'VH-002' } }))!.id,
      },
      {
        companyId: company.id,
        driverId: 'DR-003',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@demo.com',
        phone: '+1-555-0103',
        licenseNumber: 'DL-003-GHI',
        licenseExpiry: new Date('2025-11-30'),
        status: 'OFF_DUTY',
        safetyScore: 72,
      },
      {
        companyId: company.id,
        driverId: 'DR-004',
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice.williams@demo.com',
        phone: '+1-555-0104',
        licenseNumber: 'DL-004-JKL',
        licenseExpiry: new Date('2028-01-10'),
        status: 'SUSPENDED',
        safetyScore: 45,
      },
    ],
  });

  console.log('Created 4 drivers');

  // Create fuel records
  const vehicle1 = await prisma.vehicle.findFirst({ where: { vehicleId: 'VH-001' } });
  const vehicle2 = await prisma.vehicle.findFirst({ where: { vehicleId: 'VH-002' } });

  await prisma.fuelRecord.createMany({
    data: [
      {
        companyId: company.id,
        vehicleId: vehicle1!.id,
        amountL: 45.2,
        cost: 67.80,
        odometerKm: 44800,
        station: 'Shell Station 42',
        fuelType: 'DIESEL',
        isAnomaly: false,
        recordedAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        companyId: company.id,
        vehicleId: vehicle1!.id,
        amountL: 48.5,
        cost: 72.75,
        odometerKm: 44500,
        station: 'BP Express',
        fuelType: 'DIESEL',
        isAnomaly: true,
        anomalyReason: 'Overfill detected (exceeds tank capacity by ~10%)',
        recordedAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        companyId: company.id,
        vehicleId: vehicle2!.id,
        amountL: 38.0,
        cost: 57.00,
        odometerKm: 31800,
        station: 'Chevron',
        fuelType: 'DIESEL',
        isAnomaly: false,
        recordedAt: new Date(Date.now() - 86400000 * 1),
      },
    ],
  });

  console.log('Created 3 fuel records');

  // Create maintenance records
  await prisma.maintenanceRecord.createMany({
    data: [
      {
        companyId: company.id,
        vehicleId: vehicle1!.id,
        type: 'OIL_CHANGE',
        title: 'Regular Oil Change',
        description: 'Standard 10,000km oil change service',
        scheduledAt: new Date(Date.now() + 86400000 * 7),
        cost: 120.00,
        status: 'SCHEDULED',
        priority: 'MEDIUM',
      },
      {
        companyId: company.id,
        vehicleId: vehicle1!.id,
        type: 'BRAKE_CHECK',
        title: 'Brake Pad Inspection',
        description: 'Check brake pad wear and replace if needed',
        scheduledAt: new Date(Date.now() - 86400000 * 3),
        cost: 250.00,
        status: 'OVERDUE',
        priority: 'HIGH',
      },
      {
        companyId: company.id,
        vehicleId: (await prisma.vehicle.findFirst({ where: { vehicleId: 'VH-004' } }))!.id,
        type: 'ENGINE_TUNING',
        title: 'Engine Overhaul',
        description: 'Major engine service due to performance issues',
        scheduledAt: new Date(Date.now() - 86400000 * 1),
        cost: 1500.00,
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        performedBy: 'Premium Auto Service',
      },
    ],
  });

  console.log('Created 3 maintenance records');

  // Create alerts
  await prisma.alert.createMany({
    data: [
      {
        companyId: company.id,
        type: 'MAINTENANCE_DUE',
        severity: 'HIGH',
        title: 'Vehicle VH-002 needs tire rotation',
        description: 'Scheduled tire rotation at 32,000km is overdue',
        vehicleId: vehicle2!.id,
        isRead: false,
        isResolved: false,
        occurredAt: new Date(),
      },
      {
        companyId: company.id,
        type: 'FUEL_ANOMALY',
        severity: 'MEDIUM',
        title: 'Fuel anomaly detected on VH-001',
        description: 'Fuel fill amount exceeds tank capacity by 10%',
        vehicleId: vehicle1!.id,
        isRead: false,
        isResolved: false,
        occurredAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        companyId: company.id,
        type: 'OVER_SPEEDING',
        severity: 'HIGH',
        title: 'Speed limit violation',
        description: 'Vehicle exceeded 80km/h limit by 15km/h',
        vehicleId: vehicle1!.id,
        driverId: (await prisma.driver.findFirst({ where: { driverId: 'DR-001' } }))!.id,
        isRead: true,
        isResolved: true,
        occurredAt: new Date(Date.now() - 86400000 * 2),
      },
    ],
  });

  console.log('Created 3 alerts');

  // Create trips
  const driver1 = await prisma.driver.findFirst({ where: { driverId: 'DR-001' } });
  const driver2 = await prisma.driver.findFirst({ where: { driverId: 'DR-002' } });

  await prisma.trip.createMany({
    data: [
      {
        companyId: company.id,
        tripId: 'TR-20240601-001',
        vehicleId: vehicle1!.id,
        driverId: driver1!.id,
        startTime: new Date(Date.now() - 86400000 * 1),
        endTime: new Date(Date.now() - 86400000 * 1 + 7200000),
        distanceKm: 120.5,
        durationMin: 120,
        status: 'COMPLETED',
        startLocation: { lat: 37.7749, lng: -122.4194 },
        endLocation: { lat: 37.3382, lng: -121.8863 },
      },
      {
        companyId: company.id,
        tripId: 'TR-20240601-002',
        vehicleId: vehicle2!.id,
        driverId: driver2!.id,
        startTime: new Date(Date.now() - 86400000 * 1),
        endTime: new Date(Date.now() - 86400000 * 1 + 5400000),
        distanceKm: 85.3,
        durationMin: 90,
        status: 'COMPLETED',
        startLocation: { lat: 37.7749, lng: -122.4194 },
        endLocation: { lat: 38.0293, lng: -122.5653 },
      },
      {
        companyId: company.id,
        tripId: 'TR-20240602-001',
        vehicleId: vehicle1!.id,
        driverId: driver1!.id,
        startTime: new Date(),
        distanceKm: 0,
        durationMin: 0,
        status: 'IN_PROGRESS',
        startLocation: { lat: 37.7749, lng: -122.4194 },
      },
    ],
  });

  console.log('Created 3 trips');

  console.log('\n✅ Seed completed successfully!');
  console.log('\nDemo credentials:');
  console.log('  Email: admin@demo.com');
  console.log('  Password: password');
  console.log('\nAccess the app at: http://localhost:3000');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
