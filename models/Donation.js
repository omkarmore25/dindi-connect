const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  groupName: { type: String, required: true, default: 'Dindi Community' },
  donorName: { type: String, required: true },
  donorEmail: { type: String, required: true },
  donorPhone: { type: String, required: true },
  amount: { type: Number, required: true }, // in INR
  message: { type: String, default: '' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
