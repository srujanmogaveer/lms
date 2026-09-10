import { createApp } from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { StorageService } from './services/storage.service';

const startServer = () => {
  const app = createApp();

  const server = app.listen(config.port, () => {
    logger.info(`==================================================`);
    logger.info(` EduSphere LMS Backend Server Started Successfully`);
    logger.info(` Port: ${config.port}`);
    logger.info(` Environment: ${config.nodeEnv}`);
    logger.info(` Base URL: http://localhost:${config.port}`);
    logger.info(` Health Endpoint: http://localhost:${config.port}/api/v1/health`);
    logger.info(` Allowed Frontend: ${config.frontendUrl}`);
    logger.info(` Supabase Configured: ${config.supabase.isConfigured ? 'YES' : 'NO (Waiting for live keys in .env)'}`);
    logger.info(`==================================================`);

    // Ensure all required Supabase Storage buckets exist (including 'avatars').
    // Non-blocking: runs after server is listening.
    StorageService.ensureAllBuckets().catch((err) => {
      logger.warn('Storage bucket initialization warning:', err?.message || err);
    });
  });

  // Graceful shutdown
  const handleShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer();
