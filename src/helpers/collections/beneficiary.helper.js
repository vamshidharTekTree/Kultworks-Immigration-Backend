import { services } from '../../utils/dbRegistry.util.js';

const CLOSED_STATUSES = ['approved', 'denied', 'withdrawn', 'closed', 'Approved', 'Denied', 'Withdrawn', 'Closed'];

/**
 * Compute org-scoped KPI counts for the Beneficiaries list page.
 *
 * @param {string} orgId
 * @returns {{ total: number, activeH1b: number, expiring90: number, openCases: number }}
 */
export async function getBeneficiaryKpi(orgId) {
  const now      = new Date();
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [[result], openCases] = await Promise.all([
    services.Beneficiary.service.aggregate({
      pipeline: [
        { $match: { orgId, isDeleted: { $ne: true } } },
        {
          $facet: {
            total: [{ $count: 'n' }],
            activeH1b: [
              { $match: { currentWorkStatus: { $regex: 'H-1B', $options: 'i' } } },
              { $count: 'n' },
            ],
            expiring90: [
              { $match: { workAuthEndDate: { $gte: now, $lte: in90Days } } },
              { $count: 'n' },
            ],
          },
        },
      ],
      errorHandler: true,
    }),
    services.ImmigrationCase.service.count({
      filter: { orgId, isDeleted: { $ne: true }, status: { $nin: CLOSED_STATUSES } },
    }),
  ]);

  return {
    total:      result?.total?.[0]?.n      ?? 0,
    activeH1b:  result?.activeH1b?.[0]?.n  ?? 0,
    expiring90: result?.expiring90?.[0]?.n ?? 0,
    openCases:  openCases                  ?? 0,
  };
}
