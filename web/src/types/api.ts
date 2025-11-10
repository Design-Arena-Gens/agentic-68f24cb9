import { OrderStatus, ShipmentMode } from "@/types/prisma";

export type OrderPayload = {
  orderNumber: string;
  customerRef?: string;
  pickupDate?: string;
  deliveryDate?: string;
  amount?: number;
  status?: OrderStatus;
  priority?: number;
};

export type ShipmentPayload = {
  shipmentNumber: string;
  origin: string;
  destination: string;
  carrierId?: string;
  mode: ShipmentMode;
  trackingNumber?: string;
  weightKg?: number;
  currentLatitude?: number;
  currentLongitude?: number;
};

export type CarrierPayload = {
  name: string;
  modes: ShipmentMode[];
  apiCredentials?: Record<string, unknown>;
  rateCards?: Record<string, unknown>;
  performanceMetrics?: Record<string, unknown>;
};

export type InventoryPayload = {
  sku: string;
  warehouse: string;
  quantity?: number;
  cost?: number;
  reorderPoint?: number;
};

export type CustomFieldPayload = {
  entityType: string;
  entityId: string;
  key: string;
  value: unknown;
};
