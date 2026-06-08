import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/redis';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const cacheKey = `dashboard:${companyId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalVehicles,
      activeVehicles,
      offlineVehicles,
      driversOnline,
      todayTrips,
      totalDistanceToday,
      totalFuelToday,
      maintenanceDue,
      maintenanceOverdue,
      fuelAnomalies,
      unreadAlerts,
      recentTrips,
      recentAlerts,
      vehicleStatusBreakdown,
      driverStatusBreakdown,
      fuelEfficiencyTrend,
      weeklyDistance,
      fleetHealthScore
    ] = await Promise.all([
      prisma.vehicle.count({ where: { companyId, status: { not: 'RETIRED' } } }),
      prisma.vehicle.count({
        where: { companyId, status: 'ACTIVE', lastLocation: { isNot: null, ignition: true } }
      }),
      prisma.vehicle.count({
        where: {
          companyId,
          status: 'ACTIVE',
          OR: [
            { lastLocation: null },
            { lastLocation: { ignition: false } }
          ]
        }
      }),
      prisma.driver.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.trip.count({
        where: { companyId, startTime: { gte: todayStart, lt: todayEnd } }
      }),
      prisma.trip.aggregate({
        where: { companyId, startTime: { gte: todayStart, lt: todayEnd } },
        _sum: { distanceKm: true }
      }),
      prisma.fuelRecord.aggregate({
        where: { vehicle: { companyId }, recordedAt: { gte: todayStart, lt: todayEnd } },
        _sum: { amountL: true }
      }),
      prisma.maintenanceRecord.count({
        where: {
          vehicle: { companyId },
          status: 'SCHEDULED',
          scheduledAt: { lte: now }
        }
      }),
      prisma.maintenanceRecord.count({
        where: {
          vehicle: { companyId },
          status: 'OVERDUE'
        }
      }),
      prisma.fuelRecord.count({
        where: { vehicle: { companyId }, isAnomaly: true, recordedAt: { gte: weekStart } }
      }),
      prisma.alert.count({
        where: { companyId, isRead: false }
      }),
      prisma.trip.findMany({
        where: { companyId },
        orderBy: { startTime: 'desc' },
        take: 5,
        include: {
          vehicle: { select: { vehicleId: true, registrationNumber: true } },
          driver: { select: { firstName: true, lastName: true } }
        }
      }),
      prisma.alert.findMany({
        where: { companyId },
        orderBy: { occurredAt: 'desc' },
        take: 5,
        include: {
          vehicle: { select: { vehicleId: true, registrationNumber: true } }
        }
      }),
      prisma.vehicle.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true }
      }),
      prisma.driver.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true }
      }),
      prisma.fuelRecord.groupBy({
        by: ['recordedAt'],
        where: { vehicle: { companyId }, recordedAt: { gte: weekStart } },
        _sum: { amountL: true }
      }),
      prisma.trip.groupBy({
        by: ['startTime'],
        where: { companyId, startTime: { gte: weekStart } },
        _sum: { distanceKm: true }
      }),
      prisma.fleetHealthSnapshot.findFirst({
        where: { companyId },
        orderBy: { date: 'desc' }
      })
    ]);

    const result = {
      summary: {
        totalVehicles,
        activeVehicles,
        offlineVehicles,
        driversOnline,
        todayTrips,
        totalDistanceToday: totalDistanceToday._sum.distanceKm || 0,
        totalFuelToday: totalFuelToday._sum.amountL || 0,
        maintenanceDue,
        maintenanceOverdue,
        fuelAnomalies,
        unreadAlerts
      },
      recentTrips,
      recentAlerts,
      vehicleStatusBreakdown: vehicleStatusBreakdown.reduce((acc: any, s: any) => {
        acc[s.status] = s._count.id;
        return acc;
      }, {}),
      driverStatusBreakdown: driverStatusBreakdown.reduce((acc: any, s: any) => {
        acc[s.status] = s._count.id;
        return acc;
      }, {}),
      fleetHealthScore: fleetHealthScore?.overallScore || 100,
      fleetHealthInsights: fleetHealthScore?.insights || []
    };

    await cacheSet(cacheKey, JSON.stringify(result), 30);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router as dashboardRouter };