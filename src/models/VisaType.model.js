import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const visaTypeSchema = new mongoose.Schema(
  {
    code:              { type: String, required: true, unique: true },
    name:              { type: String, required: true },
    category:          { type: String, enum: ['nonimmigrant', 'immigrant', 'dual_intent'] },
    description:       { type: String },
    maxDuration:       { type: String },
    requiresLca:       { type: Boolean, default: false },
    requiresLaborTest: { type: Boolean, default: false },
    petitionForms:     [{ type: String }],
    isActive:          { type: Boolean, default: true },
    displayOrder:      { type: Number },
  },
  { timestamps: true }
);

visaTypeSchema.plugin(baseFieldsPlugin);

const VisaType = mongoose.model('VisaType', visaTypeSchema);
export default VisaType;
