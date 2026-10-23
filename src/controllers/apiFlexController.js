import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AsyncWrapper, ResponseHandler } from '../utils/wrappers/responseWrapper.util.js';
import { portalTokenSecret } from '../configs/env.config.js';
import PortalUser from '../models/PortalUser.model.js';
import Counter from '../models/Counter.model.js';
import { services } from '../utils/dbRegistry.util.js';
import logger from '../utils/logger.util.js';

// Flex handlers dispatch on { collection, action } from URL params.

export const handleFlexGet = AsyncWrapper(async (req, res) => {
  const { collection, action } = req.params;

  // ── dashboard ─────────────────────────────────────────────────────────────
  if (collection === 'dashboard') {
    const orgId = req.user.organizationId;

    if (action === 'summary') {
      const now       = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const in60Days   = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      const [statusCounts, createdThisMonth, upcomingExpirations, pendingTasks] = await Promise.all([
        services.ImmigrationCase.service.aggregate({
          pipeline: [
            { $match: { orgId, isDeleted: { $ne: true } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          errorHandler: true,
        }),
        services.ImmigrationCase.service.count({
          filter: { orgId, isDeleted: { $ne: true }, createdAt: { $gte: monthStart } },
        }),
        services.ImmigrationCase.service.count({
          filter: {
            orgId,
            isDeleted:  { $ne: true },
            status:     'approved',
            expiryDate: { $gte: now, $lte: in60Days },
          },
        }),
        services.CaseTask.service.count({
          filter: { orgId, isDeleted: { $ne: true }, status: 'pending' },
        }),
      ]);

      const byStatus = {};
      for (const row of (statusCounts || [])) byStatus[row._id] = row.count;

      return res.json(ResponseHandler.success(1, {
        byStatus,
        casesCreatedThisMonth: createdThisMonth,
        upcomingExpirations,
        pendingTasks,
      }));
    }

    if (action === 'upcoming-deadlines') {
      const now      = new Date();
      const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const cases = await services.ImmigrationCase.service.findAll({
        filter: {
          orgId,
          isDeleted:  { $ne: true },
          status:     'approved',
          expiryDate: { $gte: now, $lte: in90Days },
        },
        options:  { sort: { expiryDate: 1 }, limit: 100 },
        populate: [
          { path: 'petitionerId',  select: 'companyName' },
          { path: 'beneficiaryId', select: 'firstName lastName' },
        ],
      });

      const result = (cases || []).map((c) => ({
        id:              c._id,
        caseNumber:      c.caseNumber,
        visaType:        c.visaType,
        expiryDate:      c.expiryDate,
        beneficiaryName: c.beneficiaryId
          ? `${c.beneficiaryId.firstName} ${c.beneficiaryId.lastName}`
          : null,
        petitionerName:  c.petitionerId?.companyName || null,
      }));

      return res.json(ResponseHandler.success(1, result));
    }

    ResponseHandler.error(6, 404, `Flex GET dashboard/${action} not implemented`);
  }

  // BE-40: dashboard/export-cases

  // ── casedocuments ─────────────────────────────────────────────────────────
  if (collection === 'casedocuments') {
    if (action === 'generate-form') {
      const { caseId, formType } = req.query;

      const caseForm = await services.CaseForm.service.findOne({
        filter:       { caseId, formType },
        errorHandler: true,
      });
      if (!caseForm) ResponseHandler.error(6, 404, 'Form data not found');

      // TODO BE-33: integrate PDF library (pdfkit or puppeteer) here.
      return res.json(ResponseHandler.success(1, {
        message:  'PDF generation not yet implemented',
        formType,
        caseId,
        formData: caseForm.formData,
      }));
    }

    ResponseHandler.error(6, 404, `Flex GET casedocuments/${action} not implemented`);
  }

  // ── beneficiaryportal ─────────────────────────────────────────────────────
  if (collection === 'beneficiaryportal') {
    const { beneficiaryId, orgId: _portalOrgId } = req.portalUser;

    if (action === 'my-cases') {
      const cases = await services.ImmigrationCase.service.findAll({
        filter:   { beneficiaryId, isDeleted: { $ne: true } },
        options:  { sort: { createdAt: -1 }, limit: 100 },
        populate: [{ path: 'petitionerId', select: 'companyName' }],
      });
      return res.json(ResponseHandler.success(1, cases));
    }

    if (action === 'case-details') {
      const { caseId } = req.query;

      const immigrationCase = await services.ImmigrationCase.service.findById({
        id:      caseId,
        populate: [
          { path: 'petitionerId', select: 'companyName email phone' },
        ],
      });

      if (String(immigrationCase.beneficiaryId) !== String(beneficiaryId)) {
        ResponseHandler.error(7, 403, 'Forbidden');
      }

      const [documents, tasks] = await Promise.all([
        services.CaseDocument.service.findAll({
          filter:  { caseId, isDeleted: { $ne: true } },
          options: { sort: { createdAt: -1 }, limit: 100 },
        }),
        services.CaseTask.service.findAll({
          filter:  { caseId, isDeleted: { $ne: true } },
          options: { sort: { dueDate: 1 }, limit: 100, select: 'title status dueDate priority' },
        }),
      ]);

      return res.json(ResponseHandler.success(1, { ...immigrationCase, documents, tasks }));
    }

    ResponseHandler.error(6, 404, `Flex GET beneficiaryportal/${action} not implemented`);
  }

  ResponseHandler.error(6, 404, `Flex GET ${collection}/${action} not implemented`);
});

export const handleFlexPost = AsyncWrapper(async (req, res) => {
  const { collection, action } = req.params;

  // ── portalauthentication ──────────────────────────────────────────────────
  if (collection === 'portalauthentication') {
    const orgId = req.orgId;

    if (action === 'login') {
      const { email, password } = req.body;

      const user = await PortalUser.findOne({ email: email?.toLowerCase(), orgId });
      if (!user) ResponseHandler.error(5, 401, 'Invalid credentials');

      if (user.status !== 'active') ResponseHandler.error(5, 401, 'Portal access not active');

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) ResponseHandler.error(5, 401, 'Invalid credentials');

      const token = jwt.sign(
        { portalUserId: user._id, email: user.email, orgId, beneficiaryId: user.beneficiaryId },
        portalTokenSecret,
        { expiresIn: '24h' }
      );

      res.cookie('portal_token', token, { httpOnly: true, sameSite: 'strict' });

      user.lastLoginAt = new Date();
      await user.save();

      return res.json(ResponseHandler.success(1, {
        token,
        user: { email: user.email, firstName: user.firstName, lastName: user.lastName },
      }));
    }

    if (action === 'register') {
      const { inviteToken, password, firstName, lastName } = req.body;

      const user = await PortalUser.findOne({
        inviteToken,
        inviteExpiry: { $gt: new Date() },
      });
      if (!user) ResponseHandler.error(5, 401, 'Invalid or expired invite');

      const passwordHash = await bcrypt.hash(password, 12);

      user.passwordHash  = passwordHash;
      user.firstName     = firstName;
      user.lastName      = lastName;
      user.status        = 'active';
      user.inviteToken   = null;
      user.inviteExpiry  = null;
      await user.save();

      return res.json(ResponseHandler.success(1, { message: 'Registration complete' }));
    }

    if (action === 'forgot-password') {
      const { email } = req.body;

      const user = await PortalUser.findOne({ email: email?.toLowerCase(), orgId });
      if (user) {
        const resetToken  = crypto.randomBytes(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

        user.passwordResetToken  = resetToken;
        user.passwordResetExpiry = resetExpiry;
        await user.save();

        // Email service wired in BE-36 — log token for now
        logger.info(`[portal forgot-password] reset token for ${email}: ${resetToken}`);
      }

      return res.json(ResponseHandler.success(1, { message: 'Reset email sent' }));
    }

    if (action === 'reset-password') {
      const { resetToken, newPassword } = req.body;

      const user = await PortalUser.findOne({
        passwordResetToken:  resetToken,
        passwordResetExpiry: { $gt: new Date() },
      });
      if (!user) ResponseHandler.error(5, 401, 'Invalid or expired reset token');

      user.passwordHash        = await bcrypt.hash(newPassword, 12);
      user.passwordResetToken  = null;
      user.passwordResetExpiry = null;
      await user.save();

      return res.json(ResponseHandler.success(1, { message: 'Password reset complete' }));
    }

    ResponseHandler.error(6, 404, `Flex POST portalauthentication/${action} not implemented`);
  }

  // ── immigrationcases ──────────────────────────────────────────────────────
  if (collection === 'immigrationcases') {
    if (action === 'initiate') {
      const { visaType, caseType, petitionerId, beneficiaryId, attorneyId, priority } = req.body;
      const orgId = req.user.organizationId;
      const userId = req.user.userId;

      if (!visaType || !petitionerId || !beneficiaryId) {
        ResponseHandler.error(21, 400, 'visaType, petitionerId and beneficiaryId are required');
      }

      await services.Petitioner.service.findById({ id: petitionerId, filter: { orgId } });
      await services.Beneficiary.service.findById({ id: beneficiaryId, filter: { orgId } });

      const caseNumber = await Counter.nextVal('CASE');

      const newCase = await services.ImmigrationCase.service.create({
        payload: {
          caseNumber,
          visaType,
          caseType,
          petitionerId,
          beneficiaryId,
          attorneyId,
          priority,
          status: 'draft',
          orgId,
          createdBy: userId,
          assignedTo: userId,
        },
      });

      await services.CaseTimeline.service.create({
        payload: {
          caseId:       newCase._id,
          eventType:    'case_created',
          description:  'Case initiated',
          performedBy:  userId,
          performerType: 'staff',
          orgId,
          createdBy:    userId,
        },
      });

      return res.json(ResponseHandler.success(1, newCase));
    }

    ResponseHandler.error(6, 404, `Flex POST immigrationcases/${action} not implemented`);
  }

  // ── casedocuments ─────────────────────────────────────────────────────────
  if (collection === 'casedocuments') {
    if (action === 'upload') {
      const { caseId, docType } = req.body;
      const orgId  = req.user.organizationId;
      const userId = req.user.userId;

      if (!req.file) ResponseHandler.error(21, 400, 'No file attached');
      if (!caseId || !docType) ResponseHandler.error(21, 400, 'caseId and docType are required');

      const newDocument = await services.CaseDocument.service.create({
        payload: {
          caseId,
          docType,
          fileName:     req.file.filename,
          originalName: req.file.originalname,
          mimeType:     req.file.mimetype,
          size:         req.file.size,
          storagePath:  req.file.path,
          uploadedBy:   userId,
          uploaderType: 'staff',
          status:       'pending',
          orgId,
          createdBy:    userId,
        },
      });

      await services.CaseTimeline.service.create({
        payload: {
          caseId,
          eventType:    'document_uploaded',
          description:  `Document uploaded: ${req.file.originalname}`,
          performedBy:  userId,
          performerType: 'staff',
          metadata:     { docType, fileName: req.file.filename },
          orgId,
          createdBy:    userId,
        },
      });

      return res.json(ResponseHandler.success(1, newDocument));
    }

    ResponseHandler.error(6, 404, `Flex POST casedocuments/${action} not implemented`);
  }

  // ── beneficiaryportal ─────────────────────────────────────────────────────
  if (collection === 'beneficiaryportal') {
    if (action === 'upload-document') {
      const { caseId, docType } = req.body;
      const { beneficiaryId, orgId } = req.portalUser;

      if (!req.file) ResponseHandler.error(21, 400, 'No file attached');
      if (!caseId || !docType) ResponseHandler.error(21, 400, 'caseId and docType are required');

      const immigrationCase = await services.ImmigrationCase.service.findById({ id: caseId });
      if (String(immigrationCase.beneficiaryId) !== String(beneficiaryId)) {
        ResponseHandler.error(7, 403, 'Forbidden');
      }

      const newDocument = await services.CaseDocument.service.create({
        payload: {
          caseId,
          docType,
          fileName:     req.file.filename,
          originalName: req.file.originalname,
          mimeType:     req.file.mimetype,
          size:         req.file.size,
          storagePath:  req.file.path,
          uploadedBy:   beneficiaryId,
          uploaderType: 'beneficiary',
          status:       'pending',
          orgId,
          createdBy:    beneficiaryId,
        },
      });

      await services.CaseTimeline.service.create({
        payload: {
          caseId,
          eventType:    'document_uploaded',
          description:  `Beneficiary uploaded: ${req.file.originalname}`,
          performedBy:  beneficiaryId,
          performerType: 'beneficiary',
          metadata:     { docType, fileName: req.file.filename },
          orgId,
          createdBy:    beneficiaryId,
        },
      });

      return res.json(ResponseHandler.success(1, newDocument));
    }

    ResponseHandler.error(6, 404, `Flex POST beneficiaryportal/${action} not implemented`);
  }

  ResponseHandler.error(6, 404, `Flex POST ${collection}/${action} not implemented`);
});

const VALID_CASE_STATUSES = ['draft', 'in_progress', 'submitted', 'rfe', 'approved', 'denied', 'withdrawn', 'closed'];

export const handleFlexPatch = AsyncWrapper(async (req, res) => {
  const { collection, action } = req.params;

  // ── immigrationcases ──────────────────────────────────────────────────────
  if (collection === 'immigrationcases') {
    if (action === 'update-status') {
      const { caseId, toStatus, stage, reason, metadata } = req.body;
      const orgId  = req.user.organizationId;
      const userId = req.user.userId;

      if (!toStatus || !VALID_CASE_STATUSES.includes(toStatus)) {
        ResponseHandler.error(21, 400, `Invalid status. Must be one of: ${VALID_CASE_STATUSES.join(', ')}`);
      }

      const existingCase = await services.ImmigrationCase.service.findById({ id: caseId });
      if (existingCase.orgId !== orgId) ResponseHandler.error(7, 403, 'Forbidden');

      const fromStatus = existingCase.status;

      const updatePayload = { status: toStatus, lastActivityAt: new Date() };
      if (stage !== undefined) updatePayload.stage = stage;

      const updatedCase = await services.ImmigrationCase.service.updateById({
        id: caseId,
        payload: updatePayload,
      });

      await services.CaseTimeline.service.create({
        payload: {
          caseId:       existingCase._id,
          eventType:    'status_change',
          fromStatus,
          toStatus,
          description:  reason || `Status changed to ${toStatus}`,
          performedBy:  userId,
          performerType: 'staff',
          metadata,
          orgId,
          createdBy:    userId,
        },
      });

      return res.json(ResponseHandler.success(1, updatedCase));
    }

    ResponseHandler.error(6, 404, `Flex PATCH immigrationcases/${action} not implemented`);
  }

  ResponseHandler.error(6, 404, `Flex PATCH ${collection}/${action} not implemented`);
});
