const mongoose = require('mongoose');
// MongoDB database connection function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://mongo:27017/driveDB');

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;