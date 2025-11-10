import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import { assignCustomField } from "@/services/custom-field-service";
import { z } from "zod";

const schema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  key: z.string(),
  value: z.any(),
});

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

  const record = await assignCustomField(parsed.data);
  return apiSuccess(record, 201);
};
