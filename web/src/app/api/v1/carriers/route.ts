import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import {
  createCarrier,
  listCarriers,
} from "@/services/carrier-service";
import { ShipmentMode } from "@/types/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  modes: z.nativeEnum(ShipmentMode).array().nonempty(),
  apiCredentials: z.record(z.string(), z.any()).optional(),
  rateCards: z.record(z.string(), z.any()).optional(),
  performanceMetrics: z.record(z.string(), z.any()).optional(),
});

export const GET = async (request: NextRequest) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const carriers = await listCarriers();
  return apiSuccess(carriers);
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

  const carrier = await createCarrier(parsed.data);
  return apiSuccess(carrier, 201);
};
