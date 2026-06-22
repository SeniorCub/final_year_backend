import express from 'express';
import { supabaseAuthExpress, adaptWebHandlerExpress } from '../src/utils/supabase.js';
import { withSupabase } from '@supabase/server';

const router = express.Router();

// 1. Example using Express middleware (Express style)
router.get(
     '/profile',
     supabaseAuthExpress('user'), // requires a valid User JWT
     async (req, res) => {
          const ctx = req.supabaseContext;
          if (!ctx) {
               return res.status(500).json({ error: 'Supabase context not initialized' });
          }

          // User details derived from JWT claims
          const claims = ctx.userClaims;

          return res.json({
               message: 'Successfully authenticated with Supabase user JWT (Express)',
               user: claims,
          });
     }
);

// 2. Example using the adaptWebHandlerExpress with standard `withSupabase` (Web Handler style)
router.get(
     '/todos',
     adaptWebHandlerExpress(
          withSupabase({ auth: 'user' }, async (req, ctx) => {
               const mockTodos = [
                    { id: 1, title: 'Learn Supabase Server SDK on Express', completed: true, userId: ctx.userClaims?.id }
               ];

               return Response.json({
                    message: 'Successfully fetched todos using RLS-scoped client (Express)',
                    claims: ctx.userClaims,
                    todos: mockTodos
               });
          })
     )
);

// 3. Example of an admin bypass route using secret key auth
router.get(
     '/admin-sync',
     adaptWebHandlerExpress(
          withSupabase({ auth: 'secret' }, async (req, ctx) => {
               return Response.json({
                    message: 'Successfully accessed admin endpoint bypassing RLS (Express)',
                    authMode: ctx.authMode
               });
          })
     )
);

export default router;
