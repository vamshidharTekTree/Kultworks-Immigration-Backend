import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const workLocationSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city:   { type: String, trim: true },
    state:  { type: String, trim: true },
    zip:    { type: String, trim: true },
  },
  { _id: false }
);

const immigrationCaseSchema = new mongoose.Schema(
  {
    caseNumber:    { type: String, unique: true, sparse: true },
    visaType:      { type: String, required: true },
    caseType:      { type: String, enum: ['new', 'extension', 'transfer', 'amendment', 'renewal'] },
    status:        {
      type:    String,
      enum:    ['draft', 'in_progress', 'submitted', 'rfe', 'approved', 'denied', 'withdrawn', 'closed'],
      default: 'draft',
    },
    stage:         { type: String },
    petitionerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Petitioner', required: true },
    beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary', required: true },
    attorneyId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Attorney' },
    priority:      { type: String, enum: ['regular', 'premium'], default: 'regular' },
    priorityDate:  { type: Date },
    filingDate:    { type: Date },
    receiptNumber: { type: String },
    approvalDate:  { type: Date },
    expiryDate:    { type: Date },
    validFrom:     { type: Date },
    validTo:       { type: Date },
    workLocation:  { type: workLocationSchema },
    jobTitle:      { type: String },
    socCode:       { type: String },
    wageLevel:     { type: String, enum: ['I', 'II', 'III', 'IV'] },
    lcaNumber:     { type: String },
    notes:         { type: String },
    tags:          [{ type: String }],
    assignedTo:    { type: String },
    lastActivityAt: { type: Date },
  },
  { timestamps: true }
);

immigrationCaseSchema.plugin(baseFieldsPlugin);

immigrationCaseSchema.index({ orgId: 1, status: 1 });
immigrationCaseSchema.index({ orgId: 1, beneficiaryId: 1 });
immigrationCaseSchema.index({ orgId: 1, petitionerId: 1 });
immigrationCaseSchema.index({ caseNumber: 'text', jobTitle: 'text', receiptNumber: 'text' });

const ImmigrationCase = mongoose.model('ImmigrationCase', immigrationCaseSchema);
export default ImmigrationCase;
