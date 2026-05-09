import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import socketHandler from './socket/socketHandler.js';
import errorHandler from './middleware/errorHandler.js';
import { logError, logInfo, logWarn } from './helpers/logger.js';

// __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global Error Handlers (must be registered early)
process.on('uncaughtException', (err: Error) => {
     console.error('Uncaught Exception:', err);
     logError(err, 'Uncaught Exception');
     // process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
     logError(reason, 'Unhandled Rejection');
});

// Connect to database
const dbHost = await connectDB();

// ─── CORS ────────────────────────────────────────────────────────────────────
const DEFAULT_ORIGINS = [
     'http://localhost:5173',
     'http://localhost:3000',
     'http://127.0.0.1:5173',
     'https://crm.sunmence.com.ng',
     'https://www.crm.sunmence.com.ng'
];

const allowedOrigins: string[] = process.env.CORS_ORIGINS
     ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
     : DEFAULT_ORIGINS;

const originValidator = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
     if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
     } else {
          logWarn(`Blocked by CORS: ${origin}`, 'CORS');
          callback(new Error(`CORS: origin '${origin}' is not allowed`));
     }
};

const corsOptions: cors.CorsOptions = {
     origin: originValidator as any,
     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization'],
     credentials: true
};

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
     cors: corsOptions
});

// Mount socket handler
socketHandler(io);

// ─── Middleware ───────────────────────────────────────────────────────────────

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
     logInfo(`${req.method} ${req.originalUrl}`, 'Incoming Request');
     next();
});

// CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
     res.json({
          message: 'Chat server is running',
          data: {
               status: 'healthy',
               dbStatus: dbHost ? 'connected' : 'disconnected',
               timestamp: new Date(),
               version: '1.0.0'
          }
     });
});

// 404 handler
app.use((req: Request, res: Response) => {
     res.status(404).json({
          message: 'Route not found',
          data: {
               path: req.path,
               method: req.method
          }
     });
});

// Global error handler
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 9001;

server.listen(PORT, () => {
     console.log(`
     Node Js Server Running
     Port: ${String(PORT).padEnd(21)}
     Database: ${String(dbHost || 'Error').padEnd(17)}
     Environment: ${(process.env.NODE_ENV || 'development').padEnd(14)}
     URL: http://127.0.0.1:${String(PORT).padEnd(12)}
  `);
     logInfo(`Server started on port ${PORT}`, 'Server Startup');
     logInfo(`Database Host: ${dbHost}`, 'Server Startup');
     logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`, 'Server Startup');
     logInfo(`URL: http://127.0.0.1:${PORT}`, 'Server Startup');
});

export { app, io };
