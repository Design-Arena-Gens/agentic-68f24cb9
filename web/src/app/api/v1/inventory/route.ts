import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import {
  createInventoryItem,
  listInventory,
} from "@/services/inventory-service";
import { z } from "zod";

const schema = z.object({
  sku: z.string(),
  warehouse: z.string(),
  quantity: z.number().int().optional(),
  cost: z.number().optional(),
  reorderPoint: z.number().int().optional(),
});

export const GET = async (request: NextRequest) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const inventory = await listInventory();
  return apiSuccess(inventory);
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

  const item = await createInventoryItem(parsed.data);
  return apiSuccess(item, 201);
};
