import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';
import { WORK_STATUSES, GENDERS, MARITAL_STATUSES, TAX_TERMS, DATA_SOURCES, PORTAL_STATUSES } from '../configs/lookups.config.js';

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

const educationSchema = new mongoose.Schema(
  {
    degree:      { type: String },
    field:       { type: String },
    institution: { type: String },
    country:     { type: String },
    year:        { type: Number },
    stem:        { type: Boolean, default: false },
  },
  { _id: false }
);

const dependentSchema = new mongoose.Schema(
  {
    firstName:    { type: String },
    lastName:     { type: String },
    relationship: { type: String },
    dateOfBirth:  { type: Date },
    nationality:  { type: String },
    visaStatus:   { type: String },
  },
  { _id: false }
);

const travelHistorySchema = new mongoose.Schema(
  {
    country:   { type: String },
    entryDate: { type: Date },
    exitDate:  { type: Date },
    purpose:   { type: String },
  },
  { _id: false }
);

const beneficiarySchema = new mongoose.Schema(
  {
    beneficiaryId: { type: String, unique: true, sparse: true },
    petitionerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Petitioner' },
    // Name
    firstName:  { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    lastName:   { type: String, required: true, trim: true },
    // Contact
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    // Personal
    dateOfBirth:    { type: Date },
    gender:         { type: String, enum: GENDERS },
    nationality:    { type: String },
    countryOfBirth: { type: String },
    cityOfBirth:    { type: String },
    maritalStatus:  { type: String, enum: MARITAL_STATUSES },
    // Work status & tax
    currentWorkStatus: { type: String, enum: WORK_STATUSES },
    taxTerm:           { type: String, enum: TAX_TERMS },
    dataSource:        { type: String, enum: DATA_SOURCES, default: 'Manual' },
    // Addresses
    address:        { type: addressSchema },
    mailingAddress: { type: addressSchema },
    // Passport
    passportNumber:  { type: String },
    passportCountry: { type: String },
    passportExpiry:  { type: Date },
    // I-94
    i94Number:           { type: String },
    i94AdmitUntil:       { type: Date },
    i94ClassOfAdmission: { type: String },
    // US government numbers — store only last 4 digits of SSN, never full
    ssnMasked: { type: String, maxlength: 4 },
    aNumber:   { type: String },
    // Work authorization expiry (denormalised for quick expiry alerts)
    workAuthEndDate: { type: Date },
    // Arrays
    education:    [educationSchema],
    dependents:   [dependentSchema],
    travelHistory: [travelHistorySchema],
    // Portal
    portalStatus: {
      type: String,
      enum: PORTAL_STATUSES,
      default: 'Not Invited',
    },
    openCases: { type: Number, default: 0 },
    // Legacy / misc
    priorityDate:   { type: Date },
    isPortalActive: { type: Boolean, default: false },
    notes:          { type: String },
  },
  { timestamps: true }
);

beneficiarySchema.plugin(baseFieldsPlugin);

beneficiarySchema.index({ orgId: 1, email: 1 }, { unique: true, sparse: true });
beneficiarySchema.index({ orgId: 1, beneficiaryId: 1 });
beneficiarySchema.index({ orgId: 1, petitionerId: 1 });
beneficiarySchema.index({ orgId: 1, currentWorkStatus: 1 });
beneficiarySchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);
export default Beneficiary;
