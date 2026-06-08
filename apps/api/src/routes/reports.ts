import { Router } from 'express';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/vehicles', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const format = req.query.format as string || 'json';

    const vehicles = await prisma.vehicle.findMany({
      where: { companyId },
      include: {
        assignedDriver: { select: { firstName: true, lastName: true } },
        _count: { select: { trips: true, fuelRecords: true, maintenanceRecords: true } }
      }
    });

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(vehicles);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=vehicles.csv');
      return res.send(csv);
    }

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=vehicles.pdf');
      doc.pipe(res);
      doc.fontSize(20).text('Vehicle Report', 100, 80);
      doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`, 100, 120);
      vehicles.forEach((v, i) => {
        doc.text(`${i+1}. ${v.vehicleId} - ${v.manufacturer} ${v.model} (${v.registrationNumber}) - Status: ${v.status}`);
      });
      doc.end();
      return;
    }

    res.json({ vehicles, count: vehicles.length });
  } catch (err) { next(err); }
});

router.get('/trips', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const format = req.query.format as string || 'json';

    const trips = await prisma.trip.findMany({
      where: { companyId, startTime: { gte: since } },
      include: {
        vehicle: { select: { vehicleId: true, registrationNumber: true } },
        driver: { select: { firstName: true, lastName: true } }
      }
    });

    const totalDistance = trips.reduce((s, t) => s + (t.distanceKm || 0), 0);
    const totalDuration = trips.reduce((s, t) => s + (t.durationMin || 0), 0);

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(trips);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=trips.csv');
      return res.send(csv);
    }

    res.json({
      trips,
      summary: { totalTrips: trips.length, totalDistance, totalDuration, avgDistance: totalDistance / trips.length || 0 }
    });
  } catch (err) { next(err); }
});

router.get('/fuel', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const format = req.query.format as string || 'json';

    const records = await prisma.fuelRecord.findMany({
      where: { vehicle: { companyId }, recordedAt: { gte: since } },
      include: { vehicle: { select: { vehicleId: true } } }
    });

    const totalFuel = records.reduce((s, r) => s + r.amountL, 0);
    const totalCost = records.reduce((s, r) => s + (r.cost || 0), 0);
    const anomalies = records.filter(r => r.isAnomaly).length;

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=fuel.csv');
      return res.send(csv);
    }

    res.json({
      records,
      summary: { totalFuel, totalCost, recordCount: records.length, anomalies, avgCostPerL: totalCost / totalFuel || 0 }
    });
  } catch (err) { next(err); }
});

router.get('/maintenance', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const days = parseInt(req.query.days as string) || 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const format = req.query.format as string || 'json';

    const records = await prisma.maintenanceRecord.findMany({
      where: { vehicle: { companyId }, createdAt: { gte: since } },
      include: { vehicle: { select: { vehicleId: true, registrationNumber: true } } }
    });

    const totalCost = records.reduce((s, r) => s + (r.cost || 0), 0);
    const byType = records.reduce((acc: any, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=maintenance.csv');
      return res.send(csv);
    }

    res.json({ records, summary: { totalCost, totalRecords: records.length, byType } });
  } catch (err) { next(err); }
});

export { router as reportRouter };