import express from 'express';
import { AuthenticateReq, AuthenticatePortal } from '../middlewares/authReq.middleware.js';
import { handleGet, handlePost, handlePatch, handleDelete }
  from '../controllers/apiController.js';
import { handleFlexGet, handleFlexPost, handleFlexPatch }
  from '../controllers/apiFlexController.js';
import { uploadFile } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Collections that use flex routes (collection + action, not collection + id)
const FLEX_COLLECTIONS = new Set([
  'portalauthentication',
  'beneficiaryportal',
  'dashboard',
  'casedocuments',
  'immigrationcases',
  'beneficiaries',
]);

// Guard: only let requests through if collection is a known flex collection;
// otherwise skip to the next matching route (generic CRUD below).
const guardFlex = (req, _res, next) => {
  if (FLEX_COLLECTIONS.has(req.params.collection)) return next();
  next('route');
};

// Auth: branch based on collection —
//   portalauthentication → public (no auth)
//   beneficiaryportal    → portal JWT
//   everything else      → staff JWT
const routeAuth = (req, res, next) => {
  const c = req.params.collection;
  if (c === 'portalauthentication') return next();
  if (c === 'beneficiaryportal') return AuthenticatePortal(req, res, next);
  return AuthenticateReq(req, res, next);
};

// ── 1. Flex routes  /:collection/:action ─────────────────────────────────────
//    guardFlex skips these for non-flex collections → falls through to CRUD below
router.get( '/:collection/:action', guardFlex, routeAuth, handleFlexGet);
const maybeUpload = (req, res, next) => {
  if (req.params.collection === 'casedocuments' && req.params.action === 'upload') {
    return uploadFile(req, res, next);
  }
  next();
};

router.post('/:collection/:action', guardFlex, routeAuth, maybeUpload, handleFlexPost);
router.patch('/:collection/:action', guardFlex, routeAuth, handleFlexPatch);

// ── 2. Generic CRUD  (all require staff JWT) ──────────────────────────────────
router.use(AuthenticateReq);

router.get(   '/:collection',      handleGet);              // list
router.post(  '/:collection',      uploadFile, handlePost); // create
router.patch( '/:collection/:id',  handlePatch);            // update by id
router.delete('/:collection/:id',  handleDelete);           // soft-delete by id

export default router;
