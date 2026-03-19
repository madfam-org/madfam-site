import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import payload from 'payload';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

const start = async () => {
  console.log('CMS Configuration loaded');
  console.log(`Port configured: ${port}`);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'Set' : 'Not set');

  // Load payload.config.ts via ts-node (available as prod dep)
  const configPath = path.resolve(__dirname, '..', 'payload.config.ts');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const configModule = require(configPath);
  const config = configModule.default || configModule;

  // Health endpoint for K8s probes (Payload v3 doesn't mount Express routes)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Root health endpoint for monitoring and K8s probes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'cms' });
  });

  await (payload.init as Function)({
    config,
    express: app,
    onInit: async () => {
      console.log('Payload initialized successfully');
    },
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`CMS listening on port ${port}`);
  });
};

start();
