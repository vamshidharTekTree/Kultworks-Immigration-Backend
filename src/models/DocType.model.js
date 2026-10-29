import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const docTypeSchema = new mongoose.Schema(
  {
    code:            { type: String, required: true, unique: true },
    name:            { type: String, required: true },
    description:     { type: String },
    visaTypes:       [{ type: String }],
    isRequired:      { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true },
    expiryTracked:   { type: Boolean, default: false },
    acceptedFormats: [{ type: String }],
    maxSizeMb:       { type: Number, default: 10 },
  },
  { timestamps: true }
);

docTypeSchema.plugin(baseFieldsPlugin);

const DocType = mongoose.model('DocType', docTypeSchema);
export default DocType;
