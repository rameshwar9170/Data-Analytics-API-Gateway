/**
 * iCoded Automation - Complete System Test Suite
 * Tests MongoDB Atlas connectivity, dataset generation, security boundaries,
 * candidate read-only sandboxing, and analytical aggregation execution.
 */

const mongoose = require('mongoose');
const { generateIndustryData } = require('../services/dataGeneratorService');
const { executeQuery } = require('../services/queryExecutionService');
const { getIndustrySchema } = require('../seeds/industrySchemas');
const { INDUSTRIES } = require('../utils/constants');
const config = require('../config/app');

describe('iCoded Automation - System Verification Test Suite', () => {
  beforeAll(async () => {
    // Connect to MongoDB Atlas
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 15000,
    });
  }, 20000);

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════
  // A. DATABASE & ATLAS CONNECTION TESTS
  // ═══════════════════════════════════════════════════════════════════
  describe('A. MongoDB Atlas Cluster Connectivity', () => {
    test('Atlas cluster connection is active and authenticated', () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });

    test('Can query Atlas admin server status', async () => {
      const adminDb = mongoose.connection.client.db().admin();
      const ping = await adminDb.ping();
      expect(ping.ok).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // B. AI DATASET GENERATOR & SYNTHETIC DATA INTEGRITY TESTS
  // ═══════════════════════════════════════════════════════════════════
  describe('B. Synthetic Interconnected Data Generation Engine', () => {
    test('Generates interconnected E-Commerce records with valid references', () => {
      const data = generateIndustryData(INDUSTRIES.ECOMMERCE, {
        counts: {
          categories: 5,
          products: 20,
          customers: 15,
          orders: 30,
          order_items: 60,
          payments: 30,
          returns: 5,
          reviews: 10,
          shipments: 25,
          coupons: 5,
        },
        qualityIssuePercentage: 10,
      });

      // Verify all 10 collections exist
      expect(data.categories.length).toBe(5);
      expect(data.products.length).toBe(20);
      expect(data.customers.length).toBe(15);
      expect(data.orders.length).toBe(30);
      expect(data.order_items.length).toBeGreaterThanOrEqual(30);

      // Verify referential integrity: Every product references a valid category
      const categoryIds = new Set(data.categories.map((c) => c._id.toString()));
      data.products.forEach((p) => {
        expect(categoryIds.has(p.categoryId.toString())).toBe(true);
      });

      // Verify orders reference valid customers
      const customerIds = new Set(data.customers.map((c) => c._id.toString()));
      data.orders.forEach((o) => {
        expect(customerIds.has(o.customerId.toString())).toBe(true);
      });

      // Verify order items reference valid orders and products
      const orderIds = new Set(data.orders.map((o) => o._id.toString()));
      const productIds = new Set(data.products.map((p) => p._id.toString()));
      data.order_items.forEach((item) => {
        expect(orderIds.has(item.orderId.toString())).toBe(true);
        expect(productIds.has(item.productId.toString())).toBe(true);
      });
    });

    test('Generates Hospital Management records with medical references', () => {
      const data = generateIndustryData(INDUSTRIES.HOSPITAL, {
        counts: {
          departments: 4,
          doctors: 8,
          patients: 15,
          appointments: 20,
        },
      });

      expect(data.departments.length).toBe(4);
      expect(data.doctors.length).toBe(8);
      expect(data.patients.length).toBe(15);

      // Verify doctor references department
      const deptIds = new Set(data.departments.map((d) => d._id.toString()));
      data.doctors.forEach((doc) => {
        expect(deptIds.has(doc.departmentId.toString())).toBe(true);
      });
    });

    test('Generates College ERP records with academic integrity', () => {
      const data = generateIndustryData(INDUSTRIES.COLLEGE_ERP, {
        counts: {
          departments: 3,
          courses: 6,
          faculty: 6,
          students: 15,
        },
      });

      expect(data.students.length).toBe(15);
      const deptIds = new Set(data.departments.map((d) => d._id.toString()));
      data.students.forEach((s) => {
        expect(deptIds.has(s.departmentId.toString())).toBe(true);
      });
    });

    test('Generates Banking records with transaction integrity', () => {
      const data = generateIndustryData(INDUSTRIES.BANKING, {
        counts: {
          branches: 3,
          customers: 10,
          accounts: 15,
          transactions: 30,
        },
      });

      expect(data.accounts.length).toBe(15);
      expect(data.transactions.length).toBe(30);

      const accountIds = new Set(data.accounts.map((a) => a._id.toString()));
      data.transactions.forEach((tx) => {
        expect(accountIds.has(tx.accountId.toString())).toBe(true);
      });
    });

    test('Generates CRM records with lead & employee assignment', () => {
      const data = generateIndustryData(INDUSTRIES.CRM, {
        counts: {
          sources: 5,
          employees: 5,
          companies: 10,
          leads: 20,
        },
      });

      expect(data.leads.length).toBe(20);
      const empIds = new Set(data.employees.map((e) => e._id.toString()));
      data.leads.forEach((l) => {
        if (l.assignedTo) {
          expect(empIds.has(l.assignedTo.toString())).toBe(true);
        }
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // C. CANDIDATE ACCESS & QUERY SANDBOX SECURITY TESTS
  // ═══════════════════════════════════════════════════════════════════
  describe('C. Candidate Sandboxing & Read-Only Enforcement', () => {
    test('Blocks candidate access to system databases (admin, local, config)', async () => {
      await expect(
        executeQuery('admin', 'system.users', 'find', {})
      ).rejects.toThrow('Access to system databases is forbidden');
    });

    test('Blocks malicious $where JavaScript injection operators', async () => {
      await expect(
        executeQuery('icoded_test_demo', 'customers', 'find', {
          $where: 'sleep(5000)',
        })
      ).rejects.toThrow('Query contains forbidden operators');
    });

    test('Blocks destructive write stages in aggregation ($out, $merge)', async () => {
      await expect(
        executeQuery('icoded_test_demo', 'customers', 'aggregate', [
          { $match: {} },
          { $out: 'overwritten_collection' },
        ])
      ).rejects.toThrow('Aggregation stage $out is not allowed in read-only mode');

      await expect(
        executeQuery('icoded_test_demo', 'customers', 'aggregate', [
          { $match: {} },
          { $merge: { into: 'target_col' } },
        ])
      ).rejects.toThrow('Aggregation stage $merge is not allowed in read-only mode');
    });

    test('Enforces query result limits to prevent memory exhaustion', async () => {
      // Create small test collection
      const db = mongoose.connection.client.db('icoded_test_demo');
      await db.collection('test_items').deleteMany({});
      const testItems = Array.from({ length: 50 }, (_, i) => ({ item: i, name: `Item ${i}` }));
      await db.collection('test_items').insertMany(testItems);

      const result = await executeQuery('icoded_test_demo', 'test_items', 'find', {}, { limit: 5 });
      expect(result.results.length).toBe(5);
      expect(result.status).toBe('success');

      // Cleanup
      await db.collection('test_items').drop().catch(() => {});
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // D. AGGREGATION & DATA ANALYSIS QUERY TESTS
  // ═══════════════════════════════════════════════════════════════════
  describe('D. Analytical Aggregation Pipelines', () => {
    const testDb = 'icoded_test_demo';

    beforeAll(async () => {
      const db = mongoose.connection.client.db(testDb);
      await db.collection('orders').deleteMany({});
      await db.collection('orders').insertMany([
        { status: 'delivered', total: 500, category: 'Electronics', date: new Date('2024-01-15') },
        { status: 'delivered', total: 1500, category: 'Electronics', date: new Date('2024-01-18') },
        { status: 'cancelled', total: 300, category: 'Clothing', date: new Date('2024-02-10') },
        { status: 'delivered', total: 800, category: 'Clothing', date: new Date('2024-02-12') },
      ]);
    });

    afterAll(async () => {
      await mongoose.connection.client.db(testDb).dropDatabase().catch(() => {});
    });

    test('Executes $group and $sum pipeline correctly', async () => {
      const pipeline = [
        { $match: { status: 'delivered' } },
        { $group: { _id: '$category', totalSales: { $sum: '$total' }, count: { $sum: 1 } } },
        { $sort: { totalSales: -1 } },
      ];

      const res = await executeQuery(testDb, 'orders', 'aggregate', pipeline);
      expect(res.status).toBe('success');
      expect(res.results.length).toBe(2);

      const electronics = res.results.find((r) => r._id === 'Electronics');
      expect(electronics.totalSales).toBe(2000);
      expect(electronics.count).toBe(2);
    });

    test('Executes countDocuments operation accurately', async () => {
      const res = await executeQuery(testDb, 'orders', 'countDocuments', { status: 'delivered' });
      expect(res.results[0].count).toBe(3);
    });

    test('Executes distinct operation properly', async () => {
      const res = await executeQuery(testDb, 'orders', 'distinct', {}, { field: 'category' });
      expect(res.results.sort()).toEqual(['Clothing', 'Electronics'].sort());
    });
  });
});
