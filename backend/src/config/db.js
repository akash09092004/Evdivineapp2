const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/astrology_app';
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    const fallbackUri = 'mongodb://127.0.0.1:27017/astrology_app';
    if (mongoUri !== fallbackUri) {
      try {
        await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 10000
        });
        console.log(`MongoDB connected via fallback: ${mongoose.connection.host}/${mongoose.connection.name}`);
        return mongoose.connection;
      } catch (fallbackError) {
        // In development, keep the server bootable even when MongoDB is unreachable.
        if ((process.env.NODE_ENV || 'development') !== 'production') {
          console.warn('MongoDB unavailable, starting without DB connection');
          return null;
        }
        throw fallbackError;
      }
    }

    if ((process.env.NODE_ENV || 'development') !== 'production') {
      console.warn('MongoDB unavailable, starting without DB connection');
      return null;
    }

    throw error;
  }
};

module.exports = connectDB;
