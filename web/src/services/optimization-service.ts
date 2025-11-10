import { BullQueue } from "@/lib/bull-queue";
import { getRedisClient } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

type OptimizationJobInput = {
  orderId: string;
};

const queue = new BullQueue("optimizationQueue");

const optimizeOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shipments: true,
    },
  });

  if (!order) {
    return;
  }

  const candidateShipments = await prisma.shipment.findMany({
    include: {
      milestones: true,
    },
  });

  const scored = candidateShipments
    .map((shipment) => {
      const distancePenalty =
        shipment.origin.toLowerCase() ===
        (order.customerRef ?? "").toLowerCase()
          ? 0
          : 5;
      const statusPenalty = shipment.milestones.some(
        (m) => m.status.toLowerCase() === "delayed",
      )
        ? 10
        : 0;
      const total = distancePenalty + statusPenalty;
      return { shipment, score: total };
    })
    .sort((a, b) => a.score - b.score);

  if (!scored.length) {
    return;
  }

  await prisma.orderShipment.upsert({
    where: {
      orderId_shipmentId: {
        orderId,
        shipmentId: scored[0].shipment.id,
      },
    },
    update: {},
    create: {
      orderId,
      shipmentId: scored[0].shipment.id,
    },
  });

  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.set(
        `orders:${orderId}:assignment`,
        JSON.stringify({
          shipmentId: scored[0].shipment.id,
          optimizedAt: new Date().toISOString(),
          score: scored[0].score,
        }),
        "EX",
        60 * 60,
      );
    } catch (error) {
      console.warn("Failed to persist assignment to Redis", error);
    }
  }
};

export const enqueueOptimizationJob = async (input: OptimizationJobInput) => {
  await queue.add("optimize-order", input);
};

queue.process("optimize-order", async (job) => {
  await optimizeOrder(job.data.orderId);
});
