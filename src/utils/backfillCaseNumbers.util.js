import ImmigrationCase from '../models/ImmigrationCase.model.js';
import logger from './logger.util.js';

/**
 * One-time backfill: assign CASE-YYYY-NNNNN to any ImmigrationCase
 * documents that were created without a caseNumber.
 * Safe to run on every startup — skips docs that already have a number.
 */
export async function backfillCaseNumbers() {
  try {
    const missing = await ImmigrationCase.find(
      { caseNumber: { $in: [null, undefined, ''] } },
      { _id: 1, orgId: 1, createdAt: 1 },
      { sort: { createdAt: 1 } }
    ).lean();

    if (!missing.length) return;

    logger.info(`[backfill] Assigning case numbers to ${missing.length} cases…`);

    // For each distinct org, find the current max sequence so we don't collide
    // with numbers already assigned by the pre-save hook.
    const orgYearMax = {};

    for (const doc of missing) {
      const year = new Date(doc.createdAt || Date.now()).getFullYear();
      const key  = `${doc.orgId}::${year}`;

      if (orgYearMax[key] === undefined) {
        const prefix = `CASE-${year}-`;
        const agg = await ImmigrationCase.aggregate([
          {
            $match: {
              orgId:      doc.orgId,
              caseNumber: { $regex: `^${prefix}` },
              isDeleted:  { $ne: true },
            },
          },
          {
            $group: {
              _id:    null,
              maxSeq: {
                $max: {
                  $toInt: { $arrayElemAt: [{ $split: ['$caseNumber', '-'] }, -1] },
                },
              },
            },
          },
        ]);
        orgYearMax[key] = agg[0]?.maxSeq ?? 0;
      }

      orgYearMax[key] += 1;
      const year2 = new Date(doc.createdAt || Date.now()).getFullYear();
      const caseNumber = `CASE-${year2}-${String(orgYearMax[key]).padStart(5, '0')}`;

      await ImmigrationCase.updateOne(
        { _id: doc._id, caseNumber: { $in: [null, undefined, ''] } },
        { $set: { caseNumber } }
      );
    }

    logger.info('[backfill] Case number backfill complete.');
  } catch (err) {
    // Non-fatal — log and continue; existing IDs still work as navigation keys
    logger.error('[backfill] Case number backfill failed', { message: err.message });
  }
}
