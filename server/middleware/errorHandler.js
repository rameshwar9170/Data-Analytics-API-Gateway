/**
 * Global Error Handler Middleware
 * Handles all error types and returns consistent error responses
 */

const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  let error = {
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
  };

  // Log the error
  logger.error(`${error.statusCode} - ${error.message}`, {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack,
  });

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.statusCode = 400;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error.message = field
      ? `Duplicate value for field: ${field}`
      : 'Duplicate key error';
    error.statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error.message = messages.join('. ');
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token has expired';
    error.statusCode = 401;
  }

  // MongoDB server selection & network error
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    error.message = 'Unable to reach MongoDB Atlas cluster. Please ensure your current IP address is whitelisted in MongoDB Atlas Network Access.';
    error.statusCode = 503;
  }

  // MongoDB timeout
  if (err.name === 'MongoServerError' && err.code === 50) {
    error.message = 'Query execution timed out';
    error.statusCode = 408;
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File size exceeds the allowed limit';
    error.statusCode = 413;
  }

  // SyntaxError (bad JSON body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error.message = 'Invalid JSON in request body';
    error.statusCode = 400;
  }

  const response = {
    success: false,
    message: error.message,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
