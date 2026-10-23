import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const firmAddressSchema = new mongoose.Schema(
  {
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    zip:     { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const attorneySchema = new mongoose.Schema(
  {
    firstName:      { type: String, required: true, trim: true },
    lastName:       { type: String, required: true, trim: true },
    email:          { type: String, required: true, trim: true, lowercase: true },
    phone:          { type: String },
    barNumber:      { type: String },
    firmName:       { type: String },
    firmAddress:    { type: firmAddressSchema },
    licenseState:   { type: String },
    specialization: [{ type: String }],
    status:         { type: String, enum: ['active', 'inactive'], default: 'active' },
    notes:          { type: String },
  },
  { timestamps: true }
);

attorneySchema.plugin(baseFieldsPlugin);

attorneySchema.index({ orgId: 1, email: 1 }, { unique: true, sparse: true });

const Attorney = mongoose.model('Attorney', attorneySchema);
export default Attorney;
