/**
 * AI Service
 * Handles AI-powered dataset schema generation, realistic business scenario planning,
 * assignment generation, and question validation.
 * Uses OpenAI GPT-4 when key is configured, with robust built-in industry expert templates.
 */

const OpenAI = require('openai');
const config = require('../config/app');
const { getIndustrySchema } = require('../seeds/industrySchemas');
const logger = require('../utils/logger');

let openai = null;
if (config.openaiApiKey) {
  openai = new OpenAI({ apiKey: config.openaiApiKey });
}

/**
 * Generate dataset schema using AI (or fallback to comprehensive industry template)
 */
const generateDatasetSchema = async (industry, datasetConfig = {}) => {
  // If OpenAI is configured, ask GPT-4 for custom enhancement
  if (openai) {
    try {
      const prompt = `You are a Senior MongoDB Database Architect. Design a realistic database schema for the ${industry} industry.
Dataset Name: ${datasetConfig.name || industry}
Difficulty: ${datasetConfig.difficulty || 'Intermediate'}
Number of collections: ${datasetConfig.collectionsCount || 8}
Data complexity: ${datasetConfig.dataComplexity || 'medium'}
Quality issues: ${datasetConfig.qualityIssuePercentage || 5}%

Provide a JSON output matching this structure:
{
  "collections": [
    {
      "name": "string",
      "description": "string",
      "fields": [{"name": "string", "type": "string", "description": "string", "required": true}],
      "indexes": [{"fields": {"field": 1}, "unique": false}]
    }
  ],
  "relationships": [
    {"from": "orders.customerId", "to": "customers._id", "type": "many-to-one"}
  ],
  "dataQualityScenarios": ["string"]
}`;

      const response = await openai.chat.completions.create({
        model: config.openaiModel || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      logger.info(`AI generated schema successfully for ${industry}`);
      return parsed;
    } catch (err) {
      logger.warn(`OpenAI schema generation failed, falling back to industry standard schema: ${err.message}`);
    }
  }

  // Fallback to high-quality comprehensive industry template from industrySchemas
  const standard = getIndustrySchema(industry);
  if (!standard) {
    throw new Error(`Industry schema not found for: ${industry}`);
  }

  return {
    collections: standard.collections,
    relationships: standard.relationships,
    dataQualityScenarios: [
      'Missing values in optional contact and address fields',
      'Duplicate submissions caused by client network retries',
      'Outlier amounts in transactions and order totals',
      'Cancelled and returned status inconsistencies',
      'Legacy date format variations in historic entries',
    ],
  };
};

/**
 * Generate data analyst assignment questions based on the dataset schema and metadata
 */
const generateAssignmentQuestions = async (dataset, assignmentConfig = {}) => {
  const count = assignmentConfig.questionCount || 20;
  const difficulty = assignmentConfig.difficulty || 'Intermediate';

  if (openai) {
    try {
      const prompt = `You are a Lead Data Analyst and Technical Interviewer at iCoded Automation.
Generate ${count} comprehensive MongoDB assessment tasks for dataset: "${dataset.name}" (Industry: ${dataset.industry}).
Difficulty: ${difficulty}.

The questions must cover:
1. Basic MongoDB find & filtering
2. Sorting, pagination, projection
3. Aggregation pipelines ($match, $group, $sort)
4. Multi-collection $lookup and $unwind
5. Date-based trend analysis
6. Business KPIs (Revenue, Churn, LTV, Retention)
7. Advanced analytical challenges

Output JSON with array of questions:
{
  "questions": [
    {
      "title": "string",
      "scenario": "Business context",
      "task": "Exact analytical query requirement",
      "collections": ["collection_name"],
      "expectedOutput": "Description of expected fields in output",
      "difficulty": "Easy|Medium|Hard",
      "marks": 5,
      "timeEstimate": "10 mins",
      "evaluationCriteria": "What defines a correct query",
      "hiddenExpectedResult": {"type": "aggregate", "sampleFields": ["..."]},
      "validationLogic": "Explanation of how query is tested"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: config.openaiModel || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      if (parsed.questions && parsed.questions.length > 0) {
        return parsed.questions;
      }
    } catch (err) {
      logger.warn(`OpenAI assignment generation failed, using standard templates: ${err.message}`);
    }
  }

  // Fallback to expertly crafted analytical questions tailored to industry
  return generateStandardQuestions(dataset.industry, count);
};

/**
 * Standard industry question bank
 */
const generateStandardQuestions = (industry, count = 20) => {
  const bank = {
    'E-Commerce': [
      {
        title: 'Customer Lifetime Value (LTV) Distribution',
        scenario: 'The marketing team wants to segment high-value customers who have spent more than 50,000 INR.',
        task: 'Find all customers with totalSpent greater than 50,000, sorted descending by totalSpent. Project name, email, and totalSpent.',
        collections: ['customers'],
        expectedOutput: 'Documents with name, email, totalSpent',
        difficulty: 'Easy',
        marks: 5,
        timeEstimate: '5 mins',
        evaluationCriteria: 'Filter { totalSpent: { $gt: 50000 } } and sort descending.',
        validationLogic: 'Match records where totalSpent > 50000 and sorted properly',
      },
      {
        title: 'Monthly Revenue by Order Status',
        scenario: 'Finance needs an audit of gross sales across completed vs cancelled orders.',
        task: 'Aggregate orders grouped by status, calculating total revenue and total count per status.',
        collections: ['orders'],
        expectedOutput: '_id (status), totalRevenue ($sum: "$total"), orderCount ($sum: 1)',
        difficulty: 'Medium',
        marks: 10,
        timeEstimate: '10 mins',
        evaluationCriteria: 'Pipeline using $group on status with $sum operators.',
        validationLogic: 'Check grouping accuracy on order total',
      },
      {
        title: 'Top 5 Best-Selling Products with Details',
        scenario: 'Supply chain needs to restock top velocity items.',
        task: 'Aggregate order_items by productId, compute total quantity sold, lookup product details from products collection, and return top 5.',
        collections: ['order_items', 'products'],
        expectedOutput: 'Product document with totalQuantitySold, sorted descending, limit 5.',
        difficulty: 'Hard',
        marks: 15,
        timeEstimate: '15 mins',
        evaluationCriteria: 'Pipeline using $group by productId, $sort, $limit 5, and $lookup with products.',
        validationLogic: 'Correct join with products and accurate quantity sums',
      },
      {
        title: 'Return Rate Analysis by Category',
        scenario: 'Identify product categories with abnormal customer return rates.',
        task: 'Join orders with returns, lookup products and categories, and calculate return percentage by category.',
        collections: ['orders', 'returns', 'products', 'categories'],
        expectedOutput: 'Category name and count of returns.',
        difficulty: 'Hard',
        marks: 20,
        timeEstimate: '20 mins',
        evaluationCriteria: 'Multi-stage aggregation with $lookup and grouping.',
        validationLogic: 'Verify accurate matching across 3 collections',
      },
      {
        title: 'Customer Review Sentiment Correlation',
        scenario: 'Product managers want to find products with average rating below 3.0 and at least 5 reviews.',
        task: 'Aggregate reviews by productId, calculate average rating and review count, filter where avgRating < 3 and reviewCount >= 5.',
        collections: ['reviews'],
        expectedOutput: 'productId, avgRating, count',
        difficulty: 'Medium',
        marks: 10,
        timeEstimate: '10 mins',
        evaluationCriteria: '$group with $avg, $match with $lt and $gte.',
        validationLogic: 'Accurate filter on grouped results',
      },
    ],
    'College / University ERP': [
      {
        title: 'Department-wise Average CGPA',
        scenario: 'Academic council requires student performance benchmarking across departments.',
        task: 'Aggregate students grouped by departmentId, calculate average cgpa, and sort descending.',
        collections: ['students', 'departments'],
        expectedOutput: 'departmentId, avgCGPA, studentCount',
        difficulty: 'Medium',
        marks: 10,
        timeEstimate: '10 mins',
        evaluationCriteria: '$group by departmentId with $avg on cgpa.',
        validationLogic: 'Correct average calculation',
      },
      {
        title: 'Low Attendance Alert List',
        scenario: 'Attendance office needs to flag students with attendance below 75%.',
        task: 'Aggregate attendance records by studentId, calculate percentage of "present" status, and filter below 75%.',
        collections: ['attendance', 'students'],
        expectedOutput: 'studentId, attendancePercentage',
        difficulty: 'Hard',
        marks: 15,
        timeEstimate: '15 mins',
        evaluationCriteria: 'Conditional sum or filter in group stage.',
        validationLogic: 'Accurate attendance ratio calculation',
      },
      {
        title: 'Fee Defaulters Analysis',
        scenario: 'Accounts department wants to identify pending fee payments by semester.',
        task: 'Find all fee_payments where status is "pending" or "overdue", group by semester, sum total outstanding amount.',
        collections: ['fee_payments'],
        expectedOutput: 'semester, totalOutstanding, count',
        difficulty: 'Medium',
        marks: 10,
        timeEstimate: '10 mins',
        evaluationCriteria: '$match on status and $group by semester.',
        validationLogic: 'Match status correctly and calculate outstanding sum',
      },
    ],
    'Hospital Management': [
      {
        title: 'Doctor Workload & Appointment Distribution',
        scenario: 'Hospital director wants to analyze doctor utilization rate for current month.',
        task: 'Aggregate appointments by doctorId, count completed vs cancelled appointments, lookup doctor details.',
        collections: ['appointments', 'doctors'],
        expectedOutput: 'Doctor name, specialization, completedCount, cancelledCount',
        difficulty: 'Medium',
        marks: 10,
        timeEstimate: '10 mins',
        evaluationCriteria: '$group with conditional counts and $lookup.',
        validationLogic: 'Correct join with doctors collection',
      },
      {
        title: 'High-Value Patient Billings',
        scenario: 'Finance audit of hospital bills exceeding 100,000 INR with pending payment.',
        task: 'Find bills where total > 100000 and status == "pending", lookup patient information, sort by total descending.',
        collections: ['bills', 'patients'],
        expectedOutput: 'Bill details with patient name and contact',
        difficulty: 'Easy',
        marks: 5,
        timeEstimate: '5 mins',
        evaluationCriteria: 'Filter and lookup.',
        validationLogic: 'Verify filter conditions',
      },
    ],
    'Banking and Finance': [
      {
        title: 'High Risk Account Suspicious Activity',
        scenario: 'Risk & Fraud Prevention team needs to detect accounts with rapid large withdrawals.',
        task: 'Aggregate transactions where type is "debit" and amount > 50000, group by accountId, count frequency and total debited.',
        collections: ['transactions'],
        expectedOutput: 'accountId, totalAmount, transactionCount',
        difficulty: 'Medium',
        marks: 10,
        timeEstimate: '10 mins',
        evaluationCriteria: '$match on type and amount, $group by accountId.',
        validationLogic: 'Accurate aggregation of debit transactions',
      },
      {
        title: 'Non-Performing Assets (NPA) / Loan Delinquency',
        scenario: 'Credit committee requires a list of defaulted and overdue loan portfolios.',
        task: 'Find loans where status is "defaulted", join with repayments to find total paid vs principal remaining.',
        collections: ['loans', 'repayments'],
        expectedOutput: 'Loan details with total repaid and outstanding balance',
        difficulty: 'Hard',
        marks: 20,
        timeEstimate: '20 mins',
        evaluationCriteria: '$lookup with repayments and $project balance.',
        validationLogic: 'Correct outstanding amount calculation',
      },
    ],
    'CRM and Sales': [
      {
        title: 'Lead Conversion Velocity by Source',
        scenario: 'CMO wants to measure ROI across lead acquisition channels.',
        task: 'Group leads by sourceId, calculate total leads and count where status is "won", compute conversion rate.',
        collections: ['leads', 'sources'],
        expectedOutput: 'Source name, totalLeads, wonLeads, conversionRate',
        difficulty: 'Hard',
        marks: 15,
        timeEstimate: '15 mins',
        evaluationCriteria: '$group, $lookup on sources, $project conversion percentage.',
        validationLogic: 'Correct ratio calculation and source join',
      },
      {
        title: 'Sales Rep Quota Attainment',
        scenario: 'VP of Sales wants monthly performance ranking of sales reps.',
        task: 'Aggregate sales by employeeId, sum amount, join with employees and targets to compute attainment %.',
        collections: ['sales', 'employees', 'targets'],
        expectedOutput: 'Employee name, totalAchieved, targetAmount, percentAttained',
        difficulty: 'Hard',
        marks: 20,
        timeEstimate: '20 mins',
        evaluationCriteria: 'Multi-stage aggregation with targets lookup.',
        validationLogic: 'Accurate percentage attainment calculation',
      },
    ],
  };

  const selected = bank[industry] || bank['E-Commerce'];
  // Duplicate or slice to match count
  const results = [];
  while (results.length < count) {
    for (const q of selected) {
      if (results.length < count) {
        results.push({
          ...q,
          title: results.length >= selected.length ? `${q.title} (Variant ${Math.floor(results.length / selected.length) + 1})` : q.title,
        });
      }
    }
  }
  return results;
};

/**
 * Validate that an AI-generated question is syntactically sound
 */
const validateGeneratedQuestion = async (question) => {
  if (!question.title || !question.task || !question.collections || question.collections.length === 0) {
    return { valid: false, reason: 'Missing required title, task, or collection references' };
  }
  return { valid: true };
};

module.exports = {
  generateDatasetSchema,
  generateAssignmentQuestions,
  validateGeneratedQuestion,
};
