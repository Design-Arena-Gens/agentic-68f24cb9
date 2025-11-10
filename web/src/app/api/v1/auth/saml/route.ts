import { apiSuccess } from "@/lib/api-response";

export const POST = async () => {
  return apiSuccess({
    message:
      "SAML assertions should be posted here for validation. Integrate with your IdP and issue JWTs via /api/v1/auth/login after validation.",
  });
};
