import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const vehicleId = req.query.vehicleId as string;
    const driverId = req.query.driverId as string;
    const from = req.query.from as string;
    const to = req.query.to as string;

    const where: any = { companyId };
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;
    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = new Date(from);
      if (to) where.startTime.lte = new Date(to);
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          vehicle: { select: { vehicleId: true, registrationNumber: true } },
          driver: { select: { firstName: true, lastName: true, driverId: true } }
        }
      }),
      prisma.trip.count({ where })
    ]);

    res.json({ trips, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        vehicle: true,
        driver: true,
        behaviors: { orderBy: { occurredAt: 'asc' } },
        alerts: { orderBy: { occurredAt: 'asc' } }
      }
    });
    if (!trip) throw new AppError('Trip not found', 404);
    res.json({ trip });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), [
  body('vehicleId').isString(),
  body('driverId').isString(),
  body('tripId').trim().isLength({ min: 1 }),
  body('startTime').isISO8601(),
], async (req, res, next) => {
  try {
    const data = { ...req.body, companyId: req.user!.companyId };
    const trip = await prisma.trip.create({
      data,
      include: {
        vehicle: { select: { vehicleId: true, registrationNumber: true } },
        driver: { select: { firstName: true, lastName: true } }
      }
    });
    res.status(201).json({ trip });
  } catch (err) { next(err); }
});

router.patch('/:id/end', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });
    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.status === 'COMPLETED') throw new AppError('Trip already completed', 400);

    const { endTime, endLat, endLng, distanceKm, durationMin, fuelUsedL } = req.body;
    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        endTime: new Date(endTime),
        endLat,
        endLng,
        distanceKm,
        durationMin,
        fuelUsedL,
        status: 'COMPLETED'
      }
    });

    await prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { odometerKm: { increment: distanceKm } }
    });

    res.json({ trip: updated });
  } catch (err) { next(err); }
});

router.get('/:id/replay', authenticate, async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      select: { id: true, route: true, vehicleId: true, startTime: true, endTime: true }
    });
    if (!trip) throw new AppError('Trip not found', 404);

    let route = trip.route as any[] || [];
    if (!route.length && trip.startTime) {
      const locations = await prisma.vehicleLocation.findMany({
        where: {
          vehicleId: trip.vehicleId,
          recordedAt: {
            gte: trip.startTime,
            ...(trip.endTime && { lte: trip.endTime })
          }
        },
        orderBy: { recordedAt: 'asc' },
        select: { lat: true, lng: true, speedKmh: true, recordedAt: true, ignition: true }
      });
      route = locations;
    }

    res.json({ route, startTime: trip.startTime, endTime: trip.endTime });
  } catch (err) { next(err); }
});

export { router as tripRouter };