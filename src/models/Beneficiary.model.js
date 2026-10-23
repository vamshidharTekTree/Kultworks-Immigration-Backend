import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const addressSchema = new mongoose.Schema(
  {
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    zip:     { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const beneficiarySchema = new mongoose.Schema(
  {
    beneficiaryId:  { type: String, unique: true, sparse: true },
    firstName:      { type: String, required: true, trim: true },
    lastName:       { type: String, required: true, trim: true },
    email:          { type: String, required: true, trim: true, lowercase: true },
    phone:          { type: String, trim: true },
    dateOfBirth:    { type: Date },
    gender:         { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    nationality:    { type: String },
    countryOfBirth: { type: String },
    // Store only last 4 digits — never store full passport number in plaintext
    passportNumber: { type: String },
    passportExpiry: { type: Date },
    alienNumber:    { type: String },
    // Store only last 4 digits — never store full SSN
    ssn:            { type: String, maxlength: 4 },
    address:        { type: addressSchema },
    currentStatus:  { type: String },
    priorityDate:   { type: Date },
    isPortalActive: { type: Boolean, default: false },
    notes:          { type: String },
  },
  { timestamps: true }
);

beneficiarySchema.plugin(baseFieldsPlugin);

beneficiarySchema.index({ orgId: 1, email: 1 }, { unique: true, sparse: true });
beneficiarySchema.index({ orgId: 1, beneficiaryId: 1 });

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);
export default Beneficiary;
