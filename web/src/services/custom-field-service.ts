import { prisma } from "@/lib/prisma";
import { CustomFieldPayload } from "@/types/api";
import { Prisma } from "@/generated/prisma/client";

export const listDefinitions = (entityType?: string) =>
  prisma.customFieldDefinition.findMany({
    where: entityType ? { entityType } : undefined,
    orderBy: {
      key: "asc",
    },
  });

export const createDefinition = (input: {
  entityType: string;
  key: string;
  label: string;
  valueType?: string;
  isRequired?: boolean;
  allowedValues?: string[];
}) =>
  prisma.customFieldDefinition.create({
    data: {
      entityType: input.entityType,
      key: input.key,
      label: input.label,
      valueType: input.valueType ?? "string",
      isRequired: input.isRequired ?? false,
      allowedValues: input.allowedValues ?? [],
    },
  });

export const assignCustomField = (payload: CustomFieldPayload) =>
  prisma.customField.upsert({
    where: {
      entityType_entityId_key: {
        entityType: payload.entityType,
        entityId: payload.entityId,
        key: payload.key,
      },
    },
    update: {
      value: normalizeJson(payload.value),
    },
    create: {
      entityType: payload.entityType,
      entityId: payload.entityId,
      key: payload.key,
      value: normalizeJson(payload.value),
    },
  });

const normalizeJson = (value: unknown) => {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
};
