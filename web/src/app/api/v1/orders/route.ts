import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import { createOrder, listOrders } from "@/services/order-service";
import { OrderStatus } from "@/types/prisma";
import { z } from "zod";

const orderSchema = z.object({
  orderNumber: z.string(),
  customerRef: z.string().optional(),
  pickupDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  amount: z.number().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  priority: z.number().int().optional(),
});

export const GET = async (request: NextRequest) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const orders = await listOrders();
  return apiSuccess(orders);
};

export const POST = async (request: NextRequest) => {
  let auth;
  try {
    auth = requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const payload = await request.json();
  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(parsed.error.message, 422);
  }

  const order = await createOrder(parsed.data, auth.sub);
  return apiSuccess(order, 201);
};
