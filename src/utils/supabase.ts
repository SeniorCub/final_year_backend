import { createSupabaseContext, SupabaseContext, withSupabase } from '@supabase/server';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';

// Extend FastifyRequest type definitions
declare module 'fastify' {
     interface FastifyRequest {
          supabaseContext?: SupabaseContext;
     }
}

// Extend Express Request type definitions
declare global {
     namespace Express {
          interface Request {
               supabaseContext?: SupabaseContext;
          }
     }
}

/**
 * Converts a FastifyRequest to a Web Standard Request and generates a SupabaseContext.
 */
export async function getFastifySupabaseContext(
     req: FastifyRequest,
     authMode: any = 'user'
): Promise<{ data: SupabaseContext | null; error: any }> {
     const protocol = req.protocol || 'http';
     const host = req.hostname || req.headers.host || 'localhost';
     const url = `${protocol}://${host}${req.raw.url || req.url}`;

     const headers = new Headers();
     for (const [key, value] of Object.entries(req.headers)) {
          if (value !== undefined) {
               if (Array.isArray(value)) {
                    value.forEach((v) => headers.append(key, v));
               } else {
                    headers.set(key, value);
               }
          }
     }

     let body: any = undefined;
     if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
          body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
     }

     const webReq = new Request(url, {
          method: req.method,
          headers,
          body,
          ...(body ? { duplex: 'half' } : {}),
     });

     return createSupabaseContext(webReq, { auth: authMode });
}

/**
 * Converts an ExpressRequest to a Web Standard Request and generates a SupabaseContext.
 */
export async function getExpressSupabaseContext(
     req: ExpressRequest,
     authMode: any = 'user'
): Promise<{ data: SupabaseContext | null; error: any }> {
     const protocol = req.protocol || 'http';
     const host = req.get('host') || 'localhost';
     const url = `${protocol}://${host}${req.originalUrl || req.url}`;

     const headers = new Headers();
     for (const [key, value] of Object.entries(req.headers)) {
          if (value !== undefined) {
               if (Array.isArray(value)) {
                    value.forEach((v) => headers.append(key, v));
               } else {
                    headers.set(key, value as string);
               }
          }
     }

     let body: any = undefined;
     if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
          body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
     }

     const webReq = new Request(url, {
          method: req.method,
          headers,
          body,
          ...(body ? { duplex: 'half' } : {}),
     });

     return createSupabaseContext(webReq, { auth: authMode });
}

/**
 * Fastify preHandler hook to validate auth using `@supabase/server`.
 */
export function supabaseAuth(authMode: any = 'user') {
     return async (request: FastifyRequest, reply: FastifyReply) => {
          const { data: ctx, error } = await getFastifySupabaseContext(request, authMode);
          if (error) {
               return reply.status(error.status || 401).send({
                    error: 'Unauthorized',
                    message: error.message,
               });
          }
          request.supabaseContext = ctx || undefined;
     };
}

/**
 * Express middleware to validate auth using `@supabase/server`.
 */
export function supabaseAuthExpress(authMode: any = 'user') {
     return async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
          const { data: ctx, error } = await getExpressSupabaseContext(req, authMode);
          if (error) {
               return res.status(error.status || 401).json({
                    error: 'Unauthorized',
                    message: error.message,
               });
          }
          req.supabaseContext = ctx || undefined;
          next();
     };
}

/**
 * Fastify adapter for standard Web Request/Response fetch handlers wrapped with `withSupabase`.
 */
export function adaptWebHandler(handler: (req: Request) => Promise<Response>) {
     return async (request: FastifyRequest, reply: FastifyReply) => {
          const protocol = request.protocol || 'http';
          const host = request.hostname || request.headers.host || 'localhost';
          const url = `${protocol}://${host}${request.raw.url || request.url}`;

          const headers = new Headers();
          for (const [key, value] of Object.entries(request.headers)) {
               if (value !== undefined) {
                    if (Array.isArray(value)) {
                         value.forEach((v) => headers.append(key, v));
                    } else {
                         headers.set(key, value);
                    }
               }
          }

          let body: any = undefined;
          if (request.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
               body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
          }

          const webReq = new Request(url, {
               method: request.method,
               headers,
               body,
               ...(body ? { duplex: 'half' } : {}),
          });

          const webRes = await handler(webReq);

          webRes.headers.forEach((value, key) => {
               reply.header(key, value);
          });

          reply.status(webRes.status);

          const contentType = webRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
               const json = await webRes.json();
               return reply.send(json);
          } else {
               const text = await webRes.text();
               return reply.send(text);
          }
     };
}

/**
 * Express adapter for standard Web Request/Response fetch handlers wrapped with `withSupabase`.
 */
export function adaptWebHandlerExpress(handler: (req: Request) => Promise<Response>) {
     return async (req: ExpressRequest, res: ExpressResponse) => {
          try {
               const protocol = req.protocol || 'http';
               const host = req.get('host') || 'localhost';
               const url = `${protocol}://${host}${req.originalUrl || req.url}`;

               const headers = new Headers();
               for (const [key, value] of Object.entries(req.headers)) {
                    if (value !== undefined) {
                         if (Array.isArray(value)) {
                              value.forEach((v) => headers.append(key, v));
                         } else {
                              headers.set(key, value as string);
                         }
                    }
               }

               let body: any = undefined;
               if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
                    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
               }

               const webReq = new Request(url, {
                    method: req.method,
                    headers,
                    body,
                    ...(body ? { duplex: 'half' } : {}),
               });

               const webRes = await handler(webReq);

               webRes.headers.forEach((value, key) => {
                    res.setHeader(key, value);
               });

               res.status(webRes.status);

               const contentType = webRes.headers.get('content-type');
               if (contentType && contentType.includes('application/json')) {
                    const json = await webRes.json();
                    return res.json(json);
               } else {
                    const text = await webRes.text();
                    return res.send(text);
               }
          } catch (err: any) {
               return res.status(500).json({ error: 'Internal Server Error', message: err.message });
          }
     };
}
