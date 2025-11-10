import { prisma } from "@/lib/prisma";
import { InventoryPayload } from "@/types/api";

export const listInventory = () =>
  prisma.inventory.findMany({
    include: {
      customFields: true,
    },
    orderBy: {
      sku: "asc",
    },
  });

export const createInventoryItem = (payload: InventoryPayload) =>
  prisma.inventory.create({
    data: {
      sku: payload.sku,
      warehouse: payload.warehouse,
      quantity: payload.quantity ?? 0,
      cost: payload.cost,
      reorderPoint: payload.reorderPoint ?? 0,
    },
  });

export const updateInventoryItem = (
  id: string,
  payload: Partial<InventoryPayload>,
) =>
  prisma.inventory.update({
    where: { id },
    data: {
      sku: payload.sku,
      warehouse: payload.warehouse,
      quantity: payload.quantity,
      cost: payload.cost,
      reorderPoint: payload.reorderPoint,
    },
  });

export const deleteInventoryItem = (id: string) =>
  prisma.inventory.delete({
    where: { id },
  });
