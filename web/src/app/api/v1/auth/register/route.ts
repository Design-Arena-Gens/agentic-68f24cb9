import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { hashPassword, issueToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().optional(),
});

export const POST = async (request: NextRequest) => {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return apiError(parsed.error.message, 422);
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return apiError("User already exists", 409);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role ?? "operator",
    },
  });

  const token = issueToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return apiSuccess({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  }, 201);
};
