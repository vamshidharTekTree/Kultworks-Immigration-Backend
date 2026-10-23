import cron from 'node-cron';
import mongoose from 'mongoose';
import { sendDeadlineReminder } from './email.util.js';
import logger from './logger.util.js';

async function runDeadlineReminders() {
  try {
    const now     = new Date();
    const in90    = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const ImmigrationCase = mongoose.model('ImmigrationCase');
    const cases = await ImmigrationCase.find({
      isDeleted:  { $ne: true },
      status:     'approved',
      expiryDate: { $gte: now, $lte: in90 },
    })
      .populate({ path: 'beneficiaryId', select: 'firstName lastName email' })
      .lean();

    // Group cases by beneficiary email
    const byEmail = {};
    for (const c of cases) {
      const email = c.beneficiaryId?.email;
      if (!email) continue;
      if (!byEmail[email]) byEmail[email] = [];
      byEmail[email].push(c);
    }

    for (const [email, emailCases] of Object.entries(byEmail)) {
      await sendDeadlineReminder({ to: email, cases: emailCases });
    }

    logger.info(`[cron] deadline-reminders sent to ${Object.keys(byEmail).length} recipients`);
  } catch (err) {
    logger.error('[cron] deadline-reminders failed', { message: err.message });
  }
}

async function runTimelineCleanup() {
  try {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 2);

    const CaseTimeline = mongoose.model('CaseTimeline');
    const result = await CaseTimeline.updateMany(
      { isDeleted: { $ne: true }, createdAt: { $lt: cutoff } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    logger.info(`[cron] timeline-cleanup soft-deleted ${result.modifiedCount} entries`);
  } catch (err) {
    logger.error('[cron] timeline-cleanup failed', { message: err.message });
  }
}

export default function scheduleCronJobs() {
  // Daily at 8am — send deadline reminders for cases expiring within 90 days
  cron.schedule('0 8 * * *', runDeadlineReminders);

  // Weekly Sunday at midnight — soft-delete timeline entries older than 2 years
  cron.schedule('0 0 * * 0', runTimelineCleanup);

  logger.info('[cron] Scheduled jobs registered');
}
