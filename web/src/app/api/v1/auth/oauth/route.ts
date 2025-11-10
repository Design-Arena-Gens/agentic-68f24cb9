import { apiSuccess } from "@/lib/api-response";

export const POST = async () => {
  return apiSuccess({
    message:
      "OAuth2 federation is not fully implemented in this demo environment. Configure your provider and exchange the authorization code for a JWT via /api/v1/auth/login.",
  });
};
