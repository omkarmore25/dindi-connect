const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  groupName: {
    type: String,
    required: true,
  },
  village: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    enum: ['Fake Group', 'Duplicate Group', 'Wrong Information', 'Inappropriate Content', 'Other'],
    required: true,
  },
  reportedBy: {
    type: String,
    default: '',
  },
  reporterPhone: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
