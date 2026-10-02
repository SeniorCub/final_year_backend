import fastify from '../src/app.js';

export default async function handler(req: any, res: any) {
     await fastify.ready();
     fastify.server.emit('request', req, res);
}
