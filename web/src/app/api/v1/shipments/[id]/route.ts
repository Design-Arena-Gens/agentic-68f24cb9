import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import {
  deleteShipment,
  getShipmentById,
  updateShipment,
} from "@/services/shipment-service";
import { ShipmentMode } from "@/types/prisma";
import { z } from "zod";

const schema = z.object({
  shipmentNumber: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  carrierId: z.string().optional(),
  mode: z.nativeEnum(ShipmentMode).optional(),
  trackingNumber: z.string().optional(),
  weightKg: z.number().optional(),
  currentLatitude: z.number().optional(),
  currentLongitude: z.number().optional(),
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
  const shipment = await getShipmentById(id);
  if (!shipment) {
    return apiError("Not Found", 404);
  }

  return apiSuccess(shipment);
};

export const PUT = async (request: NextRequest, context: Params) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const { id } = await context.params;
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return apiError(parsed.error.message, 422);
  }

  const updated = await updateShipment(id, parsed.data);
  return apiSuccess(updated);
};

export const DELETE = async (request: NextRequest, context: Params) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const { id } = await context.params;
  await deleteShipment(id);
  return apiSuccess({ id });
};
