import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const masterListItemSchema = new mongoose.Schema(
  {
    type:     { type: String, required: true },
    code:     { type: String, required: true },
    name:     { type: String, required: true },
    order:    { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

masterListItemSchema.plugin(baseFieldsPlugin);
masterListItemSchema.index({ orgId: 1, type: 1, code: 1 }, { unique: true });

const MasterListItem = mongoose.model('MasterListItem', masterListItemSchema);
export default MasterListItem;
