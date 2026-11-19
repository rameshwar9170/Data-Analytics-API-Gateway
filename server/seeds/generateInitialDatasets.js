/**
 * Seed Initial Datasets Generator
 * Generates all 5 required industry datasets on MongoDB Atlas:
 * 1. E-Commerce (icoded_ecommerce_demo)
 * 2. College ERP (icoded_college_erp_demo)
 * 3. Hospital Management (icoded_hospital_demo)
 * 4. CRM & Sales (icoded_crm_demo)
 * 5. Banking & Finance (icoded_banking_demo)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Dataset = require('../models/Dataset');
const User = require('../models/User');
const { generateIndustryData } = require('../services/dataGeneratorService');
const {
  createDatabase,
  createCollection,
  createIndexes,
  bulkInsert,
} = require('../services/databaseService');
const { getIndustrySchema } = require('./industrySchemas');
const { INDUSTRIES } = require('../utils/constants');
const logger = require('../utils/logger');

// Scaled target counts to ensure all 5 databases fit comfortably within Atlas M0 free tier quotas
const INITIAL_CONFIGS = [
  {
    name: 'iCoded E-Commerce Enterprise Demo',
    industry: INDUSTRIES.ECOMMERCE,
    databaseName: 'icoded_ecommerce_demo',
    difficulty: 'Intermediate',
    description: 'Realistic e-commerce dataset with customers, products, categories, orders, payments, shipments, and returns.',
    qualityIssuePercentage: 5,
    counts: {
      categories: 100,
      products: 2000,
      customers: 5000,
      orders: 10000,
      order_items: 20000,
      payments: 10000,
      returns: 1000,
      reviews: 3000,
      shipments: 8000,
      coupons: 500,
    },
  },
  {
    name: 'iCoded College & University ERP Demo',
    industry: INDUSTRIES.COLLEGE_ERP,
    databaseName: 'icoded_college_erp_demo',
    difficulty: 'Intermediate',
    description: 'Comprehensive college ERP database with departments, faculty, students, admissions, attendance, and exam results.',
    qualityIssuePercentage: 4,
    counts: {
      departments: 30,
      courses: 500,
      faculty: 500,
      students: 5000,
      admissions: 5000,
      attendance: 15000,
      examinations: 2000,
      results: 10000,
      fee_payments: 5000,
      scholarships: 1000,
    },
  },
  {
    name: 'iCoded Hospital & Healthcare Demo',
    industry: INDUSTRIES.HOSPITAL,
    databaseName: 'icoded_hospital_demo',
    difficulty: 'Advanced',
    description: 'Integrated hospital management database with patients, doctors, appointments, prescriptions, bills, and lab reports.',
    qualityIssuePercentage: 5,
    counts: {
      departments: 30,
      doctors: 500,
      medicines: 2000,
      patients: 5000,
      appointments: 8000,
      prescriptions: 6000,
      bills: 6000,
      payments: 6000,
      lab_reports: 3000,
      admissions: 1500,
    },
  },
  {
    name: 'iCoded CRM & Sales Pipeline Demo',
    industry: INDUSTRIES.CRM,
    databaseName: 'icoded_crm_demo',
    difficulty: 'Intermediate',
    description: 'B2B CRM database with leads, companies, sales reps, activities, opportunities, and campaigns.',
    qualityIssuePercentage: 5,
    counts: {
      sources: 50,
      employees: 500,
      companies: 2000,
      campaigns: 500,
      leads: 5000,
      activities: 10000,
      followups: 6000,
      opportunities: 4000,
      sales: 4000,
      targets: 1000,
    },
  },
  {
    name: 'iCoded Banking & Financial Services Demo',
    industry: INDUSTRIES.BANKING,
    databaseName: 'icoded_banking_demo',
    difficulty: 'Advanced',
    description: 'Retail & corporate banking database with accounts, transactions, loans, repayments, and credit assessments.',
    qualityIssuePercentage: 6,
    counts: {
      branches: 100,
      employees: 500,
      customers: 5000,
      accounts: 7500,
      transactions: 20000,
      loans: 2000,
      repayments: 8000,
      cards: 5000,
      complaints: 1000,
      credit_assessments: 2000,
    },
  },
];

const seedAllDatasets = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to Atlas cluster for initial dataset seeding');

    const adminUser = await User.findOne({ role: 'admin' });

    for (const datasetConfig of INITIAL_CONFIGS) {
      logger.info(`\n-----------------------------------------------------`);
      logger.info(`Starting generation for: ${datasetConfig.name} (${datasetConfig.databaseName})`);

      // Generate in-memory records
      const generatedData = generateIndustryData(datasetConfig.industry, {
        counts: datasetConfig.counts,
        qualityIssuePercentage: datasetConfig.qualityIssuePercentage,
      });

      const schemaDef = getIndustrySchema(datasetConfig.industry);
      const dbName = datasetConfig.databaseName;
      await createDatabase(dbName);

      const collectionStats = [];
      let totalRecords = 0;

      for (const [colName, records] of Object.entries(generatedData)) {
        logger.info(`Populating ${dbName}.${colName} with ${records.length} records...`);

        await createCollection(dbName, colName);

        // Index creation
        let indexes = [];
        if (schemaDef.collections) {
          if (Array.isArray(schemaDef.collections)) {
            const found = schemaDef.collections.find((c) => c.name === colName);
            indexes = found?.indexes || [];
          } else if (schemaDef.collections[colName]) {
            indexes = schemaDef.collections[colName].indexes || [];
          }
        }
        if (indexes.length > 0) {
          await createIndexes(dbName, colName, indexes);
        }

        // Bulk insert
        const res = await bulkInsert(dbName, colName, records, 1000);
        totalRecords += res.insertedCount;

        collectionStats.push({
          name: colName,
          targetCount: records.length,
          recordCount: res.insertedCount,
          status: 'completed',
        });
      }

      // Upsert Dataset record in icoded_main
      await Dataset.findOneAndUpdate(
        { databaseName: dbName },
        {
          name: datasetConfig.name,
          industry: datasetConfig.industry,
          description: datasetConfig.description,
          difficulty: datasetConfig.difficulty,
          databaseName: dbName,
          collections: collectionStats,
          totalRecords,
          targetTotalRecords: totalRecords,
          generationStatus: 'completed',
          generationProgress: 100,
          schema: schemaDef,
          relationships: schemaDef.relationships || [],
          qualityIssuePercentage: datasetConfig.qualityIssuePercentage,
          qualitySummary: {
            missingValuesPercentage: datasetConfig.qualityIssuePercentage,
            duplicateRecordsCount: Math.round(totalRecords * 0.01),
            outliersCount: Math.round(totalRecords * 0.02),
            inconsistentRecordsCount: Math.round(totalRecords * 0.01),
          },
          createdBy: adminUser?._id,
        },
        { upsert: true, new: true }
      );

      logger.info(`COMPLETED: ${datasetConfig.name} -> Saved ${totalRecords} records across ${collectionStats.length} collections into Atlas!`);
    }

    logger.info(`\nALL 5 DATASETS SUCCESSFULLY GENERATED & SAVED IN ATLAS!`);
    process.exit(0);
  } catch (error) {
    logger.error(`Initial datasets seed failed: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  seedAllDatasets();
}

module.exports = { seedAllDatasets, INITIAL_CONFIGS };
