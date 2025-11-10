import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import {
  deleteInventoryItem,
  updateInventoryItem,
} from "@/services/inventory-service";
import { z } from "zod";

const schema = z.object({
  sku: z.string().optional(),
  warehouse: z.string().optional(),
  quantity: z.number().int().optional(),
  cost: z.number().optional(),
  reorderPoint: z.number().int().optional(),
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

  const updated = await updateInventoryItem(id, parsed.data);
  return apiSuccess(updated);
};

export const DELETE = async (request: NextRequest, context: Params) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const { id } = await context.params;
  await deleteInventoryItem(id);
  return apiSuccess({ id });
};
