import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

async function startServer() {
  try {
    // Verify database connection
    const client = await pool.connect();
    const dbRes = await client.query('SELECT current_database(), version()');
    console.log(`[DB Connected] Database: ${dbRes.rows[0].current_database}`);
    client.release();

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] College Portal API running at http://localhost:${env.PORT}`);
    });

    const shutdown = async () => {
      console.log('[Server] Graceful shutdown initiated...');
      server.close(() => {
        pool.end(() => {
          console.log('[Server] Database pool closed. Exiting.');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err: any) {
    console.error('[Server Startup Error]', err.message);
    console.log('[Server] Note: Database may need to be initialized with: npm run db:setup');
    // Start server anyway so health endpoint or proxy can give meaningful status
    app.listen(env.PORT, () => {
      console.log(`[Server] College Portal API listening at http://localhost:${env.PORT} (Waiting for DB connection)`);
    });
  }
}

startServer();
