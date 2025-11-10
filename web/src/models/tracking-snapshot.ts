import { mongoConnection } from "@/lib/mongo";
import mongoose, { Schema } from "mongoose";

export type TrackingSnapshotDocument = mongoose.InferSchemaType<
  typeof TrackingSnapshotSchema
>;

const TrackingSnapshotSchema = new Schema(
  {
    shipmentId: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speedKph: { type: Number, default: 0 },
    recordedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
  },
);

export const TrackingSnapshotModel =
  (mongoose.models.TrackingSnapshot as mongoose.Model<TrackingSnapshotDocument>) ??
  mongoose.model<TrackingSnapshotDocument>(
    "TrackingSnapshot",
    TrackingSnapshotSchema,
    "tracking_snapshots",
  );

export const ensureMongo = async () => {
  await mongoConnection();
  return TrackingSnapshotModel;
};
