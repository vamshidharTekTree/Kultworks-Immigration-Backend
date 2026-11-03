import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const caseFormSchema = new mongoose.Schema(
  {
    caseId:        { type: mongoose.Schema.Types.ObjectId, ref: 'ImmigrationCase' },  // optional: templates/i9/worksites are not case-specific
    petitionerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Petitioner' },       // for worksite/job_role records
    beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },      // for i9_record records
    formType:      { type: String, required: true },
    formData:     { type: mongoose.Schema.Types.Mixed },
    status:       {
      type: String,
      enum: ['draft', 'complete', 'submitted', 'reviewed', 'not_started', 'in_progress', 'Draft', 'Active', 'Reviewed', 'Needs Review', 'Signed', 'Filed'],
      default: 'Draft',
    },
    version:      { type: Number, default: 1 },
    edition:      { type: String },
    completion:   { type: Number, default: 0, min: 0, max: 100 },
    lastGenerated: { type: String },
    lastEditedBy: { type: String },
    submittedAt:  { type: Date },
    notes:        { type: String },
  },
  { timestamps: true }
);

caseFormSchema.plugin(baseFieldsPlugin);

caseFormSchema.index({ caseId: 1, formType: 1 });
caseFormSchema.index({ petitionerId: 1, formType: 1 });
caseFormSchema.index({ beneficiaryId: 1, formType: 1 });

const CaseForm = mongoose.model('CaseForm', caseFormSchema);
export default CaseForm;
