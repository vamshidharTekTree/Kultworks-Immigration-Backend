import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const caseTimelineSchema = new mongoose.Schema(
  {
    caseId:        { type: mongoose.Schema.Types.ObjectId, ref: 'ImmigrationCase', required: true },
    eventType:     { type: String, required: true },
    fromStatus:    { type: String },
    toStatus:      { type: String },
    description:   { type: String, required: true },
    performedBy:   { type: String },
    performerName: { type: String },
    performerType: { type: String, enum: ['staff', 'beneficiary', 'system'], default: 'staff' },
    metadata:      { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

caseTimelineSchema.plugin(baseFieldsPlugin);

caseTimelineSchema.index({ caseId: 1, createdAt: -1 });

const CaseTimeline = mongoose.model('CaseTimeline', caseTimelineSchema);
export default CaseTimeline;
