/**
 * iCoded Automation Server
 * Main application entrypoint
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { Server } = require('socket.io');

const config = require('./config/app');
const { connectDatabase } = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter: globalLimiter } = require('./middleware/rateLimiter');
const seedAdmin = require('./seeds/adminSeed');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Attach Socket.IO to Express app context
app.set('io', io);

// Security & utility middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or dev tools)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.isDev) {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', globalLimiter);

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

// Socket.IO real-time event handlers
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join:dataset', (datasetId) => {
    socket.join(`dataset:${datasetId}`);
    logger.info(`Socket ${socket.id} joined room dataset:${datasetId}`);
  });

  socket.on('leave:dataset', (datasetId) => {
    socket.leave(`dataset:${datasetId}`);
  });

  socket.on('join:candidate', (candidateId) => {
    socket.join(`candidate:${candidateId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Start Server
const startServer = async () => {
  console.log('[DEBUG] Inside startServer()');
  server.on('error', (err) => {
    console.error('[DEBUG] SERVER LISTEN ERROR:', err);
  });
  try {
    return new Promise((resolve) => {
      console.log('[DEBUG] Calling server.listen on port', config.port);
      server.listen(config.port, async () => {
        console.log('[DEBUG] server.listen callback fired!');
        logger.info(`
=====================================================
  iCoded Automation Server Running
  Port: ${config.port}
  Environment: ${config.nodeEnv}
=====================================================
        `);

        // Connect to MongoDB Atlas
        const attemptConnection = async () => {
          try {
            await connectDatabase();
            await seedAdmin();
            logger.info('MongoDB Atlas: Connected & Default Users Seeded');
            return true;
          } catch (dbErr) {
            logger.error(`Atlas connection attempt error: ${dbErr.message}`);
            return false;
          }
        };

        const connected = await attemptConnection();
        if (!connected) {
          logger.info('Server is listening. Background reconnect loop will auto-connect as soon as Atlas IP is whitelisted...');
          const retryTimer = setInterval(async () => {
            const ok = await attemptConnection();
            if (ok) {
              logger.info('Successfully established connection to MongoDB Atlas!');
              clearInterval(retryTimer);
            }
          }, 5000);
        }

        resolve(server);
      });
    });
  } catch (error) {
    logger.error(`Failed to bind server port: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module || !process.env.JEST_WORKER_ID) {
  startServer();
}

module.exports = { app, server, startServer };
