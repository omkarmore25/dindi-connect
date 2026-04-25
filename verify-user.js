require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await User.updateMany({ isVerified: false }, { isVerified: true });
  console.log(`Successfully bypassed email verification and forcefully activated ${result.modifiedCount} accounts directly in the database!`);
  process.exit();
}).catch(console.error);
