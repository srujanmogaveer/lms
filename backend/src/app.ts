import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else if (config.isDevelopment) {
          // Permissive in development only
          callback(null, true);
        } else {
          callback(new Error(`CORS policy: Origin '${origin}' is not allowed.`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP Request Logging
  if (config.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Root welcome endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'EduSphere LMS Backend API',
      version: '1.0.0',
      status: 'active',
      docs: '/api/v1/health',
    });
  });

  // Mount API v1 router
  app.use('/api/v1', apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Central error handler
  app.use(errorHandler);

  return app;
};
