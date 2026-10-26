import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const caseTaskSchema = new mongoose.Schema(
  {
    caseId:      { type: mongoose.Schema.Types.ObjectId, ref: 'ImmigrationCase', required: true },
    title:       { type: String, required: true },
    description: { type: String },
    status:      { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'], default: 'pending' },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate:     { type: Date },
    assignedTo:  { type: String },
    completedBy: { type: String },
    completedAt: { type: Date },
    category:    { type: String },
  },
  { timestamps: true }
);

caseTaskSchema.plugin(baseFieldsPlugin);

caseTaskSchema.index({ caseId: 1, status: 1 });

const CaseTask = mongoose.model('CaseTask', caseTaskSchema);
export default CaseTask;
