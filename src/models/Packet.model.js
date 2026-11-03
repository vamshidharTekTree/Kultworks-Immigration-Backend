import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const packetSchema = new mongoose.Schema(
  {
    caseId:        { type: mongoose.Schema.Types.ObjectId, ref: 'ImmigrationCase', required: true },
    beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },
    petitionerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Petitioner' },
    title:         { type: String, required: true },
    status:        { type: String, enum: ['Draft', 'Ready', 'Filed', 'Archived'], default: 'Draft' },
    formIds:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'CaseForm' }],
    pageCount:     { type: Number, default: 0 },
    notes:         { type: String },
  },
  { timestamps: true }
);

packetSchema.plugin(baseFieldsPlugin);
packetSchema.index({ caseId: 1 });

const Packet = mongoose.model('Packet', packetSchema);
export default Packet;
