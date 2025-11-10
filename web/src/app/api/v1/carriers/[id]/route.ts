import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import {
  deleteCarrier,
  updateCarrier,
} from "@/services/carrier-service";
import { ShipmentMode } from "@/types/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().optional(),
  modes: z.nativeEnum(ShipmentMode).array().optional(),
  apiCredentials: z.record(z.string(), z.any()).optional(),
  rateCards: z.record(z.string(), z.any()).optional(),
  performanceMetrics: z.record(z.string(), z.any()).optional(),
});

type Params = {
  params: Promise<{
    id: string;
  }>;
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

  const updated = await updateCarrier(id, parsed.data);
  return apiSuccess(updated);
};

export const DELETE = async (request: NextRequest, context: Params) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const { id } = await context.params;
  await deleteCarrier(id);
  return apiSuccess({ id });
};
