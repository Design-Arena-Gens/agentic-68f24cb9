import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import { enqueueOptimizationJob } from "@/services/optimization-service";
import { z } from "zod";

const schema = z.object({
  orderId: z.string(),
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

  await enqueueOptimizationJob(parsed.data);
  return apiSuccess({ status: "queued" });
};
