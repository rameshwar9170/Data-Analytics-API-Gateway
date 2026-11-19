/**
 * Analytics API Controller
 * Provides public/authenticated data analysis API endpoints:
 * - Live data querying (JSON)
 * - Direct query exports (CSV / JSON file download)
 */

const { executeQuery } = require('../services/queryExecutionService');
const { getDocuments } = require('../services/databaseService');

/**
 * Helper to convert array of flat/nested objects into CSV string
 */
const jsonToCsv = (items) => {
  if (!items || items.length === 0) return '';

  // Extract all unique headers across items
  const headerSet = new Set();
  items.forEach((item) => {
    Object.keys(item).forEach((key) => headerSet.add(key));
  });
  const headers = Array.from(headerSet);

  const escapeCsvVal = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      val = JSON.stringify(val);
    }
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [];
  // Add header row
  csvRows.push(headers.map((h) => escapeCsvVal(h)).join(','));

  // Add data rows
  for (const item of items) {
    const row = headers.map((header) => escapeCsvVal(item[header]));
    csvRows.push(row.join(','));
  }

  return csvRows.join('\r\n');
};

/**
 * POST /api/analytics/query
 * Live querying endpoint for Python, Pandas, BI tools, and web clients
 */
const queryData = async (req, res, next) => {
  try {
    const {
      database,
      collection,
      queryType = 'find',
      filter = {},
      options = {},
    } = req.body;

    if (!database || !collection) {
      return res.status(400).json({
        success: false,
        message: 'Both database and collection parameters are required.',
      });
    }

    const result = await executeQuery(
      database,
      collection,
      queryType,
      filter,
      options
    );

    res.json({
      success: true,
      database,
      collection,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/analytics/export & GET /api/analytics/export
 * Downloads query result directly as a CSV or JSON file
 */
const exportData = async (req, res, next) => {
  try {
    const isGet = req.method === 'GET';
    const database = isGet ? req.query.database : req.body.database;
    const collection = isGet ? req.query.collection : req.body.collection;
    const format = ((isGet ? req.query.format : req.body.format) || 'csv').toLowerCase();
    const queryType = (isGet ? req.query.queryType : req.body.queryType) || 'find';

    let filter = {};
    if (isGet) {
      if (req.query.filter) {
        try {
          filter = JSON.parse(req.query.filter);
        } catch {
          filter = {};
        }
      }
    } else {
      filter = req.body.filter || {};
    }

    let options = {};
    if (isGet) {
      const limit = parseInt(req.query.limit, 10) || 5000;
      options = { limit };
    } else {
      options = req.body.options || { limit: 5000 };
    }

    if (!database || !collection) {
      return res.status(400).json({
        success: false,
        message: 'Both database and collection parameters are required.',
      });
    }

    // Execute query in read-only sandbox
    const result = await executeQuery(
      database,
      collection,
      queryType,
      filter,
      options
    );

    const documents = result.results || [];
    const filename = `${collection}_export_${Date.now()}`;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.send(JSON.stringify(documents, null, 2));
    }

    // Default: CSV export
    const csvContent = jsonToCsv(documents);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  queryData,
  exportData,
};
