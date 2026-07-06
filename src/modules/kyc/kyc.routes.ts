import { FastifyInstance } from 'fastify';
import { kycService } from './kyc.service.js';
import { z } from 'zod';

const tier1Schema = z.object({
  nin: z.string().length(11, 'NIN must be 11 digits'),
});

const tier2Schema = z.object({
  bvn: z.string().length(11, 'BVN must be 11 digits'),
});

const tier3Schema = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  documentType: z.enum(['UTILITY_BILL', 'BANK_STATEMENT', 'TENANCY_AGREEMENT']),
  documentImageBase64: z.string(), // In a real app this would be a file upload
});

export async function kycRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', (fastify as any).authenticate);

  fastify.get('/status', async (request) => {
    const userId = (request.user as any).userId;
    return await kycService.getKycStatus(userId);
  });

  fastify.post('/upgrade/tier1', async (request, reply) => {
    const userId = (request.user as any).userId;
    try {
      const data = tier1Schema.parse(request.body);
      const result = await kycService.upgradeTier1(userId, data);
      return result;
    } catch (error: any) {
      return reply.code(400).send({ error: error.message || error.errors });
    }
  });

  fastify.post('/upgrade/tier2', async (request, reply) => {
    const userId = (request.user as any).userId;
    try {
      const data = tier2Schema.parse(request.body);
      const result = await kycService.upgradeTier2(userId, data);
      return result;
    } catch (error: any) {
      return reply.code(400).send({ error: error.message || error.errors });
    }
  });

  fastify.post('/upgrade/tier3', async (request, reply) => {
    const userId = (request.user as any).userId;
    try {
      const data = tier3Schema.parse(request.body);
      const result = await kycService.upgradeTier3(userId, data);
      return result;
    } catch (error: any) {
      return reply.code(400).send({ error: error.message || error.errors });
    }
  });
}
