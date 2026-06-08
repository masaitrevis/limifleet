import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { companyId: req.user!.companyId }
    });
    res.json({ settings });
  } catch (err) { next(err); }
});

router.patch('/', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), [
  body('speedLimitKmh').optional().isFloat({ min: 0, max: 300 }),
  body('idleAlertMinutes').optional().isInt({ min: 1 }),
  body('maintenanceWindowKm').optional().isInt({ min: 100 }),
  body('fuelAlertThreshold').optional().isFloat({ min: 0, max: 1 }),
], async (req, res, next) => {
  try {
    const settings = await prisma.companySettings.update({
      where: { companyId: req.user!.companyId },
      data: req.body
    });
    res.json({ settings });
  } catch (err) { next(err); }
});

export { router as settingsRouter };