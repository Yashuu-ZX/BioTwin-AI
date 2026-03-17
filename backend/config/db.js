const { mongoose } = require('./mongo');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/biotwin');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`MongoDB unavailable, continuing with in-memory store: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
