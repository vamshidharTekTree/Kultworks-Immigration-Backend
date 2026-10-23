import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { corsOrigin, nodeEnv, port, s2sSecret } from './src/configs/env.config.js';
import apiRouter from './src/routes/apiRoute.js';
import logger from './src/utils/logger.util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

export const corsOptions = {
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 'X-Requested-With', 'Content-Type', 'Accept',
    'Authorization', 'x-access-token', 'x-portal-token',
    'x-internal-secret', 'x-device-type',
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
app.get('/health', (_req, res) => res.status(200).send('OK'));
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
