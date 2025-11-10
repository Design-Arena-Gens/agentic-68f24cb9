import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { issueToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const POST = async (request: NextRequest) => {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return apiError(parsed.error.message, 422);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return apiError("Invalid credentials", 401);
  }

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
  });
};
