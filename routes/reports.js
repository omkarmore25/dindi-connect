const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { sendReportEmail } = require('../utils/mailer');
const Group = require('../models/Group');

// POST /api/reports - Submit a new report
router.post('/', async (req, res) => {
  try {
    const { groupId, groupName, village, reason, reportedBy, reporterPhone } = req.body;
    
    // Create new report
    const newReport = new Report({
      groupId,
      groupName,
      village,
      reason,
      reportedBy,
      reporterPhone
    });

    await newReport.save();

    // Check report count for this group
    const reportCount = await Report.countDocuments({ groupId });
    
    // Send email to admin only on 3rd report
    if (reportCount === 3) {
      await sendReportEmail(groupName, village, reason, reportedBy, reporterPhone);
    }

    res.status(201).json({ message: 'Thank you! We will review this group shortly.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
