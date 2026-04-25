const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  templeName: {
    type: String,
    required: true,
  },
  village: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  performingGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  locationCoordinates: {
    lat: { type: Number, required: false },
    lng: { type: Number, required: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
