require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await User.find({ isVerified: false }).sort({ _id: -1 }).limit(1);
  if (users.length > 0) {
    const user = users[0];
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const url = `${process.env.APP_URL}/api/auth/verify/${token}`;
    console.log(`Verification URL: ${url}`);
  } else {
    console.log("No unverified users found.");
  }
  process.exit();
}).catch(console.error);
