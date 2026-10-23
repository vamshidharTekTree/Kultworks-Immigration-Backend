import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const normalizeEnvValue = (value) =>
  String(value ?? '').trim().replace(/^['"`]+|['"`]+$/g, '');

const normalizeOrigin = (value) =>
  normalizeEnvValue(value).replace(/\/+$/g, '');

function required(key) {
  const val = normalizeEnvValue(process.env[key]);
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key, defaultVal = '') {
  const val = normalizeEnvValue(process.env[key]);
  return val || defaultVal;
}

const nodeEnvRaw = optional('NODE_ENV', 'local').toLowerCase();
const normalizedEnv =
  nodeEnvRaw === 'development' || nodeEnvRaw === 'dev' ? 'local' : nodeEnvRaw;

export const nodeEnv = normalizedEnv;

export const env = {
  local: normalizedEnv === 'local',
  staging: normalizedEnv === 'staging',
  production: normalizedEnv === 'production',
};

export const port = optional('PORT', '5060');
export const mongoUrl = required('MONGO_URI');
export const tokenSecret = required('JWT_SECRET');
export const portalTokenSecret = required('PORTAL_TOKEN_SECRET');
export const s2sSecret = required('S2S_SECRET');

export const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(normalizeOrigin).filter(Boolean)
  : [];

export const uploadDir = optional('UPLOAD_DIR', 'uploads');
export const maxFileSizeMb = Number(optional('MAX_FILE_SIZE_MB', '10')) || 10;
export const logLevel = optional('LOG_LEVEL', 'info');

export const smtpHost = optional('SMTP_HOST');
export const smtpPort = Number(optional('SMTP_PORT', '587')) || 587;
export const smtpUser = optional('SMTP_USER');
export const smtpPass = optional('SMTP_PASS');
