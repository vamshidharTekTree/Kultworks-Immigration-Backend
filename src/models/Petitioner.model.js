import mongoose from 'mongoose';
import baseFieldsPlugin from './plugins/baseFields.plugin.js';

const addressSchema = new mongoose.Schema(
  {
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    zip:     { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const primaryContactSchema = new mongoose.Schema(
  {
    name:  { type: String, trim: true },
    title: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const petitionerSchema = new mongoose.Schema(
  {
    petitionerId:      { type: String, unique: true, sparse: true },
    companyName:       { type: String, required: true, trim: true },
    ein:               { type: String },
    fein:              { type: String },
    address:           { type: addressSchema },
    phone:             { type: String },
    email:             { type: String, trim: true, lowercase: true },
    website:           { type: String },
    industry:          { type: String },
    naicsCode:         { type: String },
    numberOfEmployees: { type: Number },
    type:              { type: String, enum: ['corporation', 'llc', 'partnership', 'sole_proprietor', 'nonprofit'] },
    status:            { type: String, enum: ['active', 'inactive'], default: 'active' },
    primaryContact:    { type: primaryContactSchema },
    signatoryName:     { type: String },
    signatoryTitle:    { type: String },
    attorneyId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Attorney' },
    notes:             { type: String },
  },
  { timestamps: true }
);

petitionerSchema.plugin(baseFieldsPlugin);

petitionerSchema.index({ orgId: 1, companyName: 1 });

const Petitioner = mongoose.model('Petitioner', petitionerSchema);
export default Petitioner;
