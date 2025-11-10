import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import {
  createShipment,
  listShipments,
} from "@/services/shipment-service";
import { ShipmentMode } from "@/types/prisma";
import { z } from "zod";

const schema = z.object({
  shipmentNumber: z.string(),
  origin: z.string(),
  destination: z.string(),
  carrierId: z.string().optional(),
  mode: z.nativeEnum(ShipmentMode),
  trackingNumber: z.string().optional(),
  weightKg: z.number().optional(),
  currentLatitude: z.number().optional(),
  currentLongitude: z.number().optional(),
});

export const GET = async (request: NextRequest) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const shipments = await listShipments();
  return apiSuccess(shipments);
};

export const POST = async (request: NextRequest) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return apiError(parsed.error.message, 422);
  }
  const created = await createShipment(parsed.data);
  return apiSuccess(created, 201);
};
