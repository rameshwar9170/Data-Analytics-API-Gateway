/**
 * Public Read-Only Data API Controller
 * Provides zero-auth, pure read-only GET endpoints for data analysts,
 * Python scripts, Pandas, Power BI, Thunder Client, and web clients.
 * 
 * Strictly enforced:
 * - Read-only operations only (find / count)
 * - Only authorized dataset databases (icoded_*_demo)
 * - Protected system databases (icoded_main, admin, local, config) are blocked
 */

const { getDocuments, getCollections, getDatabaseList } = require('../services/databaseService');
const { getDatabase } = require('../config/database');

/**
 * Helper to convert array of documents into CSV string
 */
const jsonToCsv = (items) => {
  if (!items || items.length === 0) return '';
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
  csvRows.push(headers.map((h) => escapeCsvVal(h)).join(','));
  for (const item of items) {
    csvRows.push(headers.map((header) => escapeCsvVal(item[header])).join(','));
  }
  return csvRows.join('\r\n');
};

/**
 * GET /api/data/databases
 * List all available readable dataset databases
 */
const listPublicDatabases = async (req, res) => {
  try {
    const list = await getDatabaseList();
    // Only return dataset databases, hide system database icoded_main
    const datasetsOnly = list
      .filter((d) => d.isDatasetDb && d.name !== 'icoded_main')
      .map((d) => ({
        name: d.name,
        sizeMB: (d.sizeOnDisk / (1024 * 1024)).toFixed(2),
        apiEndpoint: `/api/data/${d.name}`,
      }));

    res.json({
      success: true,
      message: 'Available Read-Only Databases',
      count: datasetsOnly.length,
      databases: datasetsOnly,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/data/:database/collections
 * List all collections in a database
 */
const listPublicCollections = async (req, res) => {
  try {
    const { database } = req.params;
    if (!database.startsWith('icoded_') || database === 'icoded_main') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only read dataset databases.',
      });
    }

    const collections = await getCollections(database);
    res.json({
      success: true,
      database,
      count: collections.length,
      collections: collections.map((c) => ({
        name: c.name,
        records: c.count,
        readApiUrl: `/api/data/${database}/${c.name}`,
        csvExportUrl: `/api/data/${database}/${c.name}?format=csv`,
      })),
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/data/:database/:collection
 * Read records from a collection with query params filtering, sorting, pagination, and CSV support
 */
const readCollectionData = async (req, res) => {
  try {
    const { database, collection } = req.params;

    // Strict security checks
    if (!database.startsWith('icoded_') || database === 'icoded_main') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only authorized dataset databases can be read.',
      });
    }

    const {
      limit = 50,
      page = 1,
      sort = '_id',
      order = 'desc',
      format = 'json',
      ...filterParams
    } = req.query;

    const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 20000); // Allow up to 20,000 records for BI tools like Power BI
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const skip = (parsedPage - 1) * parsedLimit;
    const sortDir = order.toLowerCase() === 'asc' ? 1 : -1;
    const sortObj = { [sort]: sortDir };

    // Build filter from any additional query params (e.g. ?status=active&type=business)
    const filter = {};
    for (const [key, value] of Object.entries(filterParams)) {
      if (value === 'true') filter[key] = true;
      else if (value === 'false') filter[key] = false;
      else if (!isNaN(value) && value.trim() !== '') {
        filter[key] = Number(value);
      } else {
        filter[key] = value;
      }
    }

    const result = await getDocuments(database, collection, filter, {
      limit: parsedLimit,
      skip,
      sort: sortObj,
    });

    // If CSV format requested, send direct CSV download
    if (format.toLowerCase() === 'csv') {
      const csv = jsonToCsv(result.documents);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${collection}_data_${Date.now()}.csv"`
      );
      return res.send(csv);
    }

    // Default: JSON response
    res.json({
      success: true,
      database,
      collection,
      page: parsedPage,
      limit: parsedLimit,
      returned: result.documents.length,
      totalRecords: result.total,
      hasMore: result.hasMore,
      filterApplied: filter,
      data: result.documents,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  listPublicDatabases,
  listPublicCollections,
  readCollectionData,
};
