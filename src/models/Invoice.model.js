import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const invoiceSchema = new mongoose.Schema(
  {
    caseId:        { type: mongoose.Schema.Types.ObjectId, ref: 'ImmigrationCase' },
    petitionerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Petitioner' },
    beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },
    invoiceNumber: { type: String },
    type:          { type: String },           // e.g. "Attorney Fee", "USCIS Filing Fee"
    amount:        { type: Number, default: 0 },
    paidBy:        { type: String, enum: ['Employer', 'Employee'], default: 'Employer' },
    status:        { type: String, enum: ['Outstanding', 'Paid', 'Waived', 'In Progress'], default: 'Outstanding' },
    dueDate:       { type: Date },
    paidDate:      { type: Date },
    notes:         { type: String },
  },
  { timestamps: true }
);

invoiceSchema.plugin(baseFieldsPlugin);

invoiceSchema.index({ orgId: 1, status: 1 });
invoiceSchema.index({ orgId: 1, caseId: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
