import Fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/user/user.routes.js';
import { accountRoutes } from './modules/account/account.routes.js';
import { walletRoutes } from './modules/wallet/wallet.routes.js';
import { transferRoutes } from './modules/transaction/transfer.routes.js';
import { bridgeRoutes } from './modules/bridge/bridge.routes.js';
import { ledgerRoutes } from './modules/ledger/ledger.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { blockchainMonitor } from './modules/blockchain/blockchain.monitor.js';
import dotenv from 'dotenv';

dotenv.config();

const fastify: FastifyInstance = Fastify({
     logger: true,
});

// Middleware
fastify.register(fastifyCors, {
     origin: process.env.CORS_ORIGINS?.split(',') || true,
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
               auth: '/auth',
               wallet: '/wallet',
               transfer: '/transfer',
               ledger: '/ledger',
               health: '/health'
          }
     };
});

fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(userRoutes, { prefix: '/user' });
fastify.register(accountRoutes, { prefix: '/account' });
fastify.register(walletRoutes, { prefix: '/wallet' });
fastify.register(transferRoutes, { prefix: '/transfer' });
fastify.register(bridgeRoutes, { prefix: '/bridge' });
fastify.register(ledgerRoutes, { prefix: '/ledger' });
fastify.register(adminRoutes, { prefix: '/admin' });

// Health Check
fastify.get('/health', async () => {
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
