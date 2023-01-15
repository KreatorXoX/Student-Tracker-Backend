const mongoose = require("mongoose");

const connectDB = () => {
  try {
    mongoose.set("strictQuery", false);
    mongoose.connect(process.env.DB_URI);
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = connectDB;
