import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import {
  createDefinition,
  listDefinitions,
} from "@/services/custom-field-service";
import { z } from "zod";

const schema = z.object({
  entityType: z.string(),
  key: z.string(),
  label: z.string(),
  valueType: z.string().optional(),
  isRequired: z.boolean().optional(),
  allowedValues: z.array(z.string()).optional(),
});

export const GET = async (request: NextRequest) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const entityType = request.nextUrl.searchParams.get("entityType") ?? undefined;
  const result = await listDefinitions(entityType);
  return apiSuccess(result);
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

  const definition = await createDefinition(parsed.data);
  return apiSuccess(definition, 201);
};
