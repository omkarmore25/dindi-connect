const cron = require('node-cron');
const Event = require('../models/Event');
const Competition = require('../models/Competition');

// Run every night at midnight (0 0 * * *)
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('[CRON] Starting daily database cleanup...');
        
        // Define "past" as strictly before today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const eventsResult = await Event.deleteMany({ date: { $lt: today } });
        console.log(`[CRON] Cleaned up ${eventsResult.deletedCount} expired events.`);

        const compsResult = await Competition.deleteMany({ date: { $lt: today } });
        console.log(`[CRON] Cleaned up ${compsResult.deletedCount} expired competitions.`);

        console.log('[CRON] Daily cleanup completed successfully.');
    } catch (err) {
        console.error('[CRON ERROR] Failed to clean up database:', err);
    }
});

console.log('[INIT] Cron jobs scheduled.');
