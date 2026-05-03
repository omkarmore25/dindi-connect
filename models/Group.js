const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
  },
  village: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  groupType: {
    type: String,
    enum: ['Dindi', 'Bhajan', 'Kirtan'],
    required: true,
    default: 'Dindi'
  },
  leaderName: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  memberCount: {
    type: Number,
    required: true,
  },
  registrationId: {
    type: String,
    default: null,
  },
  acceptingBookings: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    default: '',
  },
  achievements: {
    type: [String],
    default: [],
  },
  photos: {
    type: [String],
    default: [],
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

GroupSchema.index({ groupName: 1, village: 1, groupType: 1 }, { unique: true });

module.exports = mongoose.model('Group', GroupSchema);
