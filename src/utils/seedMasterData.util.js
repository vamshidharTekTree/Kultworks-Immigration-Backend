import VisaType       from '../models/VisaType.model.js';
import CaseStage      from '../models/CaseStage.model.js';
import DocType        from '../models/DocType.model.js';
import MasterListItem from '../models/MasterListItem.model.js';
import logger         from './logger.util.js';

const DEFAULT_VISA_TYPES = [
  { code: 'H1B',          name: 'H-1B',              category: 'nonimmigrant', petitionForms: ['I-129', 'LCA'], requiresLca: true,  displayOrder: 1  },
  { code: 'H1B_CAP',      name: 'H-1B Cap',           category: 'nonimmigrant', petitionForms: ['I-129', 'LCA'], requiresLca: true,  displayOrder: 2  },
  { code: 'H1B_TRANSFER', name: 'H-1B Transfer',      category: 'nonimmigrant', petitionForms: ['I-129', 'LCA'], requiresLca: true,  displayOrder: 3  },
  { code: 'H1B_EXTENSION',name: 'H-1B Extension',     category: 'nonimmigrant', petitionForms: ['I-129', 'LCA'], requiresLca: true,  displayOrder: 4  },
  { code: 'H1B_AMENDMENT',name: 'H-1B Amendment',     category: 'nonimmigrant', petitionForms: ['I-129', 'LCA'], requiresLca: true,  displayOrder: 5  },
  { code: 'L1A',          name: 'L-1A',               category: 'nonimmigrant', petitionForms: ['I-129'],         requiresLca: false, displayOrder: 6  },
  { code: 'L1B',          name: 'L-1B',               category: 'nonimmigrant', petitionForms: ['I-129'],         requiresLca: false, displayOrder: 7  },
  { code: 'O1',           name: 'O-1',                category: 'nonimmigrant', petitionForms: ['I-129'],         requiresLca: false, displayOrder: 8  },
  { code: 'TN',           name: 'TN',                 category: 'nonimmigrant', petitionForms: ['I-129B'],        requiresLca: false, displayOrder: 9  },
  { code: 'E3',           name: 'E-3',                category: 'nonimmigrant', petitionForms: ['I-129'],         requiresLca: false, displayOrder: 10 },
  { code: 'F1_OPT',       name: 'F-1 OPT',            category: 'nonimmigrant', petitionForms: ['I-765'],         requiresLca: false, displayOrder: 11 },
  { code: 'STEM_OPT',     name: 'STEM OPT',           category: 'nonimmigrant', petitionForms: ['I-765'],         requiresLca: false, displayOrder: 12 },
  { code: 'EAD',          name: 'EAD',                category: 'nonimmigrant', petitionForms: ['I-765'],         requiresLca: false, displayOrder: 13 },
  { code: 'H4',           name: 'H-4',                category: 'nonimmigrant', petitionForms: ['I-539'],         requiresLca: false, displayOrder: 14 },
  { code: 'L2',           name: 'L-2',                category: 'nonimmigrant', petitionForms: ['I-539'],         requiresLca: false, displayOrder: 15 },
  { code: 'GC_PERM',      name: 'Green Card (PERM)',   category: 'immigrant',    petitionForms: ['ETA-9089', 'I-140', 'I-485'], requiresLaborTest: true, displayOrder: 16 },
  { code: 'I140',         name: 'I-140',              category: 'immigrant',    petitionForms: ['I-140'],         requiresLca: false, displayOrder: 17 },
  { code: 'I485',         name: 'I-485',              category: 'immigrant',    petitionForms: ['I-485'],         requiresLca: false, displayOrder: 18 },
  { code: 'I765',         name: 'I-765',              category: 'nonimmigrant', petitionForms: ['I-765'],         requiresLca: false, displayOrder: 19 },
  { code: 'I131',         name: 'I-131',              category: 'nonimmigrant', petitionForms: ['I-131'],         requiresLca: false, displayOrder: 20 },
  { code: 'I539',         name: 'I-539',              category: 'nonimmigrant', petitionForms: ['I-539'],         requiresLca: false, displayOrder: 21 },
];

const DEFAULT_CASE_STAGES = [
  { code: 'INTAKE',          name: 'Intake',          order: 1 },
  { code: 'PREPARATION',     name: 'Preparation',     order: 2 },
  { code: 'ATTORNEY_REVIEW', name: 'Attorney Review', order: 3 },
  { code: 'READY_TO_FILE',   name: 'Ready to File',   order: 4 },
  { code: 'FILED',           name: 'Filed',           order: 5 },
  { code: 'RECEIPT',         name: 'Receipt',         order: 6 },
  { code: 'RFE_NOID',        name: 'RFE / NOID',      order: 7 },
  { code: 'DECISION',        name: 'Decision',        order: 8 },
  { code: 'CLOSED',          name: 'Closed',          order: 9 },
];

const DEFAULT_DOC_TYPES = [
  { code: 'PASSPORT',      name: 'Passport',                    expiryTracked: true,  isRequired: true  },
  { code: 'I94',           name: 'I-94 Arrival Record',         expiryTracked: true,  isRequired: true  },
  { code: 'VISA_STAMP',    name: 'Visa Stamp',                  expiryTracked: true,  isRequired: true  },
  { code: 'I797',          name: 'I-797 Approval Notice',       expiryTracked: true,  isRequired: true  },
  { code: 'EAD_CARD',      name: 'EAD Card (I-766)',            expiryTracked: true,  isRequired: false },
  { code: 'SSN',           name: 'Social Security Card',        expiryTracked: false, isRequired: false },
  { code: 'DRIVERS_LIC',   name: 'Driver\'s License',           expiryTracked: true,  isRequired: false },
  { code: 'DEGREE',        name: 'Educational Degree',          expiryTracked: false, isRequired: false },
  { code: 'TRANSCRIPTS',   name: 'Academic Transcripts',        expiryTracked: false, isRequired: false },
  { code: 'RESUME',        name: 'Resume / CV',                 expiryTracked: false, isRequired: false },
  { code: 'OFFER_LETTER',  name: 'Offer Letter',                expiryTracked: false, isRequired: false },
  { code: 'LCA',           name: 'Labor Condition Application', expiryTracked: true,  isRequired: false },
  { code: 'I129',          name: 'I-129 Petition',              expiryTracked: false, isRequired: false },
  { code: 'G28',           name: 'G-28 Notice of Appearance',   expiryTracked: false, isRequired: false },
  { code: 'PAYSLIP',       name: 'Pay Stub / Payslip',          expiryTracked: false, isRequired: false },
  { code: 'TAX_RETURN',    name: 'Tax Return (W-2 / 1099)',     expiryTracked: false, isRequired: false },
  { code: 'BIRTH_CERT',    name: 'Birth Certificate',           expiryTracked: false, isRequired: false },
  { code: 'MARRIAGE_CERT', name: 'Marriage Certificate',        expiryTracked: false, isRequired: false },
];

const DEFAULT_SOC_CODES = [
  { code: '15-1252', name: 'Software Developers',                                order: 1  },
  { code: '15-1253', name: 'Software Quality Assurance Analysts and Testers',    order: 2  },
  { code: '15-1211', name: 'Computer Systems Analysts',                          order: 3  },
  { code: '15-1212', name: 'Information Security Analysts',                      order: 4  },
  { code: '15-1221', name: 'Computer and Information Research Scientists',       order: 5  },
  { code: '15-1231', name: 'Computer Network Support Specialists',               order: 6  },
  { code: '15-1232', name: 'Computer User Support Specialists',                  order: 7  },
  { code: '15-1241', name: 'Computer Network Architects',                        order: 8  },
  { code: '15-1242', name: 'Database Administrators',                            order: 9  },
  { code: '15-1243', name: 'Database Architects',                                order: 10 },
  { code: '15-1244', name: 'Network and Computer Systems Administrators',        order: 11 },
  { code: '15-1251', name: 'Computer Programmers',                               order: 12 },
  { code: '15-2051', name: 'Data Scientists',                                    order: 13 },
  { code: '15-1299', name: 'Computer Occupations, All Other',                    order: 14 },
  { code: '11-3021', name: 'Computer and Information Systems Managers',          order: 15 },
];

const DEFAULT_WAGE_LEVELS = [
  { code: 'I',   name: 'Level I — Entry',           order: 1 },
  { code: 'II',  name: 'Level II — Qualified',       order: 2 },
  { code: 'III', name: 'Level III — Experienced',    order: 3 },
  { code: 'IV',  name: 'Level IV — Fully Competent', order: 4 },
];

const DEFAULT_WORK_AUTH_CATS = [
  { code: 'H1B',      name: 'H-1B',          order: 1  },
  { code: 'H1B_CAP',  name: 'H-1B Cap',      order: 2  },
  { code: 'L1A',      name: 'L-1A',          order: 3  },
  { code: 'L1B',      name: 'L-1B',          order: 4  },
  { code: 'O1',       name: 'O-1',           order: 5  },
  { code: 'TN',       name: 'TN',            order: 6  },
  { code: 'E3',       name: 'E-3',           order: 7  },
  { code: 'F1_OPT',   name: 'F-1 OPT',      order: 8  },
  { code: 'STEM_OPT', name: 'STEM OPT',      order: 9  },
  { code: 'EAD',      name: 'EAD',           order: 10 },
  { code: 'GC',       name: 'Green Card',    order: 11 },
  { code: 'CITIZEN',  name: 'US Citizen',    order: 12 },
  { code: 'GC_EAD',   name: 'GC EAD',       order: 13 },
  { code: 'H4_EAD',   name: 'H-4 EAD',      order: 14 },
  { code: 'L2_EAD',   name: 'L-2 EAD',      order: 15 },
];

const DEFAULT_COUNTRIES = [
  { code: 'IND', name: 'India',           order: 1  },
  { code: 'CHN', name: 'China',           order: 2  },
  { code: 'MEX', name: 'Mexico',          order: 3  },
  { code: 'CAN', name: 'Canada',          order: 4  },
  { code: 'PHL', name: 'Philippines',     order: 5  },
  { code: 'GBR', name: 'United Kingdom',  order: 6  },
  { code: 'DEU', name: 'Germany',         order: 7  },
  { code: 'AUS', name: 'Australia',       order: 8  },
  { code: 'BRA', name: 'Brazil',          order: 9  },
  { code: 'KOR', name: 'South Korea',     order: 10 },
  { code: 'FRA', name: 'France',          order: 11 },
  { code: 'NGA', name: 'Nigeria',         order: 12 },
  { code: 'PAK', name: 'Pakistan',        order: 13 },
  { code: 'BGD', name: 'Bangladesh',      order: 14 },
  { code: 'VNM', name: 'Vietnam',         order: 15 },
  { code: 'UKR', name: 'Ukraine',         order: 16 },
  { code: 'ROU', name: 'Romania',         order: 17 },
  { code: 'COL', name: 'Colombia',        order: 18 },
  { code: 'PER', name: 'Peru',            order: 19 },
  { code: 'ARG', name: 'Argentina',       order: 20 },
  { code: 'ESP', name: 'Spain',           order: 21 },
  { code: 'POL', name: 'Poland',          order: 22 },
  { code: 'ZAF', name: 'South Africa',    order: 23 },
  { code: 'EGY', name: 'Egypt',           order: 24 },
  { code: 'USA', name: 'United States',   order: 25 },
];

const LIST_ITEM_SEEDS = [
  { type: 'soc_code',      items: DEFAULT_SOC_CODES    },
  { type: 'wage_level',    items: DEFAULT_WAGE_LEVELS  },
  { type: 'work_auth_cat', items: DEFAULT_WORK_AUTH_CATS },
  { type: 'country',       items: DEFAULT_COUNTRIES    },
];

/**
 * Seeds VisaType, CaseStage, DocType, and MasterListItem (soc_code / wage_level /
 * work_auth_cat / country) for `orgId` if the collections are empty for that org.
 * Safe to call on every GET — skips if data exists.
 */
export async function seedMasterDataForOrg(orgId) {
  try {
    const [vtCount, csCount, dtCount] = await Promise.all([
      VisaType.countDocuments({ orgId, isDeleted: { $ne: true } }),
      CaseStage.countDocuments({ orgId, isDeleted: { $ne: true } }),
      DocType.countDocuments({ orgId, isDeleted: { $ne: true } }),
    ]);

    const inserts = [];
    if (vtCount === 0) {
      inserts.push(
        VisaType.insertMany(
          DEFAULT_VISA_TYPES.map((v) => ({ ...v, orgId, createdBy: 'system', isActive: true })),
          { ordered: false }
        ).catch(() => {}) // ignore duplicate-code errors from prior partial seeds
      );
    }
    if (csCount === 0) {
      inserts.push(
        CaseStage.insertMany(
          DEFAULT_CASE_STAGES.map((s) => ({ ...s, orgId, createdBy: 'system', isActive: true })),
          { ordered: false }
        ).catch(() => {})
      );
    }
    if (dtCount === 0) {
      inserts.push(
        DocType.insertMany(
          DEFAULT_DOC_TYPES.map((d) => ({ ...d, orgId, createdBy: 'system', isActive: true })),
          { ordered: false }
        ).catch(() => {})
      );
    }
    // Seed MasterListItem types
    for (const { type, items } of LIST_ITEM_SEEDS) {
      const count = await MasterListItem.countDocuments({ orgId, type, isDeleted: { $ne: true } });
      if (count === 0) {
        inserts.push(
          MasterListItem.insertMany(
            items.map((it) => ({ ...it, type, orgId, isActive: true })),
            { ordered: false }
          ).catch(() => {})
        );
      }
    }

    if (inserts.length) {
      await Promise.all(inserts);
      logger.info(`[seedMaster] Seeded master data for org ${orgId} (vt=${vtCount===0}, cs=${csCount===0}, dt=${dtCount===0})`);
    }
  } catch (err) {
    logger.error('[seedMaster] Seed failed', { message: err.message });
  }
}
