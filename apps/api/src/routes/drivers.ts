import { Router } from 'express';
import { body, query as queryValidator } from 'express-validator';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../lib/redis';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const cacheKey = `drivers:${companyId}:${page}:${limit}:${status || 'all'}:${search || 'all'}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const where: any = { companyId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { driverId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedVehicle: { select: { id: true, vehicleId: true, registrationNumber: true, status: true } },
          _count: { select: { trips: true, behaviorEvents: true } }
        }
      }),
      prisma.driver.count({ where })
    ]);

    const result = { drivers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    await cacheSet(cacheKey, JSON.stringify(result), 60);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const driver = await prisma.driver.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        assignedVehicle: true,
        trips: {
          orderBy: { startTime: 'desc' },
          take: 10,
          include: { vehicle: { select: { vehicleId: true, registrationNumber: true } } }
        },
        behaviorEvents: {
          orderBy: { occurredAt: 'desc' },
          take: 20
        }
      }
    });
    if (!driver) throw new AppError('Driver not found', 404);
    res.json({ driver });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), [
  body('driverId').trim().isLength({ min: 1, max: 50 }),
  body('firstName').trim().isLength({ min: 1, max: 50 }),
  body('lastName').trim().isLength({ min: 1, max: 50 }),
  body('phone').trim().isLength({ min: 5, max: 20 }),
  body('licenseNumber').trim().isLength({ min: 1, max: 50 }),
  body('licenseExpiry').isISO8601(),
], async (req, res, next) => {
  try {
    const driver = await prisma.driver.create({
      data: { ...req.body, companyId: req.user!.companyId },
      include: { assignedVehicle: { select: { id: true, vehicleId: true } } }
    });
    await cacheInvalidatePattern(`drivers:${req.user!.companyId}:*`);
    res.status(201).json({ driver });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const driver = await prisma.driver.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });
    if (!driver) throw new AppError('Driver not found', 404);
    const updated = await prisma.driver.update({
      where: { id: req.params.id },
      data: req.body,
      include: { assignedVehicle: { select: { id: true, vehicleId: true } } }
    });
    await cacheInvalidatePattern(`drivers:${req.user!.companyId}:*`);
    res.json({ driver: updated });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const driver = await prisma.driver.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });
    if (!driver) throw new AppError('Driver not found', 404);
    await prisma.driver.update({
      where: { id: req.params.id },
      data: { status: 'TERMINATED', assignedVehicleId: null }
    });
    await cacheInvalidatePattern(`drivers:${req.user!.companyId}:*`);
    res.json({ message: 'Driver terminated' });
  } catch (err) { next(err); }
});

router.get('/:id/performance', authenticate, async (req, res, next) => {
  try {
    const { days = '30' } = req.query;
    const since = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
    const driverId = req.params.id;

    const [trips, behaviors, fuel] = await Promise.all([
      prisma.trip.findMany({
        where: { driverId, startTime: { gte: since } },
        select: { distanceKm: true, durationMin: true, maxSpeedKmh: true, fuelUsedL: true }
      }),
      prisma.driverBehavior.groupBy({
        by: ['eventType'],
        where: { driverId, occurredAt: { gte: since } },
        _count: { id: true }
      }),
      prisma.fuelRecord.findMany({
        where: { driverId, recordedAt: { gte: since } },
        select: { amountL: true, distanceKm: true }
      })
    ]);

    const totalDistance = trips.reduce((s, t) => s + (t.distanceKm || 0), 0);
    const totalDuration = trips.reduce((s, t) => s + (t.durationMin || 0), 0);
    const totalFuel = fuel.reduce((s, f) => s + (f.amountL || 0), 0);
    const avgSpeed = totalDistance / (totalDuration / 60) || 0;
    const fuelEfficiency = totalDistance / totalFuel || 0;

    const safetyScore = Math.max(0, 100 - behaviors.reduce((s, b) => s + b._count.id * 2, 0));

    res.json({
      period: days + ' days',
      trips: trips.length,
      totalDistance,
      totalDuration,
      avgSpeed,
      fuelEfficiency,
      safetyScore,
      behaviorBreakdown: behaviors.reduce((acc: any, b) => { acc[b.eventType] = b._count.id; return acc; }, {})
    });
  } catch (err) { next(err); }
});

export { router as driverRouter };