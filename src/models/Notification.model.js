import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const notificationSchema = new mongoose.Schema(
  {
    refId: { type: String, required: true }, // derived notification id (timeline _id, "task-<id>", "doc-<id>")
    read:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

notificationSchema.plugin(baseFieldsPlugin);

notificationSchema.index({ orgId: 1, refId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
