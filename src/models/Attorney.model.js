import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const attorneySchema = new mongoose.Schema(
  {
    firstName:      { type: String, required: true, trim: true },
    lastName:       { type: String, required: true, trim: true },
    email:          { type: String, required: true, trim: true, lowercase: true },
    phone:          { type: String },
    barNumber:      { type: String },
    firmName:       { type: String },
    firmAddress:    { type: String },
    licenseState:   { type: String },
    specialization: { type: String },
    status:         { type: String, enum: ['Active', 'Inactive', 'active', 'inactive'], default: 'Active' },
    notes:          { type: String },
  },
  { timestamps: true }
);

attorneySchema.plugin(baseFieldsPlugin);

attorneySchema.index({ orgId: 1, email: 1 }, { unique: true, sparse: true });

const Attorney = mongoose.model('Attorney', attorneySchema);
export default Attorney;
