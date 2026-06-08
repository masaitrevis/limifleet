import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      include: {
        settings: true,
        _count: {
          select: { users: true, vehicles: true, drivers: true }
        }
      }
    });
    res.json({ company });
  } catch (err) { next(err); }
});

router.patch('/me', authenticate, authorize('ADMIN'), [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail(),
  body('timezone').optional().isIn(['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney']),
], async (req, res, next) => {
  try {
    const company = await prisma.company.update({
      where: { id: req.user!.companyId },
      data: req.body
    });
    res.json({ company });
  } catch (err) { next(err); }
});

router.get('/users', authenticate, authorize('ADMIN', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isActive: true, lastLoginAt: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ users });
  } catch (err) { next(err); }
});

router.post('/users', authenticate, authorize('ADMIN'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('role').isIn(['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'VIEWER']),
], async (req, res, next) => {
  try {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        passwordHash,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        role: req.body.role,
        companyId: req.user!.companyId
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isActive: true, createdAt: true
      }
    });
    res.status(201).json({ user });
  } catch (err) { next(err); }
});

export { router as companyRouter };
