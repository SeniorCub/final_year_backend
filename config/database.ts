import mongoose from 'mongoose';
import { logInfo, logError } from '../helpers/logger.js';

const connectDB = async (): Promise<string | null> => {
     try {
          const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/backend', {
               serverSelectionTimeoutMS: 5000
          });
          const status = `MongoDB Connected: ${conn.connection.host}`;
          console.log(status);
          logInfo(status, 'Database');
          return conn.connection.host;
     } catch (error: any) {
          const errMsg = `Database Connection Error: ${error.message}`;
          console.error(errMsg);
          logError(error, 'Database');
          return null;
     }
};

export default connectDB;

