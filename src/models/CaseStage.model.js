import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const caseStageSchema = new mongoose.Schema(
  {
    code:        { type: String, required: true, unique: true },
    name:        { type: String, required: true },
    description: { type: String },
    visaTypes:   [{ type: String }],
    order:       { type: Number },
    isActive:    { type: Boolean, default: true },
    nextStages:  [{ type: String }],
  },
  { timestamps: true }
);

caseStageSchema.plugin(baseFieldsPlugin);

const CaseStage = mongoose.model('CaseStage', caseStageSchema);
export default CaseStage;
