const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Group = require('./models/Group');
const Competition = require('./models/Competition');
const Event = require('./models/Event');
const Donation = require('./models/Donation');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB.');

    const userCount = await User.countDocuments();
    const groupCount = await Group.countDocuments();
    const compCount = await Competition.countDocuments();
    const eventCount = await Event.countDocuments();
    const donationCount = await Donation.countDocuments();
    const paidDonationCount = await Donation.countDocuments({ status: 'paid' });

    console.log('\n--- Database Summary ---');
    console.log(`Users: ${userCount}`);
    console.log(`Groups: ${groupCount}`);
    console.log(`Competitions: ${compCount}`);
    console.log(`Events: ${eventCount}`);
    console.log(`Donations: ${donationCount} (Paid: ${paidDonationCount})`);
    console.log('------------------------\n');

  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    process.exit();
  }
}

check();
