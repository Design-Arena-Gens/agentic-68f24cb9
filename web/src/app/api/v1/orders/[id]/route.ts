import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import {
  deleteOrder,
  getOrderById,
  updateOrder,
} from "@/services/order-service";
import { OrderStatus } from "@/types/prisma";
import { z } from "zod";

const orderUpdateSchema = z.object({
  orderNumber: z.string().optional(),
  customerRef: z.string().optional(),
  pickupDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  amount: z.number().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  priority: z.number().int().optional(),
});

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = async (request: NextRequest, context: Params) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const { id } = await context.params;
  const order = await getOrderById(id);
  if (!order) {
    return apiError("Not Found", 404);
  }

  return apiSuccess(order);
};

export const PUT = async (request: NextRequest, context: Params) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = orderUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.message, 422);
  }

  const updated = await updateOrder(id, parsed.data);
  return apiSuccess(updated);
};

export const DELETE = async (request: NextRequest, context: Params) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const { id } = await context.params;
  await deleteOrder(id);
  return apiSuccess({ id });
};
