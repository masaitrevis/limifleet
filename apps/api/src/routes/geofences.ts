import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const geofences = await prisma.geofence.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ geofences });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('type').isIn(['CIRCLE', 'POLYGON', 'POLYLINE']),
  body('config').isObject(),
  body('vehicles').isArray(),
], async (req, res, next) => {
  try {
    const geofence = await prisma.geofence.create({
      data: { ...req.body, companyId: req.user!.companyId }
    });
    res.status(201).json({ geofence });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const geofence = await prisma.geofence.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });
    if (!geofence) throw new AppError('Geofence not found', 404);
    const updated = await prisma.geofence.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ geofence: updated });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const geofence = await prisma.geofence.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });
    if (!geofence) throw new AppError('Geofence not found', 404);
    await prisma.geofence.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ message: 'Geofence deactivated' });
  } catch (err) { next(err); }
});

export { router as geofenceRouter };