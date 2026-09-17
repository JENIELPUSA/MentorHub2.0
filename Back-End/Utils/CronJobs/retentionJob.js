const cron = require('node-cron');
const runRetentionArchiveJob = require('../runRetentionArchiveJob');
const deleteOldNotifications = require("../deleteOldNotification");
const deleteOldDraftFiles = require("../deleteOldDraftFiles")
const deleteOldLogAudits = require("../deleteOldLogAudit")

const scheduleRetentionJob = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running scheduled retention archive job...');
    await runRetentionArchiveJob();
    await deleteOldNotifications();
    await deleteOldDraftFiles();
    await deleteOldLogAudits();
  });
};

module.exports = scheduleRetentionJob;

