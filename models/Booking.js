const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  eventDate: { type: Date, required: true },
  purpose: { type: String, required: true },
  additionalMessage: { type: String },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  groupName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['new', 'confirmed', 'pending', 'rejected'], 
    default: 'new' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
