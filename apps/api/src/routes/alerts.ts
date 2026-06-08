import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const severity = req.query.severity as string;
    const isRead = req.query.isRead as string;
    const isResolved = req.query.isResolved as string;
    const vehicleId = req.query.vehicleId as string;

    const where: any = { companyId };
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (isResolved !== undefined) where.isResolved = isResolved === 'true';
    if (vehicleId) where.vehicleId = vehicleId;

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { occurredAt: 'desc' },
        include: {
          vehicle: { select: { vehicleId: true, registrationNumber: true } },
          geofence: { select: { name: true } }
        }
      }),
      prisma.alert.count({ where })
    ]);

    res.json({ alerts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const alert = await prisma.alert.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });
    if (!alert) throw new AppError('Alert not found', 404);

    const updated = await prisma.alert.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ alert: updated });
  } catch (err) { next(err); }
});

router.patch('/:id/resolve', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const alert = await prisma.alert.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    });
    if (!alert) throw new AppError('Alert not found', 404);

    const updated = await prisma.alert.update({
      where: { id: req.params.id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: req.user!.id
      }
    });
    res.json({ alert: updated });
  } catch (err) { next(err); }
});

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [byType, bySeverity, unreadCount, todayCount] = await Promise.all([
      prisma.alert.groupBy({
        by: ['type'],
        where: { companyId, occurredAt: { gte: since } },
        _count: { id: true }
      }),
      prisma.alert.groupBy({
        by: ['severity'],
        where: { companyId },
        _count: { id: true }
      }),
      prisma.alert.count({ where: { companyId, isRead: false } }),
      prisma.alert.count({ where: { companyId, occurredAt: { gte: since } } })
    ]);

    res.json({
      byType: byType.reduce((acc: any, t) => { acc[t.type] = t._count.id; return acc; }, {}),
      bySeverity: bySeverity.reduce((acc: any, s) => { acc[s.severity] = s._count.id; return acc; }, {}),
      unreadCount,
      todayCount
    });
  } catch (err) { next(err); }
});

export { router as alertRouter };