import { config } from './config.js';
import { getDatabase, closeDatabase } from './db/index.js';
import { initializeSchema } from './db/schema.js';
import { seedDemoUser } from './db/seed.js';
import { createApp } from './app.js';

function startServer() {
  try {
    // 1. Initialize SQLite Database
    const db = getDatabase();
    initializeSchema(db);

    // 2. Seed Default Demo User (idempotent)
    seedDemoUser(db);

    // 3. Create and start Express server
    const app = createApp(db);

    const server = app.listen(config.port, () => {
      console.log(`[Mock Server] Server listening on http://localhost:${config.port}`);
      console.log(`[Mock Server] Database initialized at ${config.databasePath}`);
      console.log(`[Mock Server] Demo account ready: aman@gmail.com`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('[Mock Server] Shutting down gracefully...');
      server.close(() => {
        closeDatabase();
        console.log('[Mock Server] Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Mock Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();
