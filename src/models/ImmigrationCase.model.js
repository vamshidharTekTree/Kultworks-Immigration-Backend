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
    caseType:      { type: String, enum: ['new', 'extension', 'transfer', 'amendment', 'renewal', 'lca', 'green_card_group', 'cap_registration'] },
    status:        {
      type:    String,
      enum:    [
        // internal / pipeline values
        'draft', 'in_progress', 'submitted', 'rfe', 'approved', 'denied', 'withdrawn', 'closed',
        // USCIS receipt-status labels sent from ReceiptStatus tab
        'Open', 'Filed', 'RFE Issued', 'NOID Issued', 'Approved', 'Denied', 'Withdrawn', 'Closed',
      ],
      default: 'draft',
    },
    stage:         { type: String },
    petitionerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Petitioner', required: true },
    // LCA records are petitioner-level; beneficiaryId is optional for caseType='lca'
    beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary', required: function () { return this.caseType !== 'lca'; } },
    attorneyId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Attorney' },
    priority:      { type: String, enum: ['regular', 'premium'], default: 'regular' },
    priorityDate:  { type: Date },
    filingDate:    { type: Date },
    receiptNumber: { type: String },
    filedDate:     { type: Date },   // alias for filingDate (used by ReceiptStatus tab)
    approvalDate:  { type: Date },
    expiryDate:    { type: Date },
    validFrom:     { type: Date },
    validTo:       { type: Date },
    validityFrom:  { type: Date },   // alias for validFrom (used by ReceiptStatus tab)
    validityTo:    { type: Date },   // alias for validTo (used by ReceiptStatus tab)
    workLocation:  { type: workLocationSchema },
    jobTitle:      { type: String },
    socCode:       { type: String },
    wageLevel:     { type: String, enum: ['I', 'II', 'III', 'IV'] },
    lcaNumber:     { type: String },
    notes:         { type: String },
    tags:          [{ type: String }],
    // Stores type-specific extra fields (LCA: prevailingWage/offeredWage/worker*; GC: chargeability/perm/i140/i485)
    metadata:      { type: mongoose.Schema.Types.Mixed },
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
