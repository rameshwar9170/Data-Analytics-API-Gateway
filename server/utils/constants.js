/**
 * Application Constants
 * Centralized enums, lists, and static values used across the application
 */

const INDUSTRIES = {
  ECOMMERCE: 'ecommerce',
  COLLEGE_ERP: 'college_erp',
  HOSPITAL: 'hospital',
  CRM: 'crm',
  BANKING: 'banking',
};

const INDUSTRY_LIST = Object.values(INDUSTRIES);

const INDUSTRY_LABELS = {
  [INDUSTRIES.ECOMMERCE]: 'E-Commerce',
  [INDUSTRIES.COLLEGE_ERP]: 'College ERP',
  [INDUSTRIES.HOSPITAL]: 'Hospital Management',
  [INDUSTRIES.CRM]: 'Customer Relationship Management',
  [INDUSTRIES.BANKING]: 'Banking & Finance',
};

const INDUSTRY_DB_PREFIXES = {
  [INDUSTRIES.ECOMMERCE]: 'icoded_ecommerce',
  [INDUSTRIES.COLLEGE_ERP]: 'icoded_college_erp',
  [INDUSTRIES.HOSPITAL]: 'icoded_hospital',
  [INDUSTRIES.CRM]: 'icoded_crm',
  [INDUSTRIES.BANKING]: 'icoded_banking',
};

const normalizeIndustry = (input) => {
  if (!input) return INDUSTRIES.ECOMMERCE;
  const str = String(input).toLowerCase().trim();
  if (str.includes('e-comm') || str.includes('ecomm') || str.includes('retail') || str.includes('logistics') || str.includes('food') || str.includes('inventory') || str.includes('warehouse')) {
    return INDUSTRIES.ECOMMERCE;
  }
  if (str.includes('college') || str.includes('university') || str.includes('erp') || str.includes('school') || str.includes('education') || str.includes('academic')) {
    return INDUSTRIES.COLLEGE_ERP;
  }
  if (str.includes('hospital') || str.includes('health') || str.includes('clinic') || str.includes('medical') || str.includes('patient')) {
    return INDUSTRIES.HOSPITAL;
  }
  if (str.includes('crm') || str.includes('sales') || str.includes('lead') || str.includes('hrms') || str.includes('employee') || str.includes('human')) {
    return INDUSTRIES.CRM;
  }
  if (str.includes('bank') || str.includes('finance') || str.includes('loan') || str.includes('fintech') || str.includes('credit')) {
    return INDUSTRIES.BANKING;
  }
  return INDUSTRIES.ECOMMERCE;
};

const DIFFICULTIES = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
};

const DIFFICULTY_LIST = Object.values(DIFFICULTIES);

const USER_ROLES = {
  ADMIN: 'admin',
  CANDIDATE: 'candidate',
};

const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const DATASET_STATUSES = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const ASSIGNMENT_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

const ASSESSMENT_STATUSES = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  EVALUATED: 'evaluated',
};

const ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  QUERY: 'query',
  ERROR: 'error',
  SUBMISSION: 'submission',
  NAVIGATION: 'navigation',
};

const QUERY_TYPES = {
  FIND: 'find',
  AGGREGATE: 'aggregate',
  COUNT: 'count',
  COUNT_DOCUMENTS: 'countDocuments',
  DISTINCT: 'distinct',
};

const ALLOWED_QUERY_TYPES = Object.values(QUERY_TYPES);

const BLOCKED_OPERATIONS = [
  'insert', 'insertOne', 'insertMany',
  'update', 'updateOne', 'updateMany',
  'delete', 'deleteOne', 'deleteMany',
  'remove', 'drop', 'rename',
  'createCollection', 'createIndex', 'dropIndex',
  'findOneAndUpdate', 'findOneAndDelete', 'findOneAndReplace',
  'replaceOne', 'bulkWrite',
  '$where', 'mapReduce', 'eval',
  'admin', 'shutdown', 'fsync',
];

const PAYMENT_METHODS = [
  'credit_card', 'debit_card', 'upi', 'net_banking', 'cod', 'wallet',
];

const ORDER_STATUSES = [
  'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned',
];

const PAYMENT_STATUSES = [
  'success', 'failed', 'pending', 'refunded',
];

const GENDERS = ['male', 'female', 'other'];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const INDIAN_STATES = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Uttar Pradesh',
  'Gujarat', 'Rajasthan', 'West Bengal', 'Telangana', 'Andhra Pradesh',
  'Kerala', 'Madhya Pradesh', 'Bihar', 'Punjab', 'Haryana',
];

const INDIAN_CITIES = [
  'Mumbai', 'Bangalore', 'Chennai', 'Delhi', 'Hyderabad',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Chandigarh', 'Kochi', 'Indore', 'Bhopal', 'Nagpur',
];

module.exports = {
  INDUSTRIES,
  INDUSTRY_LIST,
  INDUSTRY_LABELS,
  INDUSTRY_DB_PREFIXES,
  normalizeIndustry,
  DIFFICULTIES,
  DIFFICULTY_LIST,
  USER_ROLES,
  USER_STATUSES,
  DATASET_STATUSES,
  ASSIGNMENT_STATUSES,
  ASSESSMENT_STATUSES,
  ACTIVITY_TYPES,
  QUERY_TYPES,
  ALLOWED_QUERY_TYPES,
  BLOCKED_OPERATIONS,
  PAYMENT_METHODS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  GENDERS,
  BLOOD_GROUPS,
  INDIAN_STATES,
  INDIAN_CITIES,
};
