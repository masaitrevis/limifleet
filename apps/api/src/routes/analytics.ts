import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/fleet', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [tripsByDay, fuelByDay, alertsByDay, distanceByVehicle, driverPerformance] = await Promise.all([
      prisma.trip.groupBy({
        by: ['startTime'],
        where: { companyId, startTime: { gte: since } },
        _count: { id: true },
        _sum: { distanceKm: true }
      }),
      prisma.fuelRecord.groupBy({
        by: ['recordedAt'],
        where: { vehicle: { companyId }, recordedAt: { gte: since } },
        _sum: { amountL: true, cost: true }
      }),
      prisma.alert.groupBy({
        by: ['type'],
        where: { companyId, occurredAt: { gte: since } },
        _count: { id: true }
      }),
      prisma.trip.groupBy({
        by: ['vehicleId'],
        where: { companyId, startTime: { gte: since } },
        _sum: { distanceKm: true },
        _count: { id: true }
      }),
      prisma.driver.findMany({
        where: { companyId },
        orderBy: { safetyScore: 'asc' },
        take: 10,
        select: {
          firstName: true, lastName: true, safetyScore: true,
          _count: { select: { trips: true, behaviorEvents: true } }
        }
      })
    ]);

    res.json({
      tripsByDay,
      fuelByDay,
      alertsByDay,
      distanceByVehicle,
      driverPerformance
    });
  } catch (err) { next(err); }
});

export { router as analyticsRouter };
