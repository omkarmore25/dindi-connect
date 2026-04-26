const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Donation = require('../models/Donation');
const { validateDonation } = require('../middleware/sanitize');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET /api/donations/config
router.get('/config', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

// POST /api/donations/create-order
router.post('/create-order', validateDonation, async (req, res) => {
  const { amount, groupId, groupName, donorName, donorEmail, donorPhone, message } = req.body;

  // Razorpay notes only accept ASCII — strip emojis/unicode for the API call
  // We still save the full original message (with emojis) to our own database
  const asciiMessage = (message || '').replace(/[^\x00-\x7F]/g, '').trim();

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay uses paise
      currency: 'INR',
      notes: {
        donorName,
        donorEmail,
        donorPhone,
        groupName: groupName || 'Dindi Community',
        message: asciiMessage, // ASCII-only version for Razorpay
      },
    });

    // Save pending donation — use the ORIGINAL message with emojis
    const donation = new Donation({
      groupId: groupId || null,
      groupName: groupName || 'Dindi Community',
      donorName,
      donorEmail,
      donorPhone,
      amount,
      message: message || '', // Full message with emojis stored in DB
      razorpayOrderId: order.id,
      status: 'pending',
    });
    await donation.save();

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, donationId: donation._id });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// POST /api/donations/verify
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donationId } = req.body;
  
  console.log(`[PAYMENT DEBUG] Verifying: Order=${razorpay_order_id}, Payment=${razorpay_payment_id}, DonationID=${donationId}`);

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    console.error('[PAYMENT ERROR] Signature mismatch!');
    return res.status(400).json({ error: 'Payment verification failed.' });
  }

  try {
    const updated = await Donation.findByIdAndUpdate(donationId, {
      razorpayPaymentId: razorpay_payment_id,
      status: 'paid',
    }, { new: true });
    
    if (updated) {
      console.log(`[PAYMENT SUCCESS] Donation ${donationId} marked as paid.`);
    } else {
      console.error(`[PAYMENT ERROR] Donation ${donationId} not found during update!`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Donation verify error:', err);
    res.status(500).json({ error: 'Failed to update donation.' });
  }
});

// POST /api/donations/webhook — Automatic updates from Razorpay
router.post('/webhook', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  
  if (!signature || !req.rawBody) {
    return res.status(400).send('Missing signature or raw body');
  }

  // Cryptographically verify the webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('[WEBHOOK ERROR] Invalid Signature - Spoofing Attempt Detected');
    return res.status(400).send('Invalid signature');
  }

  console.log('[WEBHOOK SECURE] Received verified Razorpay Webhook:', req.body.event);

  if (req.body.event === 'payment.captured') {
    const payment = req.body.payload.payment.entity;
    const orderId = payment.order_id;
    
    try {
      const donation = await Donation.findOneAndUpdate(
        { razorpayOrderId: orderId },
        { razorpayPaymentId: payment.id, status: 'paid' },
        { new: true }
      );
      if (donation) {
        console.log(`[WEBHOOK SUCCESS] Donation for order ${orderId} marked as paid via webhook.`);
      }
    } catch (err) {
      console.error('[WEBHOOK ERROR] Failed to update donation via webhook:', err);
    }
  }

  res.json({ status: 'ok' });
});

// GET /api/donations — view all donations (for you as admin)
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'paid' }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donations.' });
  }
});

module.exports = router;
