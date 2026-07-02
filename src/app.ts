import Fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/user/user.routes.js';
import { accountRoutes } from './modules/account/account.routes.js';
import { walletRoutes } from './modules/wallet/wallet.routes.js';
import { transferRoutes } from './modules/transaction/transfer.routes.js';
import { bridgeRoutes } from './modules/bridge/bridge.routes.js';
import { ledgerRoutes } from './modules/ledger/ledger.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { supabaseRoutes } from './modules/supabase/supabase.routes.js';
import { kycRoutes } from './modules/kyc/kyc.routes.js';
import { blockchainMonitor } from './modules/blockchain/blockchain.monitor.js';
import dotenv from 'dotenv';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify: FastifyInstance = Fastify({
     logger: true,
     trustProxy: true,
     ignoreTrailingSlash: true,
});

// Middleware
fastify.register(fastifyCors, {
     origin: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
     allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
     credentials: true,
});

fastify.register(fastifyStatic, {
     root: path.join(__dirname, '../uploads'),
     prefix: '/uploads/',
});

fastify.register(fastifyJwt, {
     secret: process.env.JWT_SECRET || 'fallback_secret',
});

// Auth Decorator
fastify.decorate('authenticate', async (request: any, reply: any) => {
     try {
          await request.jwtVerify();
     } catch (err) {
          reply.send(err);
     }
});

// Error Handler
fastify.setErrorHandler((error: any, request, reply) => {
     if (error.validation) {
          reply.status(400).send({
               error: 'Validation Error',
               message: error.message,
               details: error.validation,
          });
     } else {
          const statusCode = error.statusCode || 500;
          reply.status(statusCode).send({
               error: error.name || 'Error',
               message: error.message || 'Internal Server Error',
          });
     }
});

// Routes
fastify.get('/', async () => {
     return {
          name: 'D-Bank API (Decentralised Online Banking System)',
          version: '1.0.0',
          description: 'Non-custodial, peer-to-peer banking platform built on Ethereum.',
          status: 'online',
          endpoints: {
               auth: '/api/auth',
               user: '/api/user',
               account: '/api/account',
               wallet: '/api/wallet',
               transfer: '/api/transfer',
               bridge: '/api/bridge',
               ledger: '/api/ledger',
               kyc: '/api/kyc',
               health: '/api/health'
          }
     };
});

// Routes (registered under both with and without /api prefix to support all scripts, docs, and Postman collection)
for (const prefix of ['', '/api']) {
     fastify.register(authRoutes, { prefix: `${prefix}/auth` });
     fastify.register(userRoutes, { prefix: `${prefix}/user` });
     fastify.register(accountRoutes, { prefix: `${prefix}/account` });
     fastify.register(walletRoutes, { prefix: `${prefix}/wallet` });
     fastify.register(transferRoutes, { prefix: `${prefix}/transfer` });
     fastify.register(bridgeRoutes, { prefix: `${prefix}/bridge` });
     fastify.register(ledgerRoutes, { prefix: `${prefix}/ledger` });
     fastify.register(kycRoutes, { prefix: `${prefix}/kyc` });
     fastify.register(adminRoutes, { prefix: `${prefix}/admin` });
     fastify.register(supabaseRoutes, { prefix: `${prefix}/supabase` });
}

// Health Check
fastify.get('/health', async () => {
     return { status: 'healthy', timestamp: new Date() };
});
fastify.get('/api/health', async () => {
     return { status: 'healthy', timestamp: new Date() };
});

const start = async () => {
     try {
          const port = parseInt(process.env.PORT || '5901');
          await fastify.listen({ port, host: '0.0.0.0' });

          // Start Blockchain Monitor
          blockchainMonitor.startMonitoring();

          console.log(`Server listening on ${port}`);
     } catch (err) {
          fastify.log.error(err);
          process.exit(1);
     }
};

start();
