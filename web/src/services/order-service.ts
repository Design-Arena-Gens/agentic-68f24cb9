import { OrderPayload } from "@/types/api";
import { OrderStatus } from "@/types/prisma";
import { prisma } from "@/lib/prisma";

export const listOrders = () =>
  prisma.order.findMany({
    include: {
      shipments: {
        include: {
          shipment: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

export const createOrder = async (
  payload: OrderPayload,
  ownerId?: string,
) => {
  return prisma.order.create({
    data: {
      orderNumber: payload.orderNumber,
      customerRef: payload.customerRef,
      pickupDate: payload.pickupDate
        ? new Date(payload.pickupDate)
        : undefined,
      deliveryDate: payload.deliveryDate
        ? new Date(payload.deliveryDate)
        : undefined,
      amount: payload.amount,
      status: payload.status ?? OrderStatus.PENDING,
      priority: payload.priority ?? 0,
      ownerId,
    },
  });
};

export const updateOrder = async (id: string, payload: Partial<OrderPayload>) =>
  prisma.order.update({
    where: { id },
    data: {
      orderNumber: payload.orderNumber,
      customerRef: payload.customerRef,
      pickupDate: payload.pickupDate ? new Date(payload.pickupDate) : undefined,
      deliveryDate: payload.deliveryDate
        ? new Date(payload.deliveryDate)
        : undefined,
      amount: payload.amount,
      status: payload.status,
      priority: payload.priority,
    },
  });

export const deleteOrder = (id: string) =>
  prisma.order.delete({
    where: { id },
  });

export const getOrderById = (id: string) =>
  prisma.order.findUnique({
    where: { id },
    include: {
      shipments: {
        include: {
          shipment: true,
        },
      },
      customFields: true,
    },
  });
