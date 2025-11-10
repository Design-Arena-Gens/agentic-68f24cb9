import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/require-auth";
import { ensureMongo } from "@/models/tracking-snapshot";
import { z } from "zod";

const schema = z.object({
  shipmentId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  speedKph: z.number().optional(),
  recordedAt: z.string().optional(),
});

export const GET = async (request: NextRequest) => {
  try {
    requireAuth(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  const shipmentId = request.nextUrl.searchParams.get("shipmentId");
  const model = await ensureMongo();

  const snapshots = await model
    .find(shipmentId ? { shipmentId } : {})
    .sort({ recordedAt: -1 })
    .limit(50)
    .lean();

  return apiSuccess(snapshots);
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

  const model = await ensureMongo();
  const document = await model.create({
    shipmentId: parsed.data.shipmentId,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    speedKph: parsed.data.speedKph ?? 0,
    recordedAt: parsed.data.recordedAt
      ? new Date(parsed.data.recordedAt)
      : new Date(),
  });

  return apiSuccess(document.toObject(), 201);
};
