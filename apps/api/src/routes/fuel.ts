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
    const vehicleId = req.query.vehicleId as string;
    const from = req.query.from as string;
    const to = req.query.to as string;
    const isAnomaly = req.query.isAnomaly as string;

    const where: any = { vehicle: { companyId } };
    if (vehicleId) where.vehicleId = vehicleId;
    if (isAnomaly !== undefined) where.isAnomaly = isAnomaly === 'true';
    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = new Date(from);
      if (to) where.recordedAt.lte = new Date(to);
    }

    const [records, total] = await Promise.all([
      prisma.fuelRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { recordedAt: 'desc' },
        include: {
          vehicle: { select: { vehicleId: true, registrationNumber: true } },
          driver: { select: { firstName: true, lastName: true } }
        }
      }),
      prisma.fuelRecord.count({ where })
    ]);

    res.json({ records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), [
  body('vehicleId').isString(),
  body('amountL').isFloat({ min: 0 }),
  body('odometerKm').isFloat({ min: 0 }),
  body('recordedAt').isISO8601(),
], async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.body.vehicleId, companyId: req.user!.companyId }
    });
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const data = req.body;
    if (data.cost && data.amountL) {
      data.costPerL = data.cost / data.amountL;
    }

    // Anomaly detection
    const prevRecords = await prisma.fuelRecord.findMany({
      where: { vehicleId: req.body.vehicleId },
      orderBy: { recordedAt: 'desc' },
      take: 5,
      select: { amountL: true, odometerKm: true }
    });

    if (prevRecords.length > 1) {
      const avgFuelPerKm = prevRecords.reduce((sum, r, i, arr) => {
        if (i === 0) return 0;
        const km = r.odometerKm - arr[i-1].odometerKm;
        return km > 0 ? sum + (r.amountL / km) : sum;
      }, 0) / (prevRecords.length - 1);

      const lastRecord = prevRecords[0];
      const kmDriven = data.odometerKm - lastRecord.odometerKm;
      if (kmDriven > 0) {
        const currentEfficiency = data.amountL / kmDriven;
        if (currentEfficiency > avgFuelPerKm * 2.5 || data.amountL > vehicle.tankCapacity * 1.1) {
          data.isAnomaly = true;
          data.anomalyReason = currentEfficiency > avgFuelPerKm * 2.5 ? 'High fuel consumption' : 'Overfill detected';
        }
      }
    }

    const record = await prisma.fuelRecord.create({
      data,
      include: {
        vehicle: { select: { vehicleId: true, registrationNumber: true } },
        driver: { select: { firstName: true, lastName: true } }
      }
    });

    res.status(201).json({ record });
  } catch (err) { next(err); }
});

router.get('/analytics/efficiency', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const records = await prisma.fuelRecord.findMany({
      where: { vehicle: { companyId }, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
      include: { vehicle: { select: { id: true, vehicleId: true, registrationNumber: true } } }
    });

    const vehicleEfficiency: any = {};
    records.forEach((r: any) => {
      const vid = r.vehicleId;
      if (!vehicleEfficiency[vid]) vehicleEfficiency[vid] = { vehicle: r.vehicle, totalFuel: 0, records: 0 };
      vehicleEfficiency[vid].totalFuel += r.amountL;
      vehicleEfficiency[vid].records++;
    });

    const totalFuel = records.reduce((s: number, r: any) => s + r.amountL, 0);
    const totalCost = records.reduce((s: number, r: any) => s + (r.cost || 0), 0);

    res.json({
      period: `${days} days`,
      totalFuel,
      totalCost,
      recordCount: records.length,
      vehicleBreakdown: Object.values(vehicleEfficiency),
      anomalies: records.filter((r: any) => r.isAnomaly).length
    });
  } catch (err) { next(err); }
});

export { router as fuelRouter };