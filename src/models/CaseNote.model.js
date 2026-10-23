import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const attachmentSchema = new mongoose.Schema(
  {
    fileName:    { type: String },
    storagePath: { type: String },
  },
  { _id: false }
);

const caseNoteSchema = new mongoose.Schema(
  {
    caseId:      { type: mongoose.Schema.Types.ObjectId, ref: 'ImmigrationCase', required: true },
    content:     { type: String, required: true },
    noteType:    {
      type:    String,
      enum:    ['general', 'internal', 'client_communication', 'uscis_communication'],
      default: 'general',
    },
    authorId:    { type: String },
    authorName:  { type: String },
    isPrivate:   { type: Boolean, default: false },
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

caseNoteSchema.plugin(baseFieldsPlugin);

caseNoteSchema.index({ caseId: 1, createdAt: -1 });

const CaseNote = mongoose.model('CaseNote', caseNoteSchema);
export default CaseNote;
