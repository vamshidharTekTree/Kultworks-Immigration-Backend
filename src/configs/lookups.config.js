/**
 * Centralised lookup / dropdown values for the Immigration module.
 *
 * Served to the frontend via GET /:env/lookups/:key (no auth required).
 * Also imported by Mongoose models to enforce enum constraints, so values
 * here are the single source of truth — update here, nowhere else.
 */

export const WORK_STATUSES = [
  'F-1 OPT',
  'STEM OPT',
  'H-1B',
  'L-1A',
  'L-1B',
  'O-1',
  'E-3',
  'TN',
  'Green Card',
  'H-4',
  'Other',
];

export const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];

export const TAX_TERMS = ['W2', 'C2C', '1099'];

export const DATA_SOURCES = ['Manual', 'Workforce', 'ATS'];

export const EDUCATION_DEGREES = [
  "High School",
  "Associate",
  "Bachelor's",
  "Master's",
  "MBA",
  "Ph.D.",
  "Other",
];

export const PORTAL_STATUSES = ['Not Invited', 'Invited', 'Active', 'Suspended'];

/**
 * Map of lookup key → array of string values.
 * GET /lookups/:key returns { data: [ { value, label }, ... ] }
 */
export const LOOKUPS = {
  'work-statuses':     WORK_STATUSES,
  'genders':           GENDERS,
  'marital-statuses':  MARITAL_STATUSES,
  'tax-terms':         TAX_TERMS,
  'data-sources':      DATA_SOURCES,
  'education-degrees': EDUCATION_DEGREES,
  'portal-statuses':   PORTAL_STATUSES,
};
