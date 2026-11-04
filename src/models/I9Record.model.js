import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const i9RecordSchema = new mongoose.Schema(
  {
    beneficiaryId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary', required: true },
    caseId:             { type: mongoose.Schema.Types.ObjectId, ref: 'ImmigrationCase' },
    section1Date:       { type: Date, required: true },
    section2Date:       { type: Date, required: true },
    reverificationDate: { type: Date },
    listADocType:       { type: String },
    everifyStatus:      { type: String, default: 'Employment Authorized' },
    everifyDate:        { type: Date },
    status: {
      type:    String,
      enum:    ['Active', 'Reverification Due', 'Expired'],
      default: 'Active',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

i9RecordSchema.plugin(baseFieldsPlugin);

i9RecordSchema.index({ orgId: 1, beneficiaryId: 1 });
i9RecordSchema.index({ orgId: 1, status: 1 });

const I9Record = mongoose.model('I9Record', i9RecordSchema);
export default I9Record;
