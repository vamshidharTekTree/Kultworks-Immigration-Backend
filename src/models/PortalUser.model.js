import mongoose from 'mongoose';

const portalUserSchema = new mongoose.Schema(
  {
    email:                { type: String, required: true, trim: true, lowercase: true },
    passwordHash:         { type: String },
    firstName:            { type: String, trim: true },
    lastName:             { type: String, trim: true },
    beneficiaryId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },
    orgId:                { type: String, required: true },
    status:               { type: String, enum: ['invited', 'active', 'suspended'], default: 'invited' },
    inviteToken:          { type: String },
    inviteExpiry:         { type: Date },
    lastLoginAt:          { type: Date },
    passwordResetToken:   { type: String },
    passwordResetExpiry:  { type: Date },
  },
  { timestamps: true }
);

portalUserSchema.index({ email: 1, orgId: 1 }, { unique: true });

const PortalUser = mongoose.model('PortalUser', portalUserSchema);
export default PortalUser;
