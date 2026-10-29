import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { createHmac, createHash } from 'crypto';
import { corsOrigin, nodeEnv, port, s2sSecret } from './src/configs/env.config.js';
import apiRouter from './src/routes/apiRoute.js';
import logger from './src/utils/logger.util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

export const corsOptions = {
  // In local dev reflect any origin so any frontend port works.
  // In staging/production restrict to the explicit CORS_ORIGIN list.
  origin: nodeEnv === 'local'
    ? (origin, cb) => cb(null, origin || true)
    : corsOrigin,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 'X-Requested-With', 'Content-Type', 'Accept',
    'Authorization', 'x-access-token', 'x-portal-token',
    'x-internal-secret', 'x-device-type', 'x-signature', 'x-timestamp',
    'x-org-id', 'x-org-uiid', 'x-org-slug', 'x-user-uiid',
  ],
  exposedHeaders: ['x-app-version'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// ── Health routes (no auth) ───────────────────────────────────────────────────
app.get(`/${nodeEnv}/health`, (_req, res) => res.status(200).send('OK'));
app.get(`/${nodeEnv}/test`, (_req, res) => res.send(`Immigration API — ${nodeEnv}`));

// ── S2S sync: verify x-internal-secret, then handle ─────────────────────────
const verifyS2S = (req, res, next) => {
  if (req.headers['x-internal-secret'] !== s2sSecret) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

app.post(`/${nodeEnv}/sync-user`, verifyS2S, async (req, res) => {
  try {
    const { userId, firstName, lastName, email, orgId, role, designation } = req.body || {};
    if (!email || !orgId) {
      return res.status(400).json({ message: 'email and orgId are required' });
    }
    if (!mongoose.connection?.db) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    const col = mongoose.connection.collection('users');
    await col.updateOne(
      { email, orgId },
      {
        $set: { userId: userId || email, firstName: firstName || '', lastName: lastName || '',
          email, orgId, role: role || 'staff', designation: designation || '', updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('sync-user failed', { message: err.message });
    res.status(500).json({ message: err.message });
  }
});

app.post(`/${nodeEnv}/sync-org`, verifyS2S, async (req, res) => {
  try {
    const { orgId, orgName, orgUiid, plan, status } = req.body || {};
    if (!orgId) return res.status(400).json({ message: 'orgId is required' });
    if (!mongoose.connection?.db) return res.status(503).json({ message: 'Database not connected' });
    const col = mongoose.connection.collection('orgs');
    await col.updateOne(
      { orgId },
      {
        $set: { orgId, orgName, orgUiid, plan, status, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('sync-org failed', { message: err.message });
    res.status(500).json({ message: err.message });
  }
});

// ── S2S HMAC auth: called by master backend's ApiService ─────────────────────
// Replicates master's computeSignature: SHA256(body) → JSON.stringify(hex) → HMAC payload
const computeHmacSignature = ({ body, secret, method, endpoint, timestamp }) => {
  const bodyHash = body ? createHash('sha256').update(JSON.stringify(body)).digest('hex') : '';
  const payload = [body ? JSON.stringify(bodyHash) : '', method, endpoint, timestamp].join('\n');
  return createHmac('sha256', secret).update(payload).digest('hex');
};

const verifyHmac = (req, res, next) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  if (!signature || !timestamp) return res.status(403).json({ message: 'Forbidden' });
  // Strip env prefix — master signs with the bare path e.g. /userrefs/add
  const endpoint = req.path.replace(new RegExp(`^\\/${nodeEnv}`), '') || req.path;
  const expected = computeHmacSignature({ body: req.body, secret: s2sSecret, method: req.method, endpoint, timestamp });
  if (signature !== expected) return res.status(403).json({ message: 'Forbidden' });
  next();
};

app.post(`/${nodeEnv}/userrefs/add`, verifyHmac, async (req, res) => {
  try {
    if (!mongoose.connection?.db) return res.status(503).json({ message: 'Database not connected' });
    const orgId = req.query.orgId || req.body.organizationId;
    const { uiid, firstName, lastName, email, mobile, status, role, designation, addedBy, reportTo, level, userType, botAssignedTo, address, organizationId } = req.body || {};
    if (!uiid) return res.status(400).json({ message: 'uiid is required' });
    const col = mongoose.connection.collection('userrefs');
    await col.updateOne(
      { uiid: Number(uiid), orgId: orgId || organizationId },
      {
        $set: { uiid: Number(uiid), firstName, lastName, email, mobile, status, role, designation, addedBy, reportTo, level, userType, botAssignedTo, address, orgId: orgId || organizationId, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('userrefs/add failed', { message: err.message });
    res.status(500).json({ message: err.message });
  }
});

app.patch(`/${nodeEnv}/userrefs/update`, verifyHmac, async (req, res) => {
  try {
    if (!mongoose.connection?.db) return res.status(503).json({ message: 'Database not connected' });
    const uiid = req.query.uiid || req.body.uiid;
    const orgId = req.query.orgId || req.body.organizationId;
    if (!uiid) return res.status(400).json({ message: 'uiid is required' });
    const col = mongoose.connection.collection('userrefs');
    const { uiid: _u, organizationId: _o, ...fields } = req.body || {};
    await col.updateOne(
      { uiid: Number(uiid), orgId },
      { $set: { ...fields, orgId, updatedAt: new Date() } }
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('userrefs/update failed', { message: err.message });
    res.status(500).json({ message: err.message });
  }
});

// ── Menu sync endpoints (S2S — called by admin panel) ────────────────────────
app.post(`/${nodeEnv}/sync-menu`, async (req, res) => {
  try {
    if (!mongoose.connection?.db) return res.status(503).json({ message: 'Database not connected' });
    const { slug, clearAll, isDeleted, uuid, previousSlug, ...fields } = req.body || {};
    const col = mongoose.connection.collection('menus');
    if (clearAll) {
      await col.deleteMany({});
      if (!slug) return res.json({ success: true, message: 'All menus cleared' });
    }
    if (!slug) return res.status(400).json({ message: 'slug is required' });
    if (isDeleted) {
      uuid != null ? await col.deleteOne({ uuid: Number(uuid) }) : await col.deleteOne({ slug });
      return res.json({ success: true, message: 'Menu deleted' });
    }
    const asUuid = uuid != null ? Number(uuid) : null;
    const prev = previousSlug ? String(previousSlug).trim() : null;
    const filter = asUuid !== null ? { uuid: asUuid } : (prev ? { slug: prev } : { slug });
    await col.updateOne(
      filter,
      {
        $set: { ...fields, slug, ...(asUuid !== null ? { uuid: asUuid } : {}), updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('sync-menu failed', { message: err.message });
    res.status(500).json({ message: err.message });
  }
});

app.post(`/${nodeEnv}/bulk-sync-menu`, async (req, res) => {
  try {
    if (!mongoose.connection?.db) return res.status(503).json({ message: 'Database not connected' });
    const { menus, clearAll } = req.body || {};
    const items = Array.isArray(menus) ? menus : [];
    const col = mongoose.connection.collection('menus');
    if (clearAll) await col.deleteMany({});
    for (const m of items) {
      if (!m?.slug) continue;
      const asUuid = m.uuid != null ? Number(m.uuid) : null;
      await col.updateOne(
        asUuid !== null ? { uuid: asUuid } : { slug: m.slug },
        {
          $set: { ...m, ...(asUuid !== null ? { uuid: asUuid } : {}), updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }
    res.json({ success: true, count: items.length });
  } catch (err) {
    logger.error('bulk-sync-menu failed', { message: err.message });
    res.status(500).json({ message: err.message });
  }
});

app.post(`/${nodeEnv}/bulk-sync-integration`, async (req, res) => {
  try {
    if (!mongoose.connection?.db) return res.status(503).json({ message: 'Database not connected' });
    const { integrations, clearAll } = req.body || {};
    const items = Array.isArray(integrations) ? integrations : [];
    const col = mongoose.connection.collection('integrations');
    if (clearAll) await col.deleteMany({});
    for (const item of items) {
      if (!item?.name) continue;
      await col.updateOne(
        { name: item.name },
        {
          $set: { ...item, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }
    res.json({ success: true, count: items.length });
  } catch (err) {
    logger.error('bulk-sync-integration failed', { message: err.message });
    res.status(500).json({ message: err.message });
  }
});

app.get(`/${nodeEnv}/menus`, async (req, res) => {
  try {
    if (!mongoose.connection?.db) return res.status(503).json({ message: 'Database not connected' });
    const col = mongoose.connection.collection('menus');
    const menus = await col.find({ active: true }).sort({ order: 1 }).toArray();
    res.json(menus);
  } catch (err) {
    logger.error('get-menus failed', { message: err.message });
    res.status(500).json({ message: err.message });
  }
});

// ── Response wrapper: inject total for array responses ───────────────────────
const responseWrapper = (_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && Array.isArray(body.data)) {
      body = { ...body, total: body.data.length };
    }
    return originalJson(body);
  };
  next();
};

// ── Mount API router ──────────────────────────────────────────────────────────
app.use(`/${nodeEnv}`, responseWrapper, apiRouter);

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { url: req.originalUrl, message: err.message });
  res.status(err.statusCode || 500).json({ sm: 2, error: err.message });
});

export { port };
export default app;
