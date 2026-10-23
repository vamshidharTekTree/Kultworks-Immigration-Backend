import { AsyncWrapper, ResponseHandler } from '../utils/wrappers/responseWrapper.util.js';

// Flex handlers dispatch on { collection, action } from URL params.
// BE-29 to BE-34, BE-39, BE-40 will add cases as features are built.

export const handleFlexGet = AsyncWrapper(async (req, _res) => {
  const { collection, action } = req.params;

  // ── dashboard ─────────────────────────────────────────────────────────────
  // BE-34: dashboard/summary, dashboard/upcoming-deadlines
  // BE-40: dashboard/export-cases

  // ── casedocuments ─────────────────────────────────────────────────────────
  // BE-33: casedocuments/generate-form

  // ── beneficiaryportal ─────────────────────────────────────────────────────
  // BE-39: beneficiaryportal/my-cases, beneficiaryportal/case-details

  ResponseHandler.error(6, 404, `Flex GET ${collection}/${action} not implemented`);
});

export const handleFlexPost = AsyncWrapper(async (req, _res) => {
  const { collection, action } = req.params;

  // ── portalauthentication ──────────────────────────────────────────────────
  // BE-29: login, register, forgot-password, reset-password

  // ── immigrationcases ──────────────────────────────────────────────────────
  // BE-30: immigrationcases/initiate

  // ── casedocuments ─────────────────────────────────────────────────────────
  // BE-32: casedocuments/upload

  // ── beneficiaryportal ─────────────────────────────────────────────────────
  // BE-39: beneficiaryportal/upload-document

  ResponseHandler.error(6, 404, `Flex POST ${collection}/${action} not implemented`);
});

export const handleFlexPatch = AsyncWrapper(async (req, _res) => {
  const { collection, action } = req.params;

  // ── immigrationcases ──────────────────────────────────────────────────────
  // BE-31: immigrationcases/update-status

  ResponseHandler.error(6, 404, `Flex PATCH ${collection}/${action} not implemented`);
});
