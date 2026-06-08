import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/chat', authenticate, async (req, res, next) => {
  try {
    const { question } = req.body;
    const companyId = req.user!.companyId;

    const lowerQ = question.toLowerCase();
    let response: any = {};

    // Maintenance prediction
    if (lowerQ.includes('maintenance') || lowerQ.includes('repair') || lowerQ.includes('service')) {
      const upcoming = await prisma.maintenanceRecord.findMany({
        where: { vehicle: { companyId }, status: { in: ['SCHEDULED', 'OVERDUE'] } },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
        include: { vehicle: { select: { vehicleId: true, registrationNumber: true } } }
      });
      const overdue = await prisma.maintenanceRecord.count({
        where: { vehicle: { companyId }, status: 'OVERDUE' }
      });
      response = {
        type: 'maintenance',
        upcoming: upcoming.length,
        overdue,
        vehicles: upcoming.map(r => ({
          vehicle: r.vehicle.vehicleId,
          registration: r.vehicle.registrationNumber,
          title: r.title,
          scheduledAt: r.scheduledAt,
          priority: r.priority
        }))
      };
    }
    // Fuel analysis
    else if (lowerQ.includes('fuel') || lowerQ.includes('consumption') || lowerQ.includes('efficiency')) {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const records = await prisma.fuelRecord.findMany({
        where: { vehicle: { companyId }, recordedAt: { gte: since } },
        include: { vehicle: { select: { vehicleId: true, registrationNumber: true } } },
        orderBy: { amountL: 'desc' }
      });
      const totalFuel = records.reduce((s, r) => s + r.amountL, 0);
      const anomalies = records.filter(r => r.isAnomaly).length;
      response = {
        type: 'fuel',
        totalFuel30Days: totalFuel,
        anomalies,
        topVehicles: records.slice(0, 5).map(r => ({
          vehicle: r.vehicle.vehicleId,
          fuel: r.amountL,
          isAnomaly: r.isAnomaly
        }))
      };
    }
    // Driver behavior
    else if (lowerQ.includes('driver') || lowerQ.includes('behavior') || lowerQ.includes('risk')) {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const drivers = await prisma.driver.findMany({
        where: { companyId },
        orderBy: { safetyScore: 'asc' },
        take: 10,
        include: {
          _count: { select: { behaviorEvents: true } },
          behaviorEvents: { where: { occurredAt: { gte: since } } }
        }
      });
      response = {
        type: 'driver',
        drivers: drivers.map(d => ({
          name: `${d.firstName} ${d.lastName}`,
          safetyScore: d.safetyScore,
          incidents: d._count.behaviorEvents,
          recentEvents: d.behaviorEvents.map(e => e.eventType)
        }))
      };
    }
    // Vehicle utilization
    else if (lowerQ.includes('utilization') || lowerQ.includes('underutilized') || lowerQ.includes('usage')) {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const vehicles = await prisma.vehicle.findMany({
        where: { companyId, status: 'ACTIVE' },
        include: {
          trips: { where: { startTime: { gte: since } }, select: { distanceKm: true } }
        }
      });
      const sorted = vehicles
        .map(v => ({
          vehicleId: v.vehicleId,
          registrationNumber: v.registrationNumber,
          totalDistance: v.trips.reduce((s, t) => s + (t.distanceKm || 0), 0),
          tripCount: v.trips.length
        }))
        .sort((a, b) => a.totalDistance - b.totalDistance);
      response = {
        type: 'utilization',
        underutilized: sorted.slice(0, 5),
        mostUtilized: sorted.slice(-5)
      };
    }
    // Fleet health
    else {
      const health = await prisma.fleetHealthSnapshot.findFirst({
        where: { companyId },
        orderBy: { date: 'desc' }
      });
      const totalVehicles = await prisma.vehicle.count({ where: { companyId } });
      const activeDrivers = await prisma.driver.count({ where: { companyId, status: 'ACTIVE' } });
      const todayTrips = await prisma.trip.count({
        where: { companyId, startTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      });
      response = {
        type: 'fleet_health',
        overallScore: health?.overallScore || 100,
        fuelScore: health?.fuelScore || 100,
        maintenanceScore: health?.maintenanceScore || 100,
        driverScore: health?.driverScore || 100,
        utilizationScore: health?.utilizationScore || 100,
        totalVehicles,
        activeDrivers,
        todayTrips,
        insights: health?.insights || []
      };
    }

    res.json({ question, answer: response });
  } catch (err) { next(err); }
});

router.get('/predictions/maintenance', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const vehicles = await prisma.vehicle.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: {
        maintenanceRecords: { orderBy: { scheduledAt: 'desc' }, take: 5 },
        trips: { orderBy: { startTime: 'desc' }, take: 10, select: { distanceKm: true } }
      }
    });

    const predictions = vehicles.map(v => {
      const recentMaintenance = v.maintenanceRecords[0];
      const totalDistance = v.trips.reduce((s, t) => s + (t.distanceKm || 0), 0);
      const nextServiceKm = (v.odometerKm || 0) + 5000;
      const riskScore = recentMaintenance?.status === 'OVERDUE' ? 90 : totalDistance > 5000 ? 60 : 30;

      return {
        vehicleId: v.vehicleId,
        registrationNumber: v.registrationNumber,
        riskScore,
        riskLevel: riskScore > 80 ? 'HIGH' : riskScore > 50 ? 'MEDIUM' : 'LOW',
        predictedIssues: riskScore > 60 ? ['Engine check', 'Oil change'] : ['Routine inspection'],
        nextServiceKm,
        daysUntilService: Math.max(0, 30 - Math.floor(totalDistance / 200))
      };
    });

    res.json({ predictions: predictions.sort((a, b) => b.riskScore - a.riskScore) });
  } catch (err) { next(err); }
});

export { router as aiRouter };
