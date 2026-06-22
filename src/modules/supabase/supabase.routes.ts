import { FastifyInstance } from 'fastify';
import { supabaseAuth, adaptWebHandler } from '../../utils/supabase.js';
import { withSupabase } from '@supabase/server';

export async function supabaseRoutes(fastify: FastifyInstance) {
     // 1. Example using the supabaseAuth preHandler hook (Fastify style)
     fastify.get(
          '/profile',
          {
               preHandler: supabaseAuth('user'), // requires a valid User JWT
          },
          async (request, reply) => {
               const ctx = request.supabaseContext;
               if (!ctx) {
                    return reply.status(500).send({ error: 'Supabase context not initialized' });
               }

               // User details derived from JWT claims
               const claims = ctx.userClaims;

               // You can query data using the RLS-scoped client:
               // const { data } = await ctx.supabase.from('profiles').select().eq('id', claims.sub);

               return {
                    message: 'Successfully authenticated with Supabase user JWT',
                    user: claims,
               };
          }
     );

     // 2. Example using the adaptWebHandler with standard `withSupabase` (Web Handler style)
     fastify.get(
          '/todos',
          adaptWebHandler(
               withSupabase({ auth: 'user' }, async (req, ctx) => {
                    // RLS-scoped client: Only returns todos belonging to this user
                    // const { data: todos } = await ctx.supabase.from('todos').select();
                    
                    const mockTodos = [
                         { id: 1, title: 'Learn Supabase Server SDK', completed: true, userId: ctx.userClaims?.id }
                    ];

                    return Response.json({
                         message: 'Successfully fetched todos using RLS-scoped client',
                         claims: ctx.userClaims,
                         todos: mockTodos
                    });
               })
          )
     );

     // 3. Example of an admin bypass route using secret key auth
     fastify.get(
          '/admin-sync',
          adaptWebHandler(
               withSupabase({ auth: 'secret' }, async (req, ctx) => {
                    // Bypasses RLS to fetch admin data
                    // const { data: allData } = await ctx.supabaseAdmin.from('todos').select();

                    return Response.json({
                         message: 'Successfully accessed admin endpoint bypassing RLS',
                         authMode: ctx.authMode
                    });
               })
          )
     );
}
