import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const caseFormSchema = new mongoose.Schema(
  {
    caseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'ImmigrationCase', required: true },
    formType:     { type: String, required: true },
    formData:     { type: mongoose.Schema.Types.Mixed },
    status:       { type: String, enum: ['draft', 'complete', 'submitted'], default: 'draft' },
    version:      { type: Number, default: 1 },
    lastEditedBy: { type: String },
    submittedAt:  { type: Date },
    notes:        { type: String },
  },
  { timestamps: true }
);

caseFormSchema.plugin(baseFieldsPlugin);

caseFormSchema.index({ caseId: 1, formType: 1 });

const CaseForm = mongoose.model('CaseForm', caseFormSchema);
export default CaseForm;
