/**
 * Industry Schemas
 * Complete schema definitions for all 5 industries with collection definitions,
 * field types, relationships, indexes, and realistic value ranges.
 */

const { INDUSTRIES, normalizeIndustry } = require('../utils/constants');

// ═══════════════════════════════════════════════════════════════════
// E-COMMERCE SCHEMA
// ═══════════════════════════════════════════════════════════════════
const ecommerceSchema = {
  industry: INDUSTRIES.ECOMMERCE,
  label: 'E-Commerce',
  dbPrefix: 'icoded_ecommerce',
  collections: {
    categories: {
      fields: {
        name: { type: 'String', required: true },
        slug: { type: 'String', required: true },
        parentCategory: { type: 'ObjectId', ref: 'categories', default: null },
        description: { type: 'String' },
        imageUrl: { type: 'String' },
        isActive: { type: 'Boolean', default: true },
        sortOrder: { type: 'Number', min: 0, max: 100 },
        createdAt: { type: 'Date' },
      },
      indexes: [{ slug: 1 }, { parentCategory: 1 }, { isActive: 1 }],
      defaultCount: 25,
      enums: {
        names: [
          'Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports & Fitness',
          'Beauty & Personal Care', 'Toys & Games', 'Automotive', 'Grocery',
          'Health & Wellness', 'Jewelry', 'Footwear', 'Bags & Luggage',
          'Stationery', 'Musical Instruments', 'Pet Supplies', 'Garden & Outdoor',
          'Baby Products', 'Office Supplies', 'Mobile Accessories',
          'Computer Peripherals', 'Cameras', 'Gaming', 'Watches', 'Sunglasses',
        ],
      },
    },
    products: {
      fields: {
        name: { type: 'String', required: true },
        slug: { type: 'String', required: true },
        description: { type: 'String' },
        sku: { type: 'String', required: true, unique: true },
        price: { type: 'Number', min: 49, max: 199999 },
        comparePrice: { type: 'Number', min: 0 },
        costPrice: { type: 'Number', min: 0 },
        categoryId: { type: 'ObjectId', ref: 'categories', required: true },
        brand: { type: 'String' },
        images: { type: 'Array' },
        stock: { type: 'Number', min: 0, max: 10000 },
        weight: { type: 'Number', min: 0.01, max: 50 },
        dimensions: { type: 'Object', fields: { length: 'Number', width: 'Number', height: 'Number' } },
        isActive: { type: 'Boolean', default: true },
        tags: { type: 'Array' },
        rating: { type: 'Number', min: 1, max: 5 },
        reviewCount: { type: 'Number', min: 0 },
        createdAt: { type: 'Date' },
      },
      indexes: [{ categoryId: 1 }, { brand: 1 }, { price: 1 }, { rating: -1 }, { sku: 1 }],
      defaultCount: 500,
      enums: {
        brands: [
          'Samsung', 'Apple', 'Sony', 'LG', 'Nike', 'Adidas', 'Puma', 'Boat',
          'Prestige', 'Bajaj', 'Titan', 'Fastrack', 'Wildcraft', 'HP', 'Dell',
          'Lenovo', 'Asus', 'OnePlus', 'Xiaomi', 'Realme', 'Noise', 'Fire-Boltt',
          'JBL', 'Philips', 'Havells', 'Crompton', 'Raymond', 'Peter England',
          'Allen Solly', 'Van Heusen',
        ],
        tags: ['new-arrival', 'bestseller', 'sale', 'trending', 'premium', 'budget', 'eco-friendly'],
      },
    },
    customers: {
      fields: {
        firstName: { type: 'String', required: true },
        lastName: { type: 'String', required: true },
        email: { type: 'String', required: true, unique: true },
        phone: { type: 'String' },
        gender: { type: 'String', enum: ['male', 'female', 'other'] },
        dateOfBirth: { type: 'Date' },
        addresses: { type: 'Array' },
        isActive: { type: 'Boolean', default: true },
        loyaltyPoints: { type: 'Number', min: 0, max: 50000 },
        totalOrders: { type: 'Number', min: 0 },
        totalSpent: { type: 'Number', min: 0 },
        registeredAt: { type: 'Date' },
      },
      indexes: [{ email: 1 }, { registeredAt: -1 }, { isActive: 1 }],
      defaultCount: 2000,
    },
    orders: {
      fields: {
        customerId: { type: 'ObjectId', ref: 'customers', required: true },
        orderNumber: { type: 'String', required: true, unique: true },
        itemCount: { type: 'Number', min: 1 },
        subtotal: { type: 'Number', min: 0 },
        tax: { type: 'Number', min: 0 },
        shipping: { type: 'Number', min: 0 },
        discount: { type: 'Number', min: 0 },
        total: { type: 'Number', min: 0 },
        status: { type: 'String', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] },
        paymentStatus: { type: 'String', enum: ['pending', 'paid', 'failed', 'refunded'] },
        shippingAddress: { type: 'Object' },
        billingAddress: { type: 'Object' },
        orderDate: { type: 'Date' },
        deliveredAt: { type: 'Date' },
      },
      indexes: [{ customerId: 1 }, { status: 1 }, { orderDate: -1 }, { orderNumber: 1 }],
      defaultCount: 5000,
    },
    order_items: {
      fields: {
        orderId: { type: 'ObjectId', ref: 'orders', required: true },
        productId: { type: 'ObjectId', ref: 'products', required: true },
        quantity: { type: 'Number', min: 1, max: 10 },
        unitPrice: { type: 'Number', min: 0 },
        discount: { type: 'Number', min: 0 },
        total: { type: 'Number', min: 0 },
      },
      indexes: [{ orderId: 1 }, { productId: 1 }],
      defaultCount: 12000,
    },
    payments: {
      fields: {
        orderId: { type: 'ObjectId', ref: 'orders', required: true },
        method: { type: 'String', enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'cod', 'wallet'] },
        amount: { type: 'Number', min: 0 },
        status: { type: 'String', enum: ['success', 'failed', 'pending', 'refunded'] },
        transactionId: { type: 'String' },
        paidAt: { type: 'Date' },
      },
      indexes: [{ orderId: 1 }, { status: 1 }, { method: 1 }],
      defaultCount: 5000,
    },
    returns: {
      fields: {
        orderId: { type: 'ObjectId', ref: 'orders', required: true },
        reason: { type: 'String' },
        status: { type: 'String', enum: ['requested', 'approved', 'rejected', 'completed'] },
        refundAmount: { type: 'Number', min: 0 },
        returnDate: { type: 'Date' },
        processedAt: { type: 'Date' },
      },
      indexes: [{ orderId: 1 }, { status: 1 }],
      defaultCount: 300,
      enums: {
        reasons: [
          'Defective product', 'Wrong item delivered', 'Size mismatch',
          'Quality not as expected', 'Changed mind', 'Better price available',
          'Late delivery', 'Damaged in transit',
        ],
      },
    },
    reviews: {
      fields: {
        productId: { type: 'ObjectId', ref: 'products', required: true },
        customerId: { type: 'ObjectId', ref: 'customers', required: true },
        rating: { type: 'Number', min: 1, max: 5 },
        title: { type: 'String' },
        comment: { type: 'String' },
        isVerified: { type: 'Boolean', default: false },
        helpfulCount: { type: 'Number', min: 0 },
        createdAt: { type: 'Date' },
      },
      indexes: [{ productId: 1 }, { customerId: 1 }, { rating: 1 }],
      defaultCount: 3000,
    },
    shipments: {
      fields: {
        orderId: { type: 'ObjectId', ref: 'orders', required: true },
        carrier: { type: 'String' },
        trackingNumber: { type: 'String' },
        status: { type: 'String', enum: ['processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed'] },
        shippedAt: { type: 'Date' },
        estimatedDelivery: { type: 'Date' },
        deliveredAt: { type: 'Date' },
      },
      indexes: [{ orderId: 1 }, { status: 1 }],
      defaultCount: 4000,
      enums: {
        carriers: ['Delhivery', 'BlueDart', 'DTDC', 'Ekart', 'Shadowfax', 'XpressBees', 'India Post'],
      },
    },
    coupons: {
      fields: {
        code: { type: 'String', required: true, unique: true },
        type: { type: 'String', enum: ['percentage', 'fixed'] },
        value: { type: 'Number', min: 1 },
        minOrderAmount: { type: 'Number', min: 0 },
        maxDiscount: { type: 'Number', min: 0 },
        usageLimit: { type: 'Number', min: 1 },
        usedCount: { type: 'Number', min: 0 },
        isActive: { type: 'Boolean', default: true },
        startDate: { type: 'Date' },
        endDate: { type: 'Date' },
      },
      indexes: [{ code: 1 }, { isActive: 1 }],
      defaultCount: 50,
    },
  },
  relationships: [
    { from: 'products', to: 'categories', field: 'categoryId', type: 'one-to-many', description: 'Product belongs to a category' },
    { from: 'orders', to: 'customers', field: 'customerId', type: 'one-to-many', description: 'Order placed by a customer' },
    { from: 'order_items', to: 'orders', field: 'orderId', type: 'one-to-many', description: 'Items in an order' },
    { from: 'order_items', to: 'products', field: 'productId', type: 'one-to-many', description: 'Product in an order item' },
    { from: 'payments', to: 'orders', field: 'orderId', type: 'one-to-many', description: 'Payment for an order' },
    { from: 'returns', to: 'orders', field: 'orderId', type: 'one-to-many', description: 'Return for an order' },
    { from: 'reviews', to: 'products', field: 'productId', type: 'one-to-many', description: 'Review for a product' },
    { from: 'reviews', to: 'customers', field: 'customerId', type: 'one-to-many', description: 'Review by a customer' },
    { from: 'shipments', to: 'orders', field: 'orderId', type: 'one-to-many', description: 'Shipment for an order' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// COLLEGE ERP SCHEMA
// ═══════════════════════════════════════════════════════════════════
const collegeErpSchema = {
  industry: INDUSTRIES.COLLEGE_ERP,
  label: 'College ERP',
  dbPrefix: 'icoded_college_erp',
  collections: {
    departments: {
      fields: {
        name: { type: 'String', required: true },
        code: { type: 'String', required: true, unique: true },
        headOfDepartment: { type: 'String' },
        faculty_count: { type: 'Number', min: 5, max: 50 },
        established: { type: 'Number', min: 1950, max: 2020 },
        building: { type: 'String' },
        phone: { type: 'String' },
        email: { type: 'String' },
      },
      indexes: [{ code: 1 }],
      defaultCount: 10,
      enums: {
        names: [
          'Computer Science & Engineering', 'Electronics & Communication',
          'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering',
          'Information Technology', 'Chemical Engineering', 'Biotechnology',
          'Mathematics', 'Physics',
        ],
        codes: ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'CHE', 'BT', 'MATH', 'PHY'],
        buildings: ['Block A', 'Block B', 'Block C', 'Block D', 'Main Building', 'Science Block'],
      },
    },
    courses: {
      fields: {
        name: { type: 'String', required: true },
        code: { type: 'String', required: true, unique: true },
        departmentId: { type: 'ObjectId', ref: 'departments', required: true },
        credits: { type: 'Number', min: 1, max: 6 },
        semester: { type: 'Number', min: 1, max: 8 },
        type: { type: 'String', enum: ['core', 'elective'] },
        description: { type: 'String' },
      },
      indexes: [{ departmentId: 1 }, { semester: 1 }, { code: 1 }],
      defaultCount: 80,
    },
    faculty: {
      fields: {
        name: { type: 'String', required: true },
        email: { type: 'String', required: true, unique: true },
        phone: { type: 'String' },
        departmentId: { type: 'ObjectId', ref: 'departments', required: true },
        designation: { type: 'String', enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'] },
        qualification: { type: 'String' },
        experience: { type: 'Number', min: 0, max: 40 },
        salary: { type: 'Number', min: 30000, max: 250000 },
        joinDate: { type: 'Date' },
        specialization: { type: 'String' },
      },
      indexes: [{ departmentId: 1 }, { designation: 1 }, { email: 1 }],
      defaultCount: 100,
      enums: {
        qualifications: ['Ph.D.', 'M.Tech', 'M.Sc', 'M.E.', 'MBA', 'MCA'],
        specializations: [
          'Machine Learning', 'Data Science', 'Cloud Computing', 'IoT',
          'Cybersecurity', 'VLSI', 'Power Systems', 'Structural Engineering',
          'Thermodynamics', 'Organic Chemistry', 'Algebra', 'Quantum Physics',
        ],
      },
    },
    students: {
      fields: {
        name: { type: 'String', required: true },
        rollNumber: { type: 'String', required: true, unique: true },
        email: { type: 'String', required: true, unique: true },
        phone: { type: 'String' },
        gender: { type: 'String', enum: ['male', 'female', 'other'] },
        dateOfBirth: { type: 'Date' },
        departmentId: { type: 'ObjectId', ref: 'departments', required: true },
        semester: { type: 'Number', min: 1, max: 8 },
        batch: { type: 'String' },
        admissionDate: { type: 'Date' },
        fatherName: { type: 'String' },
        motherName: { type: 'String' },
        address: { type: 'Object' },
        cgpa: { type: 'Number', min: 0, max: 10 },
        status: { type: 'String', enum: ['active', 'graduated', 'dropped', 'suspended'] },
      },
      indexes: [{ departmentId: 1 }, { semester: 1 }, { rollNumber: 1 }, { status: 1 }, { batch: 1 }],
      defaultCount: 2000,
    },
    admissions: {
      fields: {
        studentId: { type: 'ObjectId', ref: 'students', required: true },
        departmentId: { type: 'ObjectId', ref: 'departments', required: true },
        academicYear: { type: 'String' },
        admissionType: { type: 'String', enum: ['merit', 'management', 'sports', 'lateral'] },
        entranceExamScore: { type: 'Number', min: 0, max: 200 },
        rank: { type: 'Number', min: 1 },
        status: { type: 'String', enum: ['confirmed', 'provisional', 'cancelled'] },
        admissionDate: { type: 'Date' },
      },
      indexes: [{ studentId: 1 }, { departmentId: 1 }, { academicYear: 1 }],
      defaultCount: 2000,
    },
    attendance: {
      fields: {
        studentId: { type: 'ObjectId', ref: 'students', required: true },
        courseId: { type: 'ObjectId', ref: 'courses', required: true },
        date: { type: 'Date', required: true },
        status: { type: 'String', enum: ['present', 'absent', 'late', 'excused'] },
        markedBy: { type: 'ObjectId', ref: 'faculty' },
      },
      indexes: [{ studentId: 1, courseId: 1 }, { date: 1 }, { status: 1 }],
      defaultCount: 20000,
    },
    examinations: {
      fields: {
        courseId: { type: 'ObjectId', ref: 'courses', required: true },
        type: { type: 'String', enum: ['midterm', 'endterm', 'quiz', 'assignment', 'practical'] },
        date: { type: 'Date' },
        maxMarks: { type: 'Number', min: 10, max: 100 },
        duration: { type: 'Number', min: 30, max: 180 },
        semester: { type: 'Number', min: 1, max: 8 },
        academicYear: { type: 'String' },
      },
      indexes: [{ courseId: 1 }, { type: 1 }, { semester: 1 }],
      defaultCount: 300,
    },
    results: {
      fields: {
        studentId: { type: 'ObjectId', ref: 'students', required: true },
        examinationId: { type: 'ObjectId', ref: 'examinations', required: true },
        courseId: { type: 'ObjectId', ref: 'courses', required: true },
        marksObtained: { type: 'Number', min: 0 },
        grade: { type: 'String', enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'] },
        status: { type: 'String', enum: ['pass', 'fail', 'absent', 'withheld'] },
        semester: { type: 'Number', min: 1, max: 8 },
      },
      indexes: [{ studentId: 1 }, { examinationId: 1 }, { courseId: 1 }, { grade: 1 }],
      defaultCount: 10000,
    },
    fee_payments: {
      fields: {
        studentId: { type: 'ObjectId', ref: 'students', required: true },
        feeType: { type: 'String', enum: ['tuition', 'hostel', 'library', 'lab', 'exam', 'transport'] },
        amount: { type: 'Number', min: 500, max: 200000 },
        semester: { type: 'Number', min: 1, max: 8 },
        academicYear: { type: 'String' },
        status: { type: 'String', enum: ['paid', 'pending', 'overdue', 'waived'] },
        paidDate: { type: 'Date' },
        dueDate: { type: 'Date' },
        transactionId: { type: 'String' },
        paymentMode: { type: 'String', enum: ['online', 'cash', 'cheque', 'demand_draft'] },
      },
      indexes: [{ studentId: 1 }, { status: 1 }, { feeType: 1 }],
      defaultCount: 5000,
    },
    scholarships: {
      fields: {
        studentId: { type: 'ObjectId', ref: 'students', required: true },
        name: { type: 'String' },
        type: { type: 'String', enum: ['merit', 'need', 'sports', 'government'] },
        amount: { type: 'Number', min: 5000, max: 100000 },
        academicYear: { type: 'String' },
        status: { type: 'String', enum: ['active', 'disbursed', 'revoked'] },
      },
      indexes: [{ studentId: 1 }, { type: 1 }, { status: 1 }],
      defaultCount: 300,
      enums: {
        names: [
          'Merit Scholarship', 'National Scholarship', 'State Scholarship',
          'Sports Excellence Award', 'SC/ST Scholarship', 'OBC Scholarship',
          'Need-Based Aid', 'Academic Excellence Award', 'Research Fellowship',
        ],
      },
    },
  },
  relationships: [
    { from: 'courses', to: 'departments', field: 'departmentId', type: 'one-to-many', description: 'Course belongs to a department' },
    { from: 'faculty', to: 'departments', field: 'departmentId', type: 'one-to-many', description: 'Faculty belongs to a department' },
    { from: 'students', to: 'departments', field: 'departmentId', type: 'one-to-many', description: 'Student belongs to a department' },
    { from: 'admissions', to: 'students', field: 'studentId', type: 'one-to-one', description: 'Admission for a student' },
    { from: 'attendance', to: 'students', field: 'studentId', type: 'one-to-many', description: 'Attendance for a student' },
    { from: 'attendance', to: 'courses', field: 'courseId', type: 'one-to-many', description: 'Attendance for a course' },
    { from: 'results', to: 'students', field: 'studentId', type: 'one-to-many', description: 'Result for a student' },
    { from: 'results', to: 'examinations', field: 'examinationId', type: 'one-to-many', description: 'Result for an examination' },
    { from: 'fee_payments', to: 'students', field: 'studentId', type: 'one-to-many', description: 'Fee payment by a student' },
    { from: 'scholarships', to: 'students', field: 'studentId', type: 'one-to-many', description: 'Scholarship for a student' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// HOSPITAL SCHEMA
// ═══════════════════════════════════════════════════════════════════
const hospitalSchema = {
  industry: INDUSTRIES.HOSPITAL,
  label: 'Hospital Management',
  dbPrefix: 'icoded_hospital',
  collections: {
    departments: {
      fields: {
        name: { type: 'String', required: true },
        code: { type: 'String', required: true, unique: true },
        headDoctor: { type: 'String' },
        floor: { type: 'Number', min: 0, max: 10 },
        phone: { type: 'String' },
        isEmergency: { type: 'Boolean', default: false },
      },
      indexes: [{ code: 1 }],
      defaultCount: 15,
      enums: {
        names: [
          'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology',
          'Dermatology', 'ENT', 'Ophthalmology', 'General Surgery', 'Internal Medicine',
          'Radiology', 'Pathology', 'Emergency Medicine', 'Psychiatry', 'Oncology',
        ],
        codes: ['CARD', 'NEUR', 'ORTH', 'PED', 'GYN', 'DERM', 'ENT', 'OPH', 'SURG', 'IM', 'RAD', 'PATH', 'EM', 'PSY', 'ONC'],
      },
    },
    doctors: {
      fields: {
        name: { type: 'String', required: true },
        email: { type: 'String', required: true, unique: true },
        phone: { type: 'String' },
        departmentId: { type: 'ObjectId', ref: 'departments', required: true },
        specialization: { type: 'String' },
        qualification: { type: 'String' },
        experience: { type: 'Number', min: 1, max: 40 },
        consultationFee: { type: 'Number', min: 200, max: 5000 },
        schedule: { type: 'Object' },
        isAvailable: { type: 'Boolean', default: true },
      },
      indexes: [{ departmentId: 1 }, { specialization: 1 }, { isAvailable: 1 }],
      defaultCount: 80,
      enums: {
        qualifications: ['MBBS', 'MD', 'MS', 'DM', 'MCh', 'DNB', 'MBBS, MD', 'MBBS, MS'],
        specializations: [
          'Cardiologist', 'Neurologist', 'Orthopedic Surgeon', 'Pediatrician',
          'Gynecologist', 'Dermatologist', 'ENT Specialist', 'Ophthalmologist',
          'General Surgeon', 'Physician', 'Radiologist', 'Pathologist',
          'Emergency Physician', 'Psychiatrist', 'Oncologist',
        ],
      },
    },
    patients: {
      fields: {
        name: { type: 'String', required: true },
        email: { type: 'String' },
        phone: { type: 'String', required: true },
        gender: { type: 'String', enum: ['male', 'female', 'other'] },
        dateOfBirth: { type: 'Date' },
        bloodGroup: { type: 'String', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
        address: { type: 'Object' },
        emergencyContact: { type: 'Object' },
        allergies: { type: 'Array' },
        registeredAt: { type: 'Date' },
      },
      indexes: [{ phone: 1 }, { bloodGroup: 1 }, { registeredAt: -1 }],
      defaultCount: 3000,
      enums: {
        allergies: ['Penicillin', 'Aspirin', 'Sulfa', 'Latex', 'Peanuts', 'Dust', 'Pollen', 'None'],
      },
    },
    appointments: {
      fields: {
        patientId: { type: 'ObjectId', ref: 'patients', required: true },
        doctorId: { type: 'ObjectId', ref: 'doctors', required: true },
        departmentId: { type: 'ObjectId', ref: 'departments', required: true },
        date: { type: 'Date', required: true },
        time: { type: 'String' },
        type: { type: 'String', enum: ['consultation', 'follow_up', 'emergency'] },
        status: { type: 'String', enum: ['scheduled', 'completed', 'cancelled', 'no_show'] },
        notes: { type: 'String' },
      },
      indexes: [{ patientId: 1 }, { doctorId: 1 }, { date: 1 }, { status: 1 }],
      defaultCount: 8000,
    },
    prescriptions: {
      fields: {
        appointmentId: { type: 'ObjectId', ref: 'appointments', required: true },
        patientId: { type: 'ObjectId', ref: 'patients', required: true },
        doctorId: { type: 'ObjectId', ref: 'doctors', required: true },
        medicines: { type: 'Array' },
        diagnosis: { type: 'String' },
        notes: { type: 'String' },
        prescribedAt: { type: 'Date' },
      },
      indexes: [{ patientId: 1 }, { doctorId: 1 }, { appointmentId: 1 }],
      defaultCount: 6000,
      enums: {
        diagnoses: [
          'Hypertension', 'Diabetes Type 2', 'Common Cold', 'Migraine',
          'Back Pain', 'Allergic Rhinitis', 'Gastritis', 'UTI',
          'Bronchitis', 'Fracture', 'Skin Infection', 'Anxiety',
          'Arthritis', 'Anemia', 'Thyroid Disorder',
        ],
        dosages: ['Once daily', 'Twice daily', 'Thrice daily', 'As needed', 'Before meals', 'After meals'],
        durations: ['3 days', '5 days', '7 days', '10 days', '14 days', '30 days', '90 days'],
      },
    },
    medicines: {
      fields: {
        name: { type: 'String', required: true },
        genericName: { type: 'String' },
        manufacturer: { type: 'String' },
        category: { type: 'String' },
        form: { type: 'String', enum: ['tablet', 'capsule', 'syrup', 'injection'] },
        strength: { type: 'String' },
        price: { type: 'Number', min: 5, max: 5000 },
        stock: { type: 'Number', min: 0, max: 10000 },
        expiryDate: { type: 'Date' },
      },
      indexes: [{ name: 1 }, { category: 1 }, { manufacturer: 1 }],
      defaultCount: 200,
      enums: {
        categories: ['Analgesic', 'Antibiotic', 'Antidiabetic', 'Antihypertensive', 'Antacid', 'Vitamin', 'Antiseptic', 'Antihistamine'],
        manufacturers: ['Cipla', 'Sun Pharma', 'Dr. Reddy\'s', 'Lupin', 'Aurobindo', 'Zydus', 'Torrent', 'Glenmark', 'Mankind'],
      },
    },
    bills: {
      fields: {
        patientId: { type: 'ObjectId', ref: 'patients', required: true },
        appointmentId: { type: 'ObjectId', ref: 'appointments' },
        items: { type: 'Array' },
        subtotal: { type: 'Number', min: 0 },
        tax: { type: 'Number', min: 0 },
        discount: { type: 'Number', min: 0 },
        total: { type: 'Number', min: 0 },
        status: { type: 'String', enum: ['pending', 'paid', 'partial', 'cancelled'] },
        billedAt: { type: 'Date' },
      },
      indexes: [{ patientId: 1 }, { status: 1 }, { billedAt: -1 }],
      defaultCount: 7000,
    },
    payments: {
      fields: {
        billId: { type: 'ObjectId', ref: 'bills', required: true },
        patientId: { type: 'ObjectId', ref: 'patients', required: true },
        amount: { type: 'Number', min: 0 },
        method: { type: 'String', enum: ['cash', 'card', 'upi', 'insurance', 'net_banking'] },
        status: { type: 'String', enum: ['success', 'failed', 'pending', 'refunded'] },
        transactionId: { type: 'String' },
        paidAt: { type: 'Date' },
      },
      indexes: [{ billId: 1 }, { patientId: 1 }, { status: 1 }],
      defaultCount: 7000,
    },
    lab_reports: {
      fields: {
        patientId: { type: 'ObjectId', ref: 'patients', required: true },
        doctorId: { type: 'ObjectId', ref: 'doctors', required: true },
        testName: { type: 'String', required: true },
        category: { type: 'String' },
        results: { type: 'Mixed' },
        normalRange: { type: 'String' },
        status: { type: 'String', enum: ['pending', 'completed', 'reviewed'] },
        reportDate: { type: 'Date' },
      },
      indexes: [{ patientId: 1 }, { doctorId: 1 }, { status: 1 }],
      defaultCount: 4000,
      enums: {
        testNames: [
          'Complete Blood Count', 'Blood Sugar (Fasting)', 'Blood Sugar (PP)',
          'Lipid Profile', 'Liver Function Test', 'Kidney Function Test',
          'Thyroid Profile', 'Urine Analysis', 'ECG', 'X-Ray', 'MRI', 'CT Scan',
          'HbA1c', 'Vitamin D', 'Vitamin B12', 'Iron Studies',
        ],
        categories: ['Hematology', 'Biochemistry', 'Radiology', 'Microbiology', 'Pathology'],
      },
    },
    admissions: {
      fields: {
        patientId: { type: 'ObjectId', ref: 'patients', required: true },
        doctorId: { type: 'ObjectId', ref: 'doctors', required: true },
        departmentId: { type: 'ObjectId', ref: 'departments', required: true },
        roomNumber: { type: 'String' },
        bedNumber: { type: 'String' },
        admissionDate: { type: 'Date', required: true },
        dischargeDate: { type: 'Date' },
        status: { type: 'String', enum: ['admitted', 'discharged', 'transferred'] },
        diagnosis: { type: 'String' },
      },
      indexes: [{ patientId: 1 }, { doctorId: 1 }, { status: 1 }, { admissionDate: -1 }],
      defaultCount: 1500,
    },
  },
  relationships: [
    { from: 'doctors', to: 'departments', field: 'departmentId', type: 'one-to-many', description: 'Doctor belongs to a department' },
    { from: 'appointments', to: 'patients', field: 'patientId', type: 'one-to-many', description: 'Appointment for a patient' },
    { from: 'appointments', to: 'doctors', field: 'doctorId', type: 'one-to-many', description: 'Appointment with a doctor' },
    { from: 'prescriptions', to: 'appointments', field: 'appointmentId', type: 'one-to-one', description: 'Prescription for an appointment' },
    { from: 'prescriptions', to: 'patients', field: 'patientId', type: 'one-to-many', description: 'Prescription for a patient' },
    { from: 'bills', to: 'patients', field: 'patientId', type: 'one-to-many', description: 'Bill for a patient' },
    { from: 'payments', to: 'bills', field: 'billId', type: 'one-to-many', description: 'Payment for a bill' },
    { from: 'lab_reports', to: 'patients', field: 'patientId', type: 'one-to-many', description: 'Lab report for a patient' },
    { from: 'admissions', to: 'patients', field: 'patientId', type: 'one-to-many', description: 'Admission for a patient' },
    { from: 'admissions', to: 'doctors', field: 'doctorId', type: 'one-to-many', description: 'Admission under a doctor' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// CRM SCHEMA
// ═══════════════════════════════════════════════════════════════════
const crmSchema = {
  industry: INDUSTRIES.CRM,
  label: 'CRM',
  dbPrefix: 'icoded_crm',
  collections: {
    sources: {
      fields: {
        name: { type: 'String', required: true },
        type: { type: 'String', enum: ['website', 'referral', 'social', 'cold_call', 'event', 'advertisement'] },
        isActive: { type: 'Boolean', default: true },
      },
      indexes: [{ type: 1 }],
      defaultCount: 12,
      enums: {
        names: [
          'Company Website', 'Google Ads', 'Facebook', 'LinkedIn', 'Referral Program',
          'Trade Show', 'Cold Calling', 'Email Campaign', 'Instagram', 'YouTube',
          'Twitter', 'Partner Referral',
        ],
      },
    },
    employees: {
      fields: {
        name: { type: 'String', required: true },
        email: { type: 'String', required: true, unique: true },
        phone: { type: 'String' },
        role: { type: 'String', enum: ['sales_rep', 'manager', 'executive', 'director'] },
        department: { type: 'String' },
        reportingTo: { type: 'ObjectId', ref: 'employees', default: null },
        target: { type: 'Number', min: 100000, max: 10000000 },
        joinDate: { type: 'Date' },
        isActive: { type: 'Boolean', default: true },
      },
      indexes: [{ role: 1 }, { department: 1 }, { isActive: 1 }],
      defaultCount: 50,
      enums: {
        departments: ['Sales', 'Marketing', 'Business Development', 'Account Management'],
      },
    },
    companies: {
      fields: {
        name: { type: 'String', required: true },
        industry: { type: 'String' },
        website: { type: 'String' },
        phone: { type: 'String' },
        email: { type: 'String' },
        address: { type: 'Object' },
        size: { type: 'String', enum: ['small', 'medium', 'large', 'enterprise'] },
        revenue: { type: 'Number', min: 100000, max: 1000000000 },
        contactPerson: { type: 'String' },
        status: { type: 'String', enum: ['active', 'inactive', 'prospect'] },
      },
      indexes: [{ industry: 1 }, { size: 1 }, { status: 1 }],
      defaultCount: 200,
      enums: {
        industries: ['IT', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Real Estate', 'Logistics', 'Media', 'Hospitality'],
      },
    },
    leads: {
      fields: {
        name: { type: 'String', required: true },
        email: { type: 'String', required: true },
        phone: { type: 'String' },
        company: { type: 'String' },
        companyId: { type: 'ObjectId', ref: 'companies' },
        sourceId: { type: 'ObjectId', ref: 'sources', required: true },
        assignedTo: { type: 'ObjectId', ref: 'employees' },
        status: { type: 'String', enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] },
        score: { type: 'Number', min: 0, max: 100 },
        estimatedValue: { type: 'Number', min: 10000, max: 50000000 },
        notes: { type: 'String' },
        createdAt: { type: 'Date' },
      },
      indexes: [{ status: 1 }, { assignedTo: 1 }, { sourceId: 1 }, { score: -1 }, { createdAt: -1 }],
      defaultCount: 3000,
    },
    activities: {
      fields: {
        leadId: { type: 'ObjectId', ref: 'leads', required: true },
        employeeId: { type: 'ObjectId', ref: 'employees', required: true },
        type: { type: 'String', enum: ['call', 'email', 'meeting', 'demo', 'follow_up'] },
        subject: { type: 'String' },
        description: { type: 'String' },
        duration: { type: 'Number', min: 5, max: 180 },
        outcome: { type: 'String' },
        scheduledAt: { type: 'Date' },
        completedAt: { type: 'Date' },
      },
      indexes: [{ leadId: 1 }, { employeeId: 1 }, { type: 1 }, { scheduledAt: -1 }],
      defaultCount: 8000,
      enums: {
        outcomes: ['Interested', 'Not Interested', 'Follow Up Required', 'Callback Requested', 'Demo Scheduled', 'No Answer', 'Voicemail'],
      },
    },
    followups: {
      fields: {
        leadId: { type: 'ObjectId', ref: 'leads', required: true },
        employeeId: { type: 'ObjectId', ref: 'employees', required: true },
        type: { type: 'String', enum: ['call', 'email', 'meeting', 'demo', 'follow_up'] },
        scheduledDate: { type: 'Date', required: true },
        completedDate: { type: 'Date' },
        status: { type: 'String', enum: ['pending', 'completed', 'missed', 'rescheduled'] },
        notes: { type: 'String' },
        priority: { type: 'String', enum: ['low', 'medium', 'high'] },
      },
      indexes: [{ leadId: 1 }, { employeeId: 1 }, { status: 1 }, { scheduledDate: 1 }],
      defaultCount: 5000,
    },
    opportunities: {
      fields: {
        leadId: { type: 'ObjectId', ref: 'leads', required: true },
        companyId: { type: 'ObjectId', ref: 'companies' },
        employeeId: { type: 'ObjectId', ref: 'employees', required: true },
        title: { type: 'String', required: true },
        value: { type: 'Number', min: 50000, max: 50000000 },
        probability: { type: 'Number', min: 0, max: 100 },
        stage: { type: 'String', enum: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] },
        expectedCloseDate: { type: 'Date' },
        closedAt: { type: 'Date' },
      },
      indexes: [{ leadId: 1 }, { employeeId: 1 }, { stage: 1 }, { expectedCloseDate: 1 }],
      defaultCount: 1500,
    },
    sales: {
      fields: {
        opportunityId: { type: 'ObjectId', ref: 'opportunities', required: true },
        companyId: { type: 'ObjectId', ref: 'companies', required: true },
        employeeId: { type: 'ObjectId', ref: 'employees', required: true },
        amount: { type: 'Number', min: 50000 },
        products: { type: 'Array' },
        invoiceNumber: { type: 'String' },
        status: { type: 'String', enum: ['invoiced', 'paid', 'overdue', 'cancelled'] },
        closedAt: { type: 'Date' },
      },
      indexes: [{ opportunityId: 1 }, { companyId: 1 }, { employeeId: 1 }, { status: 1 }],
      defaultCount: 800,
    },
    targets: {
      fields: {
        employeeId: { type: 'ObjectId', ref: 'employees', required: true },
        period: { type: 'String', enum: ['monthly', 'quarterly', 'yearly'] },
        year: { type: 'Number', min: 2022, max: 2026 },
        month: { type: 'Number', min: 1, max: 12 },
        targetAmount: { type: 'Number', min: 100000 },
        achievedAmount: { type: 'Number', min: 0 },
        status: { type: 'String', enum: ['on_track', 'at_risk', 'achieved', 'missed'] },
      },
      indexes: [{ employeeId: 1 }, { year: 1, month: 1 }, { status: 1 }],
      defaultCount: 600,
    },
    campaigns: {
      fields: {
        name: { type: 'String', required: true },
        type: { type: 'String', enum: ['email', 'social', 'event', 'webinar', 'advertising'] },
        budget: { type: 'Number', min: 10000, max: 5000000 },
        spent: { type: 'Number', min: 0 },
        startDate: { type: 'Date' },
        endDate: { type: 'Date' },
        leadsGenerated: { type: 'Number', min: 0 },
        conversions: { type: 'Number', min: 0 },
        roi: { type: 'Number' },
        status: { type: 'String', enum: ['planned', 'active', 'completed', 'cancelled'] },
      },
      indexes: [{ type: 1 }, { status: 1 }, { startDate: -1 }],
      defaultCount: 100,
    },
  },
  relationships: [
    { from: 'leads', to: 'sources', field: 'sourceId', type: 'one-to-many', description: 'Lead came from a source' },
    { from: 'leads', to: 'employees', field: 'assignedTo', type: 'one-to-many', description: 'Lead assigned to employee' },
    { from: 'leads', to: 'companies', field: 'companyId', type: 'one-to-many', description: 'Lead from a company' },
    { from: 'activities', to: 'leads', field: 'leadId', type: 'one-to-many', description: 'Activity for a lead' },
    { from: 'activities', to: 'employees', field: 'employeeId', type: 'one-to-many', description: 'Activity by an employee' },
    { from: 'followups', to: 'leads', field: 'leadId', type: 'one-to-many', description: 'Follow-up for a lead' },
    { from: 'opportunities', to: 'leads', field: 'leadId', type: 'one-to-many', description: 'Opportunity from a lead' },
    { from: 'sales', to: 'opportunities', field: 'opportunityId', type: 'one-to-one', description: 'Sale from an opportunity' },
    { from: 'targets', to: 'employees', field: 'employeeId', type: 'one-to-many', description: 'Target for an employee' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// BANKING SCHEMA
// ═══════════════════════════════════════════════════════════════════
const bankingSchema = {
  industry: INDUSTRIES.BANKING,
  label: 'Banking & Finance',
  dbPrefix: 'icoded_banking',
  collections: {
    branches: {
      fields: {
        name: { type: 'String', required: true },
        code: { type: 'String', required: true, unique: true },
        city: { type: 'String', required: true },
        state: { type: 'String', required: true },
        address: { type: 'Object' },
        phone: { type: 'String' },
        managerId: { type: 'String' },
        ifscCode: { type: 'String', required: true, unique: true },
        isActive: { type: 'Boolean', default: true },
      },
      indexes: [{ code: 1 }, { city: 1 }, { ifscCode: 1 }],
      defaultCount: 20,
    },
    employees: {
      fields: {
        name: { type: 'String', required: true },
        email: { type: 'String', required: true, unique: true },
        phone: { type: 'String' },
        branchId: { type: 'ObjectId', ref: 'branches', required: true },
        role: { type: 'String', enum: ['manager', 'officer', 'clerk', 'teller'] },
        department: { type: 'String' },
        joinDate: { type: 'Date' },
        salary: { type: 'Number', min: 25000, max: 300000 },
      },
      indexes: [{ branchId: 1 }, { role: 1 }, { email: 1 }],
      defaultCount: 100,
      enums: {
        departments: ['Retail Banking', 'Corporate Banking', 'Loans', 'Operations', 'Customer Service'],
      },
    },
    customers: {
      fields: {
        name: { type: 'String', required: true },
        email: { type: 'String' },
        phone: { type: 'String', required: true },
        gender: { type: 'String', enum: ['male', 'female', 'other'] },
        dateOfBirth: { type: 'Date' },
        panNumber: { type: 'String' },
        aadharNumber: { type: 'String' },
        address: { type: 'Object' },
        occupation: { type: 'String' },
        annualIncome: { type: 'Number', min: 100000, max: 50000000 },
        kycStatus: { type: 'String', enum: ['pending', 'verified', 'rejected'] },
        registeredAt: { type: 'Date' },
      },
      indexes: [{ phone: 1 }, { panNumber: 1 }, { kycStatus: 1 }, { registeredAt: -1 }],
      defaultCount: 3000,
      enums: {
        occupations: [
          'Salaried', 'Self-Employed', 'Business Owner', 'Professional',
          'Government Employee', 'Student', 'Retired', 'Homemaker', 'Freelancer',
        ],
      },
    },
    accounts: {
      fields: {
        customerId: { type: 'ObjectId', ref: 'customers', required: true },
        branchId: { type: 'ObjectId', ref: 'branches', required: true },
        accountNumber: { type: 'String', required: true, unique: true },
        type: { type: 'String', enum: ['savings', 'current', 'fixed_deposit', 'recurring_deposit'] },
        balance: { type: 'Number', min: 0 },
        interestRate: { type: 'Number', min: 0, max: 15 },
        openDate: { type: 'Date' },
        status: { type: 'String', enum: ['active', 'dormant', 'closed', 'frozen'] },
        nomineeDetails: { type: 'Object' },
      },
      indexes: [{ customerId: 1 }, { branchId: 1 }, { accountNumber: 1 }, { type: 1 }, { status: 1 }],
      defaultCount: 4000,
    },
    transactions: {
      fields: {
        accountId: { type: 'ObjectId', ref: 'accounts', required: true },
        type: { type: 'String', enum: ['credit', 'debit'] },
        category: { type: 'String', enum: ['salary', 'transfer', 'withdrawal', 'deposit', 'emi', 'bill_payment', 'shopping', 'atm'] },
        amount: { type: 'Number', min: 1 },
        balance: { type: 'Number', min: 0 },
        description: { type: 'String' },
        transactionDate: { type: 'Date' },
        referenceNumber: { type: 'String' },
        channel: { type: 'String', enum: ['branch', 'atm', 'online', 'upi', 'mobile'] },
        status: { type: 'String', enum: ['success', 'failed', 'pending', 'reversed'] },
      },
      indexes: [{ accountId: 1 }, { type: 1 }, { category: 1 }, { transactionDate: -1 }, { status: 1 }],
      defaultCount: 50000,
    },
    loans: {
      fields: {
        customerId: { type: 'ObjectId', ref: 'customers', required: true },
        accountId: { type: 'ObjectId', ref: 'accounts', required: true },
        type: { type: 'String', enum: ['home', 'personal', 'car', 'education', 'business', 'gold'] },
        amount: { type: 'Number', min: 50000, max: 50000000 },
        interestRate: { type: 'Number', min: 6, max: 24 },
        tenure: { type: 'Number', min: 6, max: 360 },
        emiAmount: { type: 'Number', min: 0 },
        disbursedDate: { type: 'Date' },
        status: { type: 'String', enum: ['applied', 'approved', 'active', 'closed', 'defaulted', 'rejected'] },
        guarantor: { type: 'Object' },
      },
      indexes: [{ customerId: 1 }, { type: 1 }, { status: 1 }, { disbursedDate: -1 }],
      defaultCount: 1000,
    },
    repayments: {
      fields: {
        loanId: { type: 'ObjectId', ref: 'loans', required: true },
        emiNumber: { type: 'Number', min: 1 },
        amount: { type: 'Number', min: 0 },
        principal: { type: 'Number', min: 0 },
        interest: { type: 'Number', min: 0 },
        penalty: { type: 'Number', min: 0 },
        paidDate: { type: 'Date' },
        status: { type: 'String', enum: ['paid', 'overdue', 'partial'] },
      },
      indexes: [{ loanId: 1 }, { status: 1 }, { paidDate: -1 }],
      defaultCount: 8000,
    },
    cards: {
      fields: {
        customerId: { type: 'ObjectId', ref: 'customers', required: true },
        accountId: { type: 'ObjectId', ref: 'accounts', required: true },
        type: { type: 'String', enum: ['debit', 'credit'] },
        cardNumber: { type: 'String' },
        expiryDate: { type: 'Date' },
        limit: { type: 'Number', min: 0, max: 1000000 },
        used: { type: 'Number', min: 0 },
        status: { type: 'String', enum: ['active', 'blocked', 'expired', 'cancelled'] },
        issuedAt: { type: 'Date' },
      },
      indexes: [{ customerId: 1 }, { accountId: 1 }, { type: 1 }, { status: 1 }],
      defaultCount: 3500,
    },
    complaints: {
      fields: {
        customerId: { type: 'ObjectId', ref: 'customers', required: true },
        category: { type: 'String', enum: ['transaction', 'card', 'loan', 'service', 'fraud'] },
        subject: { type: 'String', required: true },
        description: { type: 'String' },
        status: { type: 'String', enum: ['open', 'in_progress', 'resolved', 'escalated', 'closed'] },
        priority: { type: 'String', enum: ['low', 'medium', 'high', 'critical'] },
        assignedTo: { type: 'ObjectId', ref: 'employees' },
        createdAt: { type: 'Date' },
        resolvedAt: { type: 'Date' },
      },
      indexes: [{ customerId: 1 }, { status: 1 }, { priority: 1 }, { category: 1 }],
      defaultCount: 500,
      enums: {
        subjects: [
          'Transaction not reflected', 'Card blocked', 'ATM cash not dispensed',
          'Wrong debit', 'EMI issue', 'Service complaint', 'Fraud alert',
          'Statement discrepancy', 'Cheque bounce', 'Internet banking issue',
        ],
      },
    },
    credit_assessments: {
      fields: {
        customerId: { type: 'ObjectId', ref: 'customers', required: true },
        loanId: { type: 'ObjectId', ref: 'loans', required: true },
        creditScore: { type: 'Number', min: 300, max: 900 },
        assessmentDate: { type: 'Date' },
        riskCategory: { type: 'String', enum: ['low', 'medium', 'high', 'very_high'] },
        recommendation: { type: 'String', enum: ['approve', 'reject', 'review'] },
        assessedBy: { type: 'ObjectId', ref: 'employees' },
        factors: { type: 'Object' },
      },
      indexes: [{ customerId: 1 }, { loanId: 1 }, { riskCategory: 1 }, { recommendation: 1 }],
      defaultCount: 1000,
    },
  },
  relationships: [
    { from: 'employees', to: 'branches', field: 'branchId', type: 'one-to-many', description: 'Employee works at a branch' },
    { from: 'accounts', to: 'customers', field: 'customerId', type: 'one-to-many', description: 'Account belongs to a customer' },
    { from: 'accounts', to: 'branches', field: 'branchId', type: 'one-to-many', description: 'Account at a branch' },
    { from: 'transactions', to: 'accounts', field: 'accountId', type: 'one-to-many', description: 'Transaction on an account' },
    { from: 'loans', to: 'customers', field: 'customerId', type: 'one-to-many', description: 'Loan for a customer' },
    { from: 'loans', to: 'accounts', field: 'accountId', type: 'one-to-many', description: 'Loan linked to an account' },
    { from: 'repayments', to: 'loans', field: 'loanId', type: 'one-to-many', description: 'Repayment for a loan' },
    { from: 'cards', to: 'customers', field: 'customerId', type: 'one-to-many', description: 'Card for a customer' },
    { from: 'cards', to: 'accounts', field: 'accountId', type: 'one-to-many', description: 'Card linked to account' },
    { from: 'complaints', to: 'customers', field: 'customerId', type: 'one-to-many', description: 'Complaint by a customer' },
    { from: 'credit_assessments', to: 'customers', field: 'customerId', type: 'one-to-many', description: 'Credit assessment for customer' },
    { from: 'credit_assessments', to: 'loans', field: 'loanId', type: 'one-to-one', description: 'Assessment for a loan' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

const industrySchemas = {
  [INDUSTRIES.ECOMMERCE]: ecommerceSchema,
  [INDUSTRIES.COLLEGE_ERP]: collegeErpSchema,
  [INDUSTRIES.HOSPITAL]: hospitalSchema,
  [INDUSTRIES.CRM]: crmSchema,
  [INDUSTRIES.BANKING]: bankingSchema,
};

/**
 * Get schema for an industry
 * @param {string} industry
 * @returns {Object}
 */
const getIndustrySchema = (industry) => {
  const norm = normalizeIndustry(industry);
  const schema = industrySchemas[norm] || industrySchemas[industry] || industrySchemas[INDUSTRIES.ECOMMERCE];
  return schema;
};

/**
 * Get all industry schemas
 * @returns {Object}
 */
const getAllIndustrySchemas = () => industrySchemas;

module.exports = {
  industrySchemas,
  getIndustrySchema,
  getAllIndustrySchemas,
  ecommerceSchema,
  collegeErpSchema,
  hospitalSchema,
  crmSchema,
  bankingSchema,
};
