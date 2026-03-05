import dotenv from 'dotenv';
import express from 'express';
import payload from 'payload';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

const start = async () => {
  console.log('CMS Configuration loaded');
  console.log(`Port configured: ${port}`);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'Set' : 'Not set');

  // Payload v3 init — config auto-discovered from payload.config.ts
  // Use type assertion for v2/v3 API compatibility
  await (payload.init as Function)({
    express: app,
    onInit: async () => {
      (payload as any).logger?.info?.('Payload initialized');
    },
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`CMS listening on port ${port}`);
  });
};

start();
