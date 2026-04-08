const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const admin = await User.findOne({ role: 'admin' }).lean();
    console.log('admin:', admin ? { email: admin.email, role: admin.role, id: admin._id.toString() } : 'none');
    if (admin) console.log('createdAt', admin.createdAt);
    await mongoose.disconnect();
  } catch (err) {
    console.error('err', err.message);
    process.exit(1);
  }
})();
