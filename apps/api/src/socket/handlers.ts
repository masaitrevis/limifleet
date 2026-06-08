import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const connectedClients = new Map<string, string>(); // socketId -> userId
const companyRooms = new Map<string, Set<string>>(); // companyId -> Set of socketIds

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('authenticate', async (token: string) => {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, companyId: true, role: true }
        });
        if (user) {
          connectedClients.set(socket.id, user.id);
          socket.join(`company:${user.companyId}`);
          socket.join(`user:${user.id}`);
          if (!companyRooms.has(user.companyId)) {
            companyRooms.set(user.companyId, new Set());
          }
          companyRooms.get(user.companyId)!.add(socket.id);
          socket.emit('authenticated', { userId: user.id, companyId: user.companyId });
          logger.info(`Socket ${socket.id} authenticated as user ${user.id}`);
        }
      } catch (err) {
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    socket.on('subscribe_vehicle', (vehicleId: string) => {
      socket.join(`vehicle:${vehicleId}`);
      logger.info(`Socket ${socket.id} subscribed to vehicle ${vehicleId}`);
    });

    socket.on('unsubscribe_vehicle', (vehicleId: string) => {
      socket.leave(`vehicle:${vehicleId}`);
    });

    socket.on('subscribe_driver', (driverId: string) => {
      socket.join(`driver:${driverId}`);
    });

    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', () => {
      const userId = connectedClients.get(socket.id);
      if (userId) {
        connectedClients.delete(socket.id);
        // Clean up company rooms
        for (const [companyId, sockets] of companyRooms.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              companyRooms.delete(companyId);
            }
          }
        }
      }
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}

export function broadcastVehicleLocation(companyId: string, vehicleId: string, location: any) {
  const io = global.io as Server;
  if (io) {
    io.to(`company:${companyId}`).emit('vehicle_location', { vehicleId, location });
    io.to(`vehicle:${vehicleId}`).emit('location_update', location);
  }
}

export function broadcastAlert(companyId: string, alert: any) {
  const io = global.io as Server;
  if (io) {
    io.to(`company:${companyId}`).emit('alert', alert);
  }
}

export function broadcastTripUpdate(companyId: string, trip: any) {
  const io = global.io as Server;
  if (io) {
    io.to(`company:${companyId}`).emit('trip_update', trip);
  }
}
