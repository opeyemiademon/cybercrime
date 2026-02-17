import dotenv from 'dotenv';

dotenv.config();

export const include = {
  TOKEN_SECRET: process.env.TOKEN_SECRET || 'your-super-secret-jwt-token-key-change-this-in-production',
  TOKEN_EXPIRY: (process.env.TOKEN_EXPIRY || '7d') as string | number,
  MONGO_URI: process.env.MONGO_URL||'',
  PORT: parseInt(process.env.PORT || '8000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};
