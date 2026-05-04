const mongoose = require('mongoose');

const CommunityEventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  organizer: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    enum: ['Dindi', 'Bhajan', 'Kirtan', 'Music', 'Workshop', 'Cultural', 'Other'],
    required: true,
    default: 'Other'
  },
  description: {
    type: String,
    required: true,
  },
  venue: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    default: null, // null means single-day event
  },
  time: {
    type: String,
    default: '',
  },
  deadline: {
    type: Date,
    required: true,
  },
  contacts: [{
    name: { type: String, required: true },
    phone: { type: String, required: true }
  }],
  foodProvided: {
    type: Boolean,
    default: false,
  },
  entryFee: {
    type: Boolean,
    default: false,
  },
  entryFeeAmount: {
    type: Number,
    default: 0,
  },
  photos: {
    type: [String],
    default: [],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('CommunityEvent', CommunityEventSchema);
