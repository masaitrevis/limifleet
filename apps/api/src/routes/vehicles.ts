import { Router } from 'express';
import { body, query as queryValidator } from 'express-validator';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../lib/redis';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// List vehicles with filters
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'FLEET_MANAGER', 'VIEWER'),
  [
    queryValidator('page').optional().isInt({ min: 1 }),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
    queryValidator('status').optional().isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED']),
    queryValidator('type').optional().isString(),
    queryValidator('search').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const companyId = req.user!.companyId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const search = req.query.search as string;

      const cacheKey = `vehicles:${companyId}:${page}:${limit}:${status || 'all'}:${type || 'all'}:${search || 'all'}`;
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const where: any = { companyId };
      if (status) where.status = status;
      if (type) where.type = type;
      if (search) {
        where.OR = [
          { vehicleId: { contains: search, mode: 'insensitive' } },
          { registrationNumber: { contains: search, mode: 'insensitive' } },
          { manufacturer: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            assignedDriver: {
              select: { id: true, firstName: true, lastName: true, driverId: true }
            },
            lastLocation: {
              select: { lat: true, lng: true, speedKmh: true, ignition: true, recordedAt: true }
            },
            _count: {
              select: { trips: true, maintenanceRecords: true, fuelRecords: true }
            }
          }
        }),
        prisma.vehicle.count({ where })
      ]);

      const result = { vehicles, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
      await cacheSet(cacheKey, JSON.stringify(result), 60);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Get vehicle by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        assignedDriver: true,
        gpsDevice: { select: { id: true, imei: true, isActive: true, lastSeenAt: true } },
        lastLocation: true,
        _count: {
          select: { trips: true, maintenanceRecords: true, fuelRecords: true, alerts: true }
        }
      }
    });

    if (!vehicle) throw new AppError('Vehicle not found', 404);
    res.json({ vehicle });
  } catch (err) {
    next(err);
  }
});

// Create vehicle
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'FLEET_MANAGER'),
  [
    body('vehicleId').trim().isLength({ min: 1, max: 50 }),
    body('registrationNumber').trim().isLength({ min: 1, max: 50 }),
    body('type').isIn(['TRUCK', 'VAN', 'BUS', 'CAR', 'MOTORCYCLE', 'TRAILER', 'CONSTRUCTION', 'MINING', 'EMERGENCY', 'OTHER']),
    body('manufacturer').trim().isLength({ min: 1 }),
    body('model').trim().isLength({ min: 1 }),
    body('year').isInt({ min: 1900, max: 2100 }),
  ],
  async (req, res, next) => {
    try {
      const data = { ...req.body, companyId: req.user!.companyId };
      const vehicle = await prisma.vehicle.create({
        data,
        include: { assignedDriver: { select: { id: true, firstName: true, lastName: true } } }
      });
      await cacheInvalidatePattern(`vehicles:${req.user!.companyId}:*`);
      res.status(201).json({ vehicle });
    } catch (err) {
      next(err);
    }
  }
);

// Update vehicle
router.patch('/:id', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body,
      include: { assignedDriver: { select: { id: true, firstName: true, lastName: true } } }
    });

    await cacheInvalidatePattern(`vehicles:${req.user!.companyId}:*`);
    res.json({ vehicle: updated });
  } catch (err) {
    next(err);
  }
});

// Delete vehicle
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { status: 'RETIRED', assignedDriverId: null }
    });

    await cacheInvalidatePattern(`vehicles:${req.user!.companyId}:*`);
    res.json({ message: 'Vehicle retired successfully' });
  } catch (err) {
    next(err);
  }
});

// Vehicle history
router.get('/:id/history', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const vehicleId = req.params.id;

    const [locations, trips, fuelRecords, maintenanceRecords] = await Promise.all([
      prisma.vehicleLocation.findMany({
        where: { vehicleId },
        orderBy: { recordedAt: 'desc' },
        take: 500
      }),
      prisma.trip.findMany({
        where: { vehicleId },
        orderBy: { startTime: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { driver: { select: { firstName: true, lastName: true } } }
      }),
      prisma.fuelRecord.findMany({
        where: { vehicleId },
        orderBy: { recordedAt: 'desc' },
        take: 100
      }),
      prisma.maintenanceRecord.findMany({
        where: { vehicleId },
        orderBy: { scheduledAt: 'desc' },
        take: 50
      })
    ]);

    res.json({ locations, trips, fuelRecords, maintenanceRecords });
  } catch (err) {
    next(err);
  }
});

export { router as vehicleRouter };