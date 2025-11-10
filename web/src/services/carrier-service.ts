import { prisma } from "@/lib/prisma";
import { CarrierPayload } from "@/types/api";
import { Prisma } from "@/generated/prisma/client";

export const listCarriers = () =>
  prisma.carrier.findMany({
    orderBy: {
      name: "asc",
    },
  });

export const createCarrier = (payload: CarrierPayload) =>
  prisma.carrier.create({
    data: {
      name: payload.name,
      modes: payload.modes,
      apiCredentials: payload.apiCredentials as Prisma.InputJsonValue,
      rateCards: payload.rateCards as Prisma.InputJsonValue,
      performanceMetrics: payload.performanceMetrics as Prisma.InputJsonValue,
    },
  });

export const updateCarrier = (
  id: string,
  payload: Partial<CarrierPayload>,
) =>
  prisma.carrier.update({
    where: { id },
    data: {
      name: payload.name,
      modes: payload.modes,
      apiCredentials: payload.apiCredentials as Prisma.InputJsonValue,
      rateCards: payload.rateCards as Prisma.InputJsonValue,
      performanceMetrics: payload.performanceMetrics as Prisma.InputJsonValue,
    },
  });

export const deleteCarrier = (id: string) =>
  prisma.carrier.delete({
    where: { id },
  });
