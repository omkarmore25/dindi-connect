const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    enum: ['Dindi', 'Bhajan', 'Kirtan'],
    required: true,
    default: 'Dindi'
  },
  location: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  registeredGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
  }],
  photos: [{
    type: String,
  }],
  locationCoordinates: {
    lat: { type: Number, required: false },
    lng: { type: Number, required: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Competition', CompetitionSchema);
