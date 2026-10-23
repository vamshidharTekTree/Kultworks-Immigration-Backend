import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const caseDocumentSchema = new mongoose.Schema(
  {
    caseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'ImmigrationCase', required: true },
    docType:      { type: String, required: true },
    fileName:     { type: String, required: true },
    originalName: { type: String },
    mimeType:     { type: String },
    size:         { type: Number },
    storagePath:  { type: String },
    storageUrl:   { type: String },
    uploadedBy:   { type: String },
    uploaderType: { type: String, enum: ['staff', 'beneficiary'], default: 'staff' },
    status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    expiryDate:   { type: Date },
    notes:        { type: String },
  },
  { timestamps: true }
);

caseDocumentSchema.plugin(baseFieldsPlugin);

caseDocumentSchema.index({ caseId: 1, docType: 1 });

const CaseDocument = mongoose.model('CaseDocument', caseDocumentSchema);
export default CaseDocument;
