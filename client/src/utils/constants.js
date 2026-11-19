export const APP_NAME = 'iCoded Automation';
export const APP_VERSION = '1.0.0';

export const ROLES = {
  ADMIN: 'admin',
  CANDIDATE: 'candidate',
};

export const DATASET_STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const ASSESSMENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EVALUATED: 'evaluated',
};

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
};

export const INDUSTRIES = [
  { id: 'ecommerce', name: 'E-Commerce', icon: 'ShoppingCart', description: 'Online retail, orders, products, customers' },
  { id: 'healthcare', name: 'Healthcare', icon: 'Heart', description: 'Patients, appointments, medical records' },
  { id: 'finance', name: 'Finance', icon: 'DollarSign', description: 'Transactions, accounts, investments' },
  { id: 'education', name: 'Education', icon: 'GraduationCap', description: 'Students, courses, enrollments' },
  { id: 'social_media', name: 'Social Media', icon: 'Users', description: 'Users, posts, interactions' },
  { id: 'logistics', name: 'Logistics', icon: 'Truck', description: 'Shipments, warehouses, routes' },
  { id: 'real_estate', name: 'Real Estate', icon: 'Building', description: 'Properties, listings, agents' },
  { id: 'hospitality', name: 'Hospitality', icon: 'Hotel', description: 'Hotels, bookings, guests' },
];

export const QUERY_TYPES = [
  { id: 'find', name: 'Find', description: 'db.collection.find()' },
  { id: 'aggregate', name: 'Aggregate', description: 'db.collection.aggregate()' },
  { id: 'count', name: 'Count', description: 'db.collection.countDocuments()' },
  { id: 'distinct', name: 'Distinct', description: 'db.collection.distinct()' },
];

export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  generating: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  evaluated: 'bg-purple-100 text-purple-800',
};

export const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  expert: 'bg-red-100 text-red-800',
};
