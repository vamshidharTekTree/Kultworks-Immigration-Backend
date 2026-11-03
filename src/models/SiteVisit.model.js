import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const siteVisitSchema = new mongoose.Schema(
  {
    petitionerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Petitioner', required: true },
    visitDate:    { type: String, required: true },
    visitType:    { type: String, enum: ['Targeted', 'Random', 'Complaint-Based'], default: 'Random' },
    outcome:      { type: String, enum: ['Compliant', 'Follow-up Required', 'Non-Compliant'], default: 'Compliant' },
    officer:      { type: String },
    notes:        { type: String },
    checklist:    { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

siteVisitSchema.plugin(baseFieldsPlugin);
siteVisitSchema.index({ petitionerId: 1, visitDate: -1 });

const SiteVisit = mongoose.model('SiteVisit', siteVisitSchema);
export default SiteVisit;
