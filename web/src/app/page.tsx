"use client";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { ApiResponse } from "@/types/http";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";

type UserCredentials = {
  email: string;
  password: string;
  role?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  customerRef: string | null;
  pickupDate: string | null;
  deliveryDate: string | null;
  amount: string | null;
  status: string;
  priority: number;
  shipments: {
    shipment: Shipment;
  }[];
};

type Shipment = {
  id: string;
  shipmentNumber: string;
  origin: string;
  destination: string;
  mode: string;
  trackingNumber: string | null;
  currentLatitude: string | null;
  currentLongitude: string | null;
  milestones: ShipmentMilestone[];
};

type ShipmentMilestone = {
  id: string;
  name: string;
  status: string;
  occurredAt: string;
};

type Inventory = {
  id: string;
  sku: string;
  warehouse: string;
  quantity: number;
  reorderPoint: number;
  cost: string | null;
};

type Carrier = {
  id: string;
  name: string;
  modes: string[];
};

type CustomFieldDefinition = {
  id: string;
  entityType: string;
  key: string;
  label: string;
  valueType: string;
};

type TrackingSnapshot = {
  _id: string;
  shipmentId: string;
  latitude: number;
  longitude: number;
  speedKph: number;
  recordedAt: string;
};

const fetcher = async <T,>(path: string): Promise<T> => {
  const { data } = await apiClient.get<ApiResponse<T>>(path);
  return data.data;
};

const useOrders = (enabled: boolean) =>
  useQuery({
    queryKey: ["orders"],
    queryFn: () => fetcher<Order[]>("/orders"),
    refetchInterval: 10000,
    enabled,
  });

const useShipments = (enabled: boolean) =>
  useQuery({
    queryKey: ["shipments"],
    queryFn: () => fetcher<Shipment[]>("/shipments"),
    refetchInterval: 10000,
    enabled,
  });

const useInventory = (enabled: boolean) =>
  useQuery({
    queryKey: ["inventory"],
    queryFn: () => fetcher<Inventory[]>("/inventory"),
    enabled,
  });

const useCarriers = (enabled: boolean) =>
  useQuery({
    queryKey: ["carriers"],
    queryFn: () => fetcher<Carrier[]>("/carriers"),
    enabled,
  });

const useCustomFieldDefinitions = (enabled: boolean) =>
  useQuery({
    queryKey: ["custom-field-definitions"],
    queryFn: () =>
      fetcher<CustomFieldDefinition[]>("/custom-fields/definitions"),
    enabled,
  });

const useTrackingSnapshots = (enabled: boolean) =>
  useQuery({
    queryKey: ["tracking-snapshots"],
    queryFn: () => fetcher<TrackingSnapshot[]>("/tracking"),
    refetchInterval: 15000,
    enabled,
  });

const Card = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
      {title}
    </h3>
    <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    {subtitle ? (
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    ) : null}
  </div>
);

const Panel = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
    <header className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </header>
    {children}
  </section>
);

export default function Dashboard() {
  const { token, user, setAuth, clear } = useAuthStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const queryClient = useQueryClient();

  const authMutation = useMutation({
    mutationFn: async ({
      credentials,
      mode,
    }: {
      credentials: UserCredentials;
      mode: "login" | "register";
    }) => {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const { data } = await apiClient.post<
        ApiResponse<{ token: string; user: { id: string; email: string; role: string } }>
      >(endpoint, credentials);
      return data.data;
    },
    onSuccess: (payload) => {
      setAuth(payload.token, payload.user);
      queryClient.invalidateQueries();
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (input: {
      orderNumber: string;
      customerRef?: string;
      amount?: number;
      priority?: number;
    }) => apiClient.post("/orders", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const createShipmentMutation = useMutation({
    mutationFn: (input: {
      shipmentNumber: string;
      origin: string;
      destination: string;
      mode: string;
      trackingNumber?: string;
    }) => apiClient.post("/shipments", { ...input, mode: input.mode }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shipments"] }),
  });

  const optimizationMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiClient.post("/optimization", { orderId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const carrierMutation = useMutation({
    mutationFn: (input: { name: string; modes: string[] }) =>
      apiClient.post("/carriers", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["carriers"] }),
  });

  const inventoryMutation = useMutation({
    mutationFn: (input: {
      sku: string;
      warehouse: string;
      quantity?: number;
      reorderPoint?: number;
      cost?: number;
    }) => apiClient.post("/inventory", input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const assignCustomFieldMutation = useMutation({
    mutationFn: (input: {
      entityType: string;
      entityId: string;
      key: string;
      value: string;
    }) =>
      apiClient.post("/custom-fields/assign", {
        ...input,
        value: input.value,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const createDefinitionMutation = useMutation({
    mutationFn: (input: {
      entityType: string;
      key: string;
      label: string;
      valueType?: string;
    }) => apiClient.post("/custom-fields/definitions", input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["custom-field-definitions"] }),
  });

  const isAuthenticated = Boolean(token);

  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useOrders(isAuthenticated);
  const {
    data: shipments,
    isLoading: shipmentsLoading,
    error: shipmentsError,
  } = useShipments(isAuthenticated);
  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useInventory(isAuthenticated);
  const {
    data: carriers,
    isLoading: carriersLoading,
    error: carriersError,
  } = useCarriers(isAuthenticated);
  const { data: customFieldDefinitions } =
    useCustomFieldDefinitions(isAuthenticated);
  const {
    data: trackingSnapshots,
    isLoading: trackingLoading,
  } = useTrackingSnapshots(isAuthenticated);

  const summary = useMemo(() => {
    const activeOrdersCount = orders
      ? orders.filter((order) => order.status !== "DELIVERED").length
      : 0;
    const shipmentsInTransitCount = shipments
      ? shipments.filter(
          (shipment) => shipment.milestones[0]?.status !== "Delivered",
        ).length
      : 0;
    const inventoryCount = inventory ? inventory.length : 0;
    const carrierCount = carriers ? carriers.length : 0;

    return {
      activeOrders: activeOrdersCount,
      shipmentsInTransit: shipmentsInTransitCount,
      inventoryItems: inventoryCount,
      carriers: carrierCount,
    };
  }, [orders, shipments, inventory, carriers]);

  const authenticatedViews = (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          title="Active Orders"
          value={`${summary.activeOrders ?? 0}`}
          subtitle="Orders not yet delivered"
        />
        <Card
          title="Shipments In Transit"
          value={`${summary.shipmentsInTransit ?? 0}`}
          subtitle="Real-time status"
        />
        <Card
          title="Inventory SKUs"
          value={`${summary.inventoryItems ?? 0}`}
          subtitle="Items with stock"
        />
        <Card
          title="Carrier Partners"
          value={`${summary.carriers ?? 0}`}
          subtitle="Active integrations"
        />
      </div>

      <Panel
        title="Orders"
        description="Manage customer commitments, assign shipments, and trigger AI routing."
      >
        <form
          className="mb-4 grid gap-3 md:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget as HTMLFormElement;
            const data = new FormData(form);
            createOrderMutation.mutate({
              orderNumber: data.get("orderNumber")?.toString() ?? "",
              customerRef: data.get("customerRef")?.toString(),
              amount: data.get("amount")
                ? Number(data.get("amount"))
                : undefined,
              priority: data.get("priority")
                ? Number(data.get("priority"))
                : undefined,
            });
            form.reset();
          }}
        >
          <input
            name="orderNumber"
            required
            placeholder="Order #"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="customerRef"
            placeholder="Customer Ref"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Amount"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="priority"
            type="number"
            placeholder="Priority"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Create Order
          </button>
        </form>

        {ordersLoading ? (
          <p className="text-sm text-slate-500">Loading orders…</p>
        ) : ordersError ? (
          <p className="text-sm text-red-600">
            Unable to load orders. Ensure you are authenticated.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Assignment</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders?.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.customerRef ?? "Unassigned customer"}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{order.priority}</td>
                    <td className="py-3 pr-4">
                      {order.shipments.length ? (
                        <div className="space-y-1">
                          {order.shipments.map((entry) => (
                            <div
                              key={entry.shipment.id}
                              className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700"
                            >
                              {entry.shipment.shipmentNumber} ·{" "}
                              {entry.shipment.mode}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Awaiting assignment
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <button
                        onClick={() => optimizationMutation.mutate(order.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        AI Optimize
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Shipments"
        description="Track progress, milestones, and geospatial data across all modes."
      >
        <form
          className="mb-4 grid gap-3 md:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget as HTMLFormElement;
            const data = new FormData(form);
            createShipmentMutation.mutate({
              shipmentNumber: data.get("shipmentNumber")?.toString() ?? "",
              origin: data.get("origin")?.toString() ?? "",
              destination: data.get("destination")?.toString() ?? "",
              mode: data.get("mode")?.toString() ?? "ROAD",
              trackingNumber: data.get("trackingNumber")?.toString() ?? undefined,
            });
            form.reset();
          }}
        >
          <input
            name="shipmentNumber"
            required
            placeholder="Shipment #"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="origin"
            required
            placeholder="Origin"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="destination"
            required
            placeholder="Destination"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <select
            name="mode"
            className="rounded-lg border border-slate-200 p-2 text-sm"
            defaultValue="ROAD"
          >
            <option value="ROAD">Road</option>
            <option value="AIR">Air</option>
            <option value="SEA">Sea</option>
            <option value="RAIL">Rail</option>
          </select>
          <input
            name="trackingNumber"
            placeholder="Tracking #"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Schedule Shipment
          </button>
        </form>

        {shipmentsLoading ? (
          <p className="text-sm text-slate-500">Syncing shipments…</p>
        ) : shipmentsError ? (
          <p className="text-sm text-red-600">
            Unable to load shipments. Check your credentials.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {shipments?.map((shipment) => (
              <div
                key={shipment.id}
                className="rounded-xl border border-slate-100 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {shipment.shipmentNumber} · {shipment.mode}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {shipment.origin} → {shipment.destination}
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {shipment.milestones[0]?.status ?? "Scheduled"}
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  GPS:{" "}
                  {shipment.currentLatitude && shipment.currentLongitude
                    ? `${shipment.currentLatitude}, ${shipment.currentLongitude}`
                    : "No signal"}
                </div>
                <div className="mt-3 space-y-2 text-xs text-slate-500">
                  {shipment.milestones.slice(0, 3).map((milestone) => (
                    <div key={milestone.id} className="flex justify-between">
                      <span>{milestone.name}</span>
                      <span>{new Date(milestone.occurredAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900">
            Real-time Tracking Feed
          </h3>
          {trackingLoading ? (
            <p className="text-xs text-slate-500 mt-2">Streaming telemetry…</p>
          ) : trackingSnapshots && trackingSnapshots.length ? (
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {trackingSnapshots.slice(0, 6).map((snapshot) => (
                <li
                  key={snapshot._id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600"
                >
                  <div className="font-semibold text-slate-800">
                    Shipment {snapshot.shipmentId}
                  </div>
                  <div>
                    Lat/Lng: {snapshot.latitude.toFixed(4)},{" "}
                    {snapshot.longitude.toFixed(4)}
                  </div>
                  <div>Speed: {snapshot.speedKph?.toFixed(1) ?? 0} km/h</div>
                  <div>
                    Recorded: {new Date(snapshot.recordedAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              No telemetry received yet. POST snapshots to /api/v1/tracking.
            </p>
          )}
        </div>
      </Panel>

      <Panel
        title="Inventory"
        description="Monitor stock positions across your warehouse network."
      >
        <form
          className="mb-4 grid gap-3 md:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget as HTMLFormElement;
            const data = new FormData(form);
            inventoryMutation.mutate({
              sku: data.get("sku")?.toString() ?? "",
              warehouse: data.get("warehouse")?.toString() ?? "",
              quantity: data.get("quantity")
                ? Number(data.get("quantity"))
                : undefined,
              reorderPoint: data.get("reorderPoint")
                ? Number(data.get("reorderPoint"))
                : undefined,
              cost: data.get("cost") ? Number(data.get("cost")) : undefined,
            });
            form.reset();
          }}
        >
          <input
            name="sku"
            required
            placeholder="SKU"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="warehouse"
            required
            placeholder="Warehouse"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="quantity"
            type="number"
            placeholder="Qty"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="reorderPoint"
            type="number"
            placeholder="Reorder"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="cost"
            type="number"
            step="0.01"
            placeholder="Unit Cost"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Add SKU
          </button>
        </form>

        {inventoryLoading ? (
          <p className="text-sm text-slate-500">Loading inventory…</p>
        ) : inventoryError ? (
          <p className="text-sm text-red-600">
            Unable to load inventory. Confirm your session.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">SKU</th>
                  <th className="py-2 pr-4">Warehouse</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">Reorder Point</th>
                  <th className="py-2 pr-4">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {item.sku}
                    </td>
                    <td className="py-3 pr-4">{item.warehouse}</td>
                    <td className="py-3 pr-4">{item.quantity}</td>
                    <td className="py-3 pr-4">{item.reorderPoint}</td>
                    <td className="py-3 pr-4">
                      {item.cost ? `$${Number(item.cost).toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Carriers"
        description="Maintain multimodal partnerships and API credentials."
      >
        <form
          className="mb-4 grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget as HTMLFormElement;
            const data = new FormData(form);
            carrierMutation.mutate({
              name: data.get("name")?.toString() ?? "",
              modes:
                data
                  .get("modes")
                  ?.toString()
                  .split(",")
                  .map((mode) => mode.trim().toUpperCase())
                  .filter(Boolean) ?? [],
            });
            form.reset();
          }}
        >
          <input
            name="name"
            required
            placeholder="Carrier Name"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="modes"
            required
            placeholder="Modes (e.g. air, road)"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Add Carrier
          </button>
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["carriers"] })}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </form>
        {carriersLoading ? (
          <p className="text-sm text-slate-500">Loading carriers…</p>
        ) : carriersError ? (
          <p className="text-sm text-red-600">
            Unable to load carriers. Check your session.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {carriers?.map((carrier) => (
              <li
                key={carrier.id}
                className="rounded-xl border border-slate-100 p-4 shadow-sm"
              >
                <div className="font-semibold text-slate-900">
                  {carrier.name}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {carrier.modes.join(", ")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Custom Fields"
        description="Extend data models without schema changes via EAV definitions."
      >
        <form
          className="mb-4 grid gap-3 md:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget as HTMLFormElement;
            const data = new FormData(form);
            createDefinitionMutation.mutate({
              entityType: data.get("entityType")?.toString() ?? "Order",
              key: data.get("key")?.toString() ?? "",
              label: data.get("label")?.toString() ?? "",
              valueType: data.get("valueType")?.toString() ?? undefined,
            });
            form.reset();
          }}
        >
          <input
            name="entityType"
            placeholder="Entity Type"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="key"
            placeholder="Key"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="label"
            placeholder="Label"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="valueType"
            placeholder="Value Type"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Create Definition
          </button>
        </form>
        <form
          className="mb-4 grid gap-3 md:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget as HTMLFormElement;
            const data = new FormData(form);
            assignCustomFieldMutation.mutate({
              entityType: data.get("entityType")?.toString() ?? "Order",
              entityId: data.get("entityId")?.toString() ?? "",
              key: data.get("key")?.toString() ?? "",
              value: data.get("value")?.toString() ?? "",
            });
            form.reset();
          }}
        >
          <input
            name="entityType"
            placeholder="Entity Type"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="entityId"
            placeholder="Entity ID"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="key"
            placeholder="Field Key"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <input
            name="value"
            placeholder="Value"
            className="rounded-lg border border-slate-200 p-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Assign Field
          </button>
        </form>
        <div className="grid gap-3 md:grid-cols-3">
          {customFieldDefinitions?.map((definition) => (
            <div
              key={definition.id}
              className="rounded-xl border border-slate-100 p-4 shadow-sm"
            >
              <div className="text-sm font-semibold text-slate-900">
                {definition.label}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {definition.entityType} · {definition.key} ·{" "}
                {definition.valueType}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white">
        <div className="w-full max-w-md rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-semibold">
            {isRegistering ? "Create Operator Account" : "Welcome Back"}
          </h1>
          <p className="mt-2 text-sm text-slate-200">
            Access the multimodal logistics control tower.
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const credentials: UserCredentials = {
                email: data.get("email")?.toString() ?? "",
                password: data.get("password")?.toString() ?? "",
              };
              if (isRegistering) {
                credentials.role = "operator";
              }
              authMutation.mutate({
                credentials,
                mode: isRegistering ? "register" : "login",
              });
            }}
          >
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-300">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-white outline-none focus:border-blue-300"
                placeholder="ops@carrier.com"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-300">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-white outline-none focus:border-blue-300"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-400"
            >
              {isRegistering ? "Register & Sign In" : "Sign In"}
            </button>
          </form>
          <button
            onClick={() => setIsRegistering((state) => !state)}
            className="mt-4 w-full text-xs font-semibold uppercase tracking-wide text-slate-300 hover:text-white"
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "Need access? Create an account"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Command Center
            </h1>
            <p className="text-sm text-slate-500">
              Logged in as {user?.email} · {user?.role}
            </p>
          </div>
          <button
            onClick={() => {
              clear();
              queryClient.clear();
            }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {authenticatedViews}
      </main>
    </div>
  );
}
