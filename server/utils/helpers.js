/**
 * Common Helper Functions
 */

const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Generate a unique token (URL-safe)
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} Hex token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a unique order/invoice number with prefix
 * @param {string} prefix - Prefix for the number
 * @returns {string}
 */
const generateOrderNumber = (prefix = 'ORD') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Paginate query results
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Items per page
 * @returns {{ skip: number, limit: number, page: number }}
 */
const paginate = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { skip: (p - 1) * l, limit: l, page: p };
};

/**
 * Build pagination metadata for responses
 */
const paginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Sanitize a string for use as a MongoDB database name
 * @param {string} name
 * @returns {string}
 */
const sanitizeDbName = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 64);
};

/**
 * Generate a new MongoDB ObjectId
 * @returns {mongoose.Types.ObjectId}
 */
const newObjectId = () => new mongoose.Types.ObjectId();

/**
 * Pick random element from array
 * @param {Array} arr
 * @returns {*}
 */
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Pick N random elements from array (no duplicates)
 * @param {Array} arr
 * @param {number} n
 * @returns {Array}
 */
const randomPickN = (arr, n) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
};

/**
 * Generate a random number within a range
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random float within a range, rounded to decimals
 * @param {number} min
 * @param {number} max
 * @param {number} decimals
 * @returns {number}
 */
const randomFloat = (min, max, decimals = 2) => {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
};

/**
 * Chunk an array into smaller arrays
 * @param {Array} array
 * @param {number} size
 * @returns {Array<Array>}
 */
const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Format bytes to human-readable string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Create a slug from a string
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Mask sensitive data (card numbers, etc.)
 */
const maskString = (str, visibleChars = 4) => {
  if (!str || str.length <= visibleChars) return str;
  return '*'.repeat(str.length - visibleChars) + str.slice(-visibleChars);
};

module.exports = {
  generateToken,
  generateOrderNumber,
  sleep,
  paginate,
  paginationMeta,
  sanitizeDbName,
  newObjectId,
  randomPick,
  randomPickN,
  randomBetween,
  randomFloat,
  chunk,
  formatBytes,
  slugify,
  maskString,
};
