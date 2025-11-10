import { prisma } from "@/lib/prisma";
import { ShipmentPayload } from "@/types/api";

export const listShipments = () =>
  prisma.shipment.findMany({
    include: {
      milestones: {
        orderBy: {
          occurredAt: "desc",
        },
      },
      orders: {
        include: {
          order: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

export const createShipment = (payload: ShipmentPayload) =>
  prisma.shipment.create({
    data: {
      shipmentNumber: payload.shipmentNumber,
      origin: payload.origin,
      destination: payload.destination,
      carrierId: payload.carrierId,
      mode: payload.mode,
      trackingNumber: payload.trackingNumber,
      weightKg: payload.weightKg,
      currentLatitude: payload.currentLatitude,
      currentLongitude: payload.currentLongitude,
    },
  });

export const updateShipment = (
  id: string,
  payload: Partial<ShipmentPayload>,
) =>
  prisma.shipment.update({
    where: { id },
    data: {
      shipmentNumber: payload.shipmentNumber,
      origin: payload.origin,
      destination: payload.destination,
      carrierId: payload.carrierId,
      mode: payload.mode,
      trackingNumber: payload.trackingNumber,
      weightKg: payload.weightKg,
      currentLatitude: payload.currentLatitude,
      currentLongitude: payload.currentLongitude,
    },
  });

export const deleteShipment = (id: string) =>
  prisma.shipment.delete({
    where: { id },
  });

export const getShipmentById = (id: string) =>
  prisma.shipment.findUnique({
    where: { id },
    include: {
      milestones: true,
      orders: {
        include: {
          order: true,
        },
      },
      customFields: true,
    },
  });
