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
    const priority = req.query.priority as string;
    const upcoming = req.query.upcoming === 'true';

    const where: any = { vehicle: { companyId } };
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (priority) where.priority = priority;
    if (upcoming) {
      where.scheduledAt = { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };
    }

    const [records, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          vehicle: { select: { vehicleId: true, registrationNumber: true } }
        }
      }),
      prisma.maintenanceRecord.count({ where })
    ]);

    res.json({ records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), [
  body('vehicleId').isString(),
  body('type').isIn(['OIL_CHANGE', 'TIRE_ROTATION', 'BRAKE_INSPECTION', 'ENGINE_CHECK', 'TRANSMISSION', 'BATTERY', 'COOLANT', 'AIR_FILTER', 'FUEL_FILTER', 'TIRE_REPLACEMENT', 'GENERAL_INSPECTION', 'REGULATORY_INSPECTION', 'REPAIR', 'OTHER']),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('scheduledAt').isISO8601(),
], async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.body.vehicleId, companyId: req.user!.companyId }
    });
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const record = await prisma.maintenanceRecord.create({
      data: { ...req.body, createdBy: req.user!.id },
      include: {
        vehicle: { select: { vehicleId: true, registrationNumber: true } }
      }
    });
    res.status(201).json({ record });
  } catch (err) { next(err); }
});

router.patch('/:id/complete', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const record = await prisma.maintenanceRecord.findFirst({
      where: { id: req.params.id, vehicle: { companyId: req.user!.companyId } }
    });
    if (!record) throw new AppError('Maintenance record not found', 404);

    const { completedAt, cost, parts, odometerKm, nextDueKm, nextDueDate } = req.body;
    const updated = await prisma.maintenanceRecord.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(completedAt),
        cost,
        parts,
        odometerKm,
        nextDueKm,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null
      }
    });

    res.json({ record: updated });
  } catch (err) { next(err); }
});

router.get('/upcoming', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const days = parseInt(req.query.days as string) || 7;
    const deadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const records = await prisma.maintenanceRecord.findMany({
      where: {
        vehicle: { companyId },
        status: { in: ['SCHEDULED', 'OVERDUE'] },
        scheduledAt: { lte: deadline }
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        vehicle: { select: { vehicleId: true, registrationNumber: true } }
      }
    });

    res.json({ records, count: records.length });
  } catch (err) { next(err); }
});

export { router as maintenanceRouter };