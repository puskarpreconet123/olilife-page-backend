const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ email: 'admin@olilife.com' }).lean();
    console.log('admin found:', !!admin);
    if (admin) {
      console.log('email:', admin.email);
      console.log('role:', admin.role);
      console.log('password hash:', admin.password);
      console.log('bcrypt compare default password:', await bcrypt.compare('admin123456', admin.password));
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
})();
