import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const primaryContactSchema = new mongoose.Schema(
  {
    name:  { type: String, trim: true },
    title: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const petitionerSchema = new mongoose.Schema(
  {
    petitionerId: { type: String, unique: true, sparse: true },
    // Name — legalName is the primary display field
    legalName:    { type: String, required: true, trim: true },
    tradeName:    { type: String, trim: true },
    // Type & status — no enum restriction so any frontend value is accepted
    type:   { type: String },
    status: { type: String, default: 'Active' },
    // Identifiers
    ein:  { type: String },
    fein: { type: String },
    // Contact
    phone:   { type: String },
    email:   { type: String, trim: true, lowercase: true },
    website: { type: String },
    // Flat address fields (what the form sends)
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    zip:     { type: String, trim: true },
    country: { type: String, trim: true, default: 'US' },
    // Classification
    industry:         { type: String },
    naicsCode:        { type: String },
    employeeCount:    { type: Number },
    yearEstablished:  { type: Number },
    description:      { type: String },
    // Contacts / relationships
    primaryContact: { type: primaryContactSchema },
    signatoryName:  { type: String },
    signatoryTitle: { type: String },
    attorneyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Attorney' },
    // Denormalised counters (updated by background jobs / case saves)
    activeBeneficiaries: { type: Number, default: 0 },
    openCases:           { type: Number, default: 0 },
    activeLcas:          { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

petitionerSchema.plugin(baseFieldsPlugin);

petitionerSchema.index({ orgId: 1, legalName: 1 });
petitionerSchema.index({ legalName: 'text', email: 'text' });

const Petitioner = mongoose.model('Petitioner', petitionerSchema);
export default Petitioner;
