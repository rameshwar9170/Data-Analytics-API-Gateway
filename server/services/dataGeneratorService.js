/**
 * Data Generator Service - THE CORE ENGINE
 * Uses @faker-js/faker to generate realistic, interconnected industry data.
 * Supports seeded random, batch generation, quality issues, and referential integrity.
 */

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const { getIndustrySchema } = require('../seeds/industrySchemas');
const {
  newObjectId, randomPick, randomBetween, randomFloat, slugify, maskString,
} = require('../utils/helpers');
const { INDUSTRIES, normalizeIndustry, INDIAN_STATES, INDIAN_CITIES, GENDERS, BLOOD_GROUPS } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Apply seeded random for reproducibility
 */
const seedFaker = (seed) => {
  if (seed !== undefined && seed !== null) {
    faker.seed(seed);
  }
};

/**
 * Generate an Indian address object
 */
const generateAddress = () => ({
  street: faker.location.streetAddress(),
  city: randomPick(INDIAN_CITIES),
  state: randomPick(INDIAN_STATES),
  pincode: faker.string.numeric(6),
  country: 'India',
});

/**
 * Maybe introduce a data quality issue (null out a field)
 */
const maybeNull = (value, qualityPct) => {
  if (qualityPct > 0 && Math.random() * 100 < qualityPct) {
    return null;
  }
  return value;
};

/**
 * Maybe introduce an outlier
 */
const maybeOutlier = (value, qualityPct, min, max) => {
  if (qualityPct > 0 && Math.random() * 100 < qualityPct / 2) {
    return Math.random() > 0.5 ? max * 10 : min / 10;
  }
  return value;
};

/**
 * Generate a random date between two dates
 */
const randomDate = (start, end) => {
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  return new Date(s.getTime() + Math.random() * (e.getTime() - s.getTime()));
};

/**
 * Generate Indian phone number
 */
const indianPhone = () => {
  return `+91${faker.string.numeric(10)}`;
};

/**
 * Generate a PAN number
 */
const panNumber = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return (
    Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * 26)]).join('') +
    faker.string.numeric(4) +
    letters[Math.floor(Math.random() * 26)]
  );
};

/**
 * Generate an Aadhar number (masked)
 */
const aadharNumber = () => {
  return faker.string.numeric(12);
};

// ═══════════════════════════════════════════════════════════════════
// E-COMMERCE DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════
const generateEcommerceData = (config) => {
  const { counts = {}, dateRange = {}, qualityIssuePercentage = 5, seed } = config;
  const schema = getIndustrySchema(INDUSTRIES.ECOMMERCE);
  seedFaker(seed);

  const startDate = dateRange.start || new Date('2022-01-01');
  const endDate = dateRange.end || new Date();
  const q = qualityIssuePercentage;

  const data = {};

  // --- CATEGORIES ---
  const categoryNames = schema.collections.categories.enums.names;
  const catCount = counts.categories || schema.collections.categories.defaultCount;
  data.categories = [];
  for (let i = 0; i < catCount; i++) {
    const name = i < categoryNames.length ? categoryNames[i] : `Category ${i + 1}`;
    data.categories.push({
      _id: newObjectId(),
      name,
      slug: slugify(name),
      parentCategory: i > 5 && Math.random() > 0.5 ? data.categories[randomBetween(0, Math.min(i - 1, 5))]._id : null,
      description: faker.commerce.productDescription(),
      imageUrl: maybeNull(`https://picsum.photos/seed/${slugify(name)}/400/300`, q),
      isActive: Math.random() > 0.1,
      sortOrder: i + 1,
      createdAt: randomDate(startDate, endDate),
    });
  }

  // --- PRODUCTS ---
  const brands = schema.collections.products.enums.brands;
  const tags = schema.collections.products.enums.tags;
  const prodCount = counts.products || schema.collections.products.defaultCount;
  data.products = [];
  for (let i = 0; i < prodCount; i++) {
    const price = randomFloat(49, 199999, 2);
    const comparePrice = Math.random() > 0.4 ? randomFloat(price, price * 1.5, 2) : null;
    const costPrice = randomFloat(price * 0.3, price * 0.7, 2);
    data.products.push({
      _id: newObjectId(),
      name: faker.commerce.productName(),
      slug: slugify(faker.commerce.productName()) + '-' + faker.string.alphanumeric(4),
      description: maybeNull(faker.commerce.productDescription(), q),
      sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      price: maybeOutlier(price, q, 49, 199999),
      comparePrice,
      costPrice,
      categoryId: randomPick(data.categories)._id,
      brand: maybeNull(randomPick(brands), q),
      images: Array.from({ length: randomBetween(1, 5) }, (_, j) => `https://picsum.photos/seed/prod${i}-${j}/600/600`),
      stock: randomBetween(0, 10000),
      weight: randomFloat(0.01, 50, 2),
      dimensions: { length: randomFloat(1, 100, 1), width: randomFloat(1, 100, 1), height: randomFloat(1, 60, 1) },
      isActive: Math.random() > 0.1,
      tags: Array.from({ length: randomBetween(1, 3) }, () => randomPick(tags)),
      rating: randomFloat(1, 5, 1),
      reviewCount: randomBetween(0, 500),
      createdAt: randomDate(startDate, endDate),
    });
  }

  // --- CUSTOMERS ---
  const custCount = counts.customers || schema.collections.customers.defaultCount;
  data.customers = [];
  for (let i = 0; i < custCount; i++) {
    const gender = randomPick(GENDERS);
    const sex = gender === 'male' ? 'male' : gender === 'female' ? 'female' : randomPick(['male', 'female']);
    const firstName = faker.person.firstName(sex);
    const lastName = faker.person.lastName(sex);
    data.customers.push({
      _id: newObjectId(),
      firstName,
      lastName,
      email: maybeNull(faker.internet.email({ firstName, lastName }).toLowerCase(), q),
      phone: indianPhone(),
      gender,
      dateOfBirth: maybeNull(faker.date.birthdate({ min: 18, max: 70, mode: 'age' }), q),
      addresses: Array.from({ length: randomBetween(1, 3) }, () => ({
        type: randomPick(['home', 'work', 'other']),
        ...generateAddress(),
        isDefault: false,
      })),
      isActive: Math.random() > 0.05,
      loyaltyPoints: randomBetween(0, 50000),
      totalOrders: 0, // will update after orders
      totalSpent: 0,
      registeredAt: randomDate(startDate, endDate),
    });
    // Set first address as default
    if (data.customers[i].addresses.length > 0) {
      data.customers[i].addresses[0].isDefault = true;
    }
  }

  // --- COUPONS ---
  const coupCount = counts.coupons || schema.collections.coupons.defaultCount;
  data.coupons = [];
  for (let i = 0; i < coupCount; i++) {
    const type = randomPick(['percentage', 'fixed']);
    data.coupons.push({
      _id: newObjectId(),
      code: `SAVE${faker.string.alphanumeric(6).toUpperCase()}`,
      type,
      value: type === 'percentage' ? randomBetween(5, 50) : randomBetween(50, 2000),
      minOrderAmount: randomBetween(200, 5000),
      maxDiscount: type === 'percentage' ? randomBetween(100, 5000) : 0,
      usageLimit: randomBetween(10, 1000),
      usedCount: randomBetween(0, 500),
      isActive: Math.random() > 0.3,
      startDate: randomDate(startDate, endDate),
      endDate: randomDate(endDate, new Date(endDate.getTime() + 90 * 24 * 60 * 60 * 1000)),
    });
  }

  // --- ORDERS ---
  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
  const ordCount = counts.orders || schema.collections.orders.defaultCount;
  data.orders = [];
  data.order_items = [];
  data.payments = [];
  data.shipments = [];
  data.returns = [];

  const carriers = schema.collections.shipments.enums.carriers;
  const payMethods = ['credit_card', 'debit_card', 'upi', 'net_banking', 'cod', 'wallet'];
  const returnReasons = schema.collections.returns.enums.reasons;

  for (let i = 0; i < ordCount; i++) {
    const customer = randomPick(data.customers);
    const orderDate = randomDate(customer.registeredAt || startDate, endDate);
    const status = randomPick(orderStatuses);
    const itemsInOrder = randomBetween(1, 5);
    let subtotal = 0;
    const orderId = newObjectId();
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}-${faker.string.alphanumeric(4).toUpperCase()}${i}`;

    // Create order items
    for (let j = 0; j < itemsInOrder; j++) {
      const product = randomPick(data.products);
      const quantity = randomBetween(1, 5);
      const unitPrice = product.price || randomFloat(100, 10000, 2);
      const disc = Math.random() > 0.7 ? randomFloat(0, unitPrice * 0.2, 2) : 0;
      const itemTotal = parseFloat(((unitPrice - disc) * quantity).toFixed(2));
      subtotal += itemTotal;

      data.order_items.push({
        _id: newObjectId(),
        orderId,
        productId: product._id,
        quantity,
        unitPrice,
        discount: disc,
        total: itemTotal,
      });
    }

    const tax = parseFloat((subtotal * 0.18).toFixed(2));
    const shipping = subtotal > 999 ? 0 : randomBetween(40, 150);
    const discount = Math.random() > 0.6 ? randomFloat(0, subtotal * 0.1, 2) : 0;
    const total = parseFloat((subtotal + tax + shipping - discount).toFixed(2));
    const paymentStatus = status === 'cancelled' ? randomPick(['refunded', 'pending']) : (status === 'delivered' ? 'paid' : randomPick(paymentStatuses));

    const addr = customer.addresses && customer.addresses.length > 0 ? customer.addresses[0] : generateAddress();

    data.orders.push({
      _id: orderId,
      customerId: customer._id,
      orderNumber,
      itemCount: itemsInOrder,
      subtotal: maybeOutlier(subtotal, q, 0, 500000),
      tax,
      shipping,
      discount,
      total,
      status,
      paymentStatus,
      shippingAddress: addr,
      billingAddress: addr,
      orderDate,
      deliveredAt: status === 'delivered' ? randomDate(orderDate, endDate) : null,
    });

    // Create payment
    data.payments.push({
      _id: newObjectId(),
      orderId,
      method: randomPick(payMethods),
      amount: total,
      status: paymentStatus === 'paid' ? 'success' : paymentStatus,
      transactionId: paymentStatus === 'paid' || paymentStatus === 'refunded' ? `TXN${faker.string.alphanumeric(12).toUpperCase()}` : null,
      paidAt: paymentStatus === 'paid' ? randomDate(orderDate, endDate) : null,
    });

    // Create shipment for non-cancelled orders
    if (status !== 'pending' && status !== 'cancelled') {
      data.shipments.push({
        _id: newObjectId(),
        orderId,
        carrier: randomPick(carriers),
        trackingNumber: `TRK${faker.string.alphanumeric(10).toUpperCase()}`,
        status: status === 'delivered' ? 'delivered' : status === 'shipped' ? randomPick(['shipped', 'in_transit', 'out_for_delivery']) : 'processing',
        shippedAt: randomDate(orderDate, endDate),
        estimatedDelivery: randomDate(orderDate, new Date(orderDate.getTime() + 10 * 24 * 60 * 60 * 1000)),
        deliveredAt: status === 'delivered' ? randomDate(orderDate, endDate) : null,
      });
    }

    // Create return for some returned orders
    if (status === 'returned') {
      data.returns.push({
        _id: newObjectId(),
        orderId,
        reason: randomPick(returnReasons),
        status: randomPick(['requested', 'approved', 'completed']),
        refundAmount: randomFloat(total * 0.5, total, 2),
        returnDate: randomDate(orderDate, endDate),
        processedAt: Math.random() > 0.3 ? randomDate(orderDate, endDate) : null,
      });
    }

    // Update customer stats
    customer.totalOrders += 1;
    customer.totalSpent += total;
  }

  // --- REVIEWS ---
  const revCount = counts.reviews || schema.collections.reviews.defaultCount;
  data.reviews = [];
  for (let i = 0; i < revCount; i++) {
    const rating = randomBetween(1, 5);
    data.reviews.push({
      _id: newObjectId(),
      productId: randomPick(data.products)._id,
      customerId: randomPick(data.customers)._id,
      rating,
      title: maybeNull(faker.lorem.sentence(randomBetween(3, 8)), q),
      comment: maybeNull(faker.lorem.paragraph(randomBetween(1, 3)), q),
      isVerified: Math.random() > 0.3,
      helpfulCount: randomBetween(0, 50),
      createdAt: randomDate(startDate, endDate),
    });
  }

  // Apply duplicate quality issues
  if (q > 0) {
    const dupCount = Math.floor(data.customers.length * q / 200);
    for (let i = 0; i < dupCount; i++) {
      const dup = { ...randomPick(data.customers) };
      dup._id = newObjectId();
      dup.email = dup.email ? dup.email.replace('@', `+dup${i}@`) : null;
      data.customers.push(dup);
    }
  }

  return data;
};

// ═══════════════════════════════════════════════════════════════════
// COLLEGE ERP DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════
const generateCollegeERPData = (config) => {
  const { counts = {}, dateRange = {}, qualityIssuePercentage = 5, seed } = config;
  const schema = getIndustrySchema(INDUSTRIES.COLLEGE_ERP);
  seedFaker(seed);

  const startDate = dateRange.start || new Date('2022-01-01');
  const endDate = dateRange.end || new Date();
  const q = qualityIssuePercentage;
  const data = {};

  // --- DEPARTMENTS ---
  const deptNames = schema.collections.departments.enums.names;
  const deptCodes = schema.collections.departments.enums.codes;
  const buildings = schema.collections.departments.enums.buildings;
  const deptCount = counts.departments || schema.collections.departments.defaultCount;
  data.departments = [];
  for (let i = 0; i < deptCount; i++) {
    data.departments.push({
      _id: newObjectId(),
      name: i < deptNames.length ? deptNames[i] : `Department ${i + 1}`,
      code: i < deptCodes.length ? deptCodes[i] : `DEPT${i + 1}`,
      headOfDepartment: faker.person.fullName(),
      faculty_count: randomBetween(5, 50),
      established: randomBetween(1950, 2020),
      building: randomPick(buildings),
      phone: indianPhone(),
      email: `${(i < deptCodes.length ? deptCodes[i] : `dept${i}`).toLowerCase()}@college.edu.in`,
    });
  }

  // --- COURSES ---
  const courseCount = counts.courses || schema.collections.courses.defaultCount;
  data.courses = [];
  const courseSubjects = {
    CSE: ['Data Structures', 'Algorithms', 'Database Management', 'Operating Systems', 'Computer Networks', 'Machine Learning', 'Web Development', 'Software Engineering'],
    ECE: ['Digital Electronics', 'Signal Processing', 'Communication Systems', 'VLSI Design', 'Embedded Systems', 'Microprocessors', 'Antenna Theory', 'Control Systems'],
    ME: ['Thermodynamics', 'Fluid Mechanics', 'Manufacturing', 'CAD/CAM', 'Heat Transfer', 'Machine Design', 'Robotics', 'Material Science'],
    CE: ['Structural Analysis', 'Surveying', 'Geotechnical Engineering', 'Transportation', 'Hydraulics', 'Environmental Engineering', 'Concrete Technology', 'Steel Design'],
    EE: ['Power Systems', 'Electrical Machines', 'Control Systems', 'Power Electronics', 'Instrumentation', 'Renewable Energy', 'High Voltage', 'Network Analysis'],
  };
  let courseIdx = 0;
  for (const dept of data.departments) {
    const deptCode = dept.code;
    const subjects = courseSubjects[deptCode] || ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5', 'Subject 6', 'Subject 7', 'Subject 8'];
    for (let sem = 1; sem <= 8 && courseIdx < courseCount; sem++) {
      const subjectForSem = subjects[sem - 1] || `${deptCode} Elective ${sem}`;
      data.courses.push({
        _id: newObjectId(),
        name: subjectForSem,
        code: `${deptCode}${sem}0${courseIdx % 10 + 1}`,
        departmentId: dept._id,
        credits: randomBetween(2, 5),
        semester: sem,
        type: sem <= 4 ? 'core' : randomPick(['core', 'elective']),
        description: maybeNull(faker.lorem.sentence(randomBetween(8, 15)), q),
      });
      courseIdx++;
    }
  }

  // --- FACULTY ---
  const qualifications = schema.collections.faculty.enums.qualifications;
  const specializations = schema.collections.faculty.enums.specializations;
  const designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];
  const facCount = counts.faculty || schema.collections.faculty.defaultCount;
  data.faculty = [];
  for (let i = 0; i < facCount; i++) {
    const dept = randomPick(data.departments);
    const designation = randomPick(designations);
    const exp = designation === 'Professor' ? randomBetween(15, 40) : designation === 'Associate Professor' ? randomBetween(10, 25) : randomBetween(1, 15);
    const baseSalary = designation === 'Professor' ? 150000 : designation === 'Associate Professor' ? 100000 : designation === 'Assistant Professor' ? 60000 : 35000;
    data.faculty.push({
      _id: newObjectId(),
      name: faker.person.fullName(),
      email: faker.internet.email({ provider: 'college.edu.in' }).toLowerCase(),
      phone: indianPhone(),
      departmentId: dept._id,
      designation,
      qualification: randomPick(qualifications),
      experience: exp,
      salary: maybeOutlier(baseSalary + randomBetween(0, 50000), q, 30000, 250000),
      joinDate: randomDate(new Date('2000-01-01'), endDate),
      specialization: maybeNull(randomPick(specializations), q),
    });
  }

  // --- STUDENTS ---
  const batches = ['2020-2024', '2021-2025', '2022-2026', '2023-2027'];
  const studCount = counts.students || schema.collections.students.defaultCount;
  data.students = [];
  for (let i = 0; i < studCount; i++) {
    const dept = randomPick(data.departments);
    const gender = randomPick(GENDERS);
    const sex = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'male';
    const batch = randomPick(batches);
    const semester = randomBetween(1, 8);
    const status = semester >= 8 && Math.random() > 0.5 ? 'graduated' : (Math.random() > 0.95 ? randomPick(['dropped', 'suspended']) : 'active');
    data.students.push({
      _id: newObjectId(),
      name: faker.person.fullName({ sex }),
      rollNumber: `${dept.code}${batch.slice(2, 4)}${String(i + 1).padStart(4, '0')}`,
      email: faker.internet.email({ provider: 'student.college.edu.in' }).toLowerCase(),
      phone: indianPhone(),
      gender,
      dateOfBirth: faker.date.birthdate({ min: 17, max: 25, mode: 'age' }),
      departmentId: dept._id,
      semester,
      batch,
      admissionDate: randomDate(new Date(parseInt(batch) || 2022, 5, 1), new Date((parseInt(batch) || 2022) + 1, 0, 1)),
      fatherName: faker.person.fullName({ sex: 'male' }),
      motherName: faker.person.fullName({ sex: 'female' }),
      address: generateAddress(),
      cgpa: maybeNull(randomFloat(4.0, 10.0, 2), q),
      status,
    });
  }

  // --- ADMISSIONS ---
  const admCount = counts.admissions || Math.min(data.students.length, schema.collections.admissions.defaultCount);
  data.admissions = [];
  for (let i = 0; i < admCount; i++) {
    const student = data.students[i] || randomPick(data.students);
    data.admissions.push({
      _id: newObjectId(),
      studentId: student._id,
      departmentId: student.departmentId,
      academicYear: student.batch ? student.batch.split('-')[0] + '-' + (parseInt(student.batch.split('-')[0]) + 1) : '2022-2023',
      admissionType: randomPick(['merit', 'management', 'sports', 'lateral']),
      entranceExamScore: maybeNull(randomBetween(50, 200), q),
      rank: randomBetween(1, 50000),
      status: randomPick(['confirmed', 'provisional', 'cancelled']),
      admissionDate: student.admissionDate || randomDate(startDate, endDate),
    });
  }

  // --- ATTENDANCE ---
  const attCount = counts.attendance || schema.collections.attendance.defaultCount;
  data.attendance = [];
  for (let i = 0; i < attCount; i++) {
    const student = randomPick(data.students);
    const deptCourses = data.courses.filter((c) => c.departmentId.equals(student.departmentId));
    const course = deptCourses.length > 0 ? randomPick(deptCourses) : randomPick(data.courses);
    data.attendance.push({
      _id: newObjectId(),
      studentId: student._id,
      courseId: course._id,
      date: randomDate(startDate, endDate),
      status: randomPick(['present', 'present', 'present', 'present', 'absent', 'late', 'excused']),
      markedBy: randomPick(data.faculty)._id,
    });
  }

  // --- EXAMINATIONS ---
  const examTypes = ['midterm', 'endterm', 'quiz', 'assignment', 'practical'];
  const examCount = counts.examinations || schema.collections.examinations.defaultCount;
  data.examinations = [];
  for (let i = 0; i < examCount; i++) {
    const course = randomPick(data.courses);
    const type = randomPick(examTypes);
    const maxMarks = type === 'quiz' ? 20 : type === 'assignment' ? 30 : type === 'practical' ? 50 : type === 'midterm' ? 50 : 100;
    data.examinations.push({
      _id: newObjectId(),
      courseId: course._id,
      type,
      date: randomDate(startDate, endDate),
      maxMarks,
      duration: type === 'quiz' ? 30 : type === 'assignment' ? 60 : type === 'midterm' ? 90 : 180,
      semester: course.semester,
      academicYear: randomPick(['2022-2023', '2023-2024', '2024-2025']),
    });
  }

  // --- RESULTS ---
  const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
  const resCount = counts.results || schema.collections.results.defaultCount;
  data.results = [];
  for (let i = 0; i < resCount; i++) {
    const exam = randomPick(data.examinations);
    const student = randomPick(data.students);
    const maxMarks = exam.maxMarks || 100;
    const marks = randomBetween(Math.floor(maxMarks * 0.1), maxMarks);
    const pct = marks / maxMarks;
    const grade = pct >= 0.9 ? 'A+' : pct >= 0.8 ? 'A' : pct >= 0.7 ? 'B+' : pct >= 0.6 ? 'B' : pct >= 0.5 ? 'C+' : pct >= 0.45 ? 'C' : pct >= 0.35 ? 'D' : 'F';
    data.results.push({
      _id: newObjectId(),
      studentId: student._id,
      examinationId: exam._id,
      courseId: exam.courseId,
      marksObtained: maybeOutlier(marks, q, 0, maxMarks),
      grade: maybeNull(grade, q),
      status: marks >= maxMarks * 0.35 ? 'pass' : (Math.random() > 0.95 ? randomPick(['absent', 'withheld']) : 'fail'),
      semester: exam.semester,
    });
  }

  // --- FEE PAYMENTS ---
  const feeTypes = ['tuition', 'hostel', 'library', 'lab', 'exam', 'transport'];
  const feeAmounts = { tuition: [50000, 150000], hostel: [20000, 60000], library: [1000, 5000], lab: [2000, 10000], exam: [1000, 5000], transport: [5000, 20000] };
  const fpCount = counts.fee_payments || schema.collections.fee_payments.defaultCount;
  data.fee_payments = [];
  for (let i = 0; i < fpCount; i++) {
    const student = randomPick(data.students);
    const feeType = randomPick(feeTypes);
    const [minAmt, maxAmt] = feeAmounts[feeType];
    const status = randomPick(['paid', 'paid', 'paid', 'pending', 'overdue', 'waived']);
    const dueDate = randomDate(startDate, endDate);
    data.fee_payments.push({
      _id: newObjectId(),
      studentId: student._id,
      feeType,
      amount: randomBetween(minAmt, maxAmt),
      semester: student.semester || randomBetween(1, 8),
      academicYear: randomPick(['2022-2023', '2023-2024', '2024-2025']),
      status,
      paidDate: status === 'paid' ? randomDate(new Date(dueDate.getTime() - 30 * 24 * 60 * 60 * 1000), dueDate) : null,
      dueDate,
      transactionId: status === 'paid' ? `FEE${faker.string.alphanumeric(10).toUpperCase()}` : null,
      paymentMode: status === 'paid' ? randomPick(['online', 'cash', 'cheque', 'demand_draft']) : null,
    });
  }

  // --- SCHOLARSHIPS ---
  const scholNames = schema.collections.scholarships.enums.names;
  const schlCount = counts.scholarships || schema.collections.scholarships.defaultCount;
  data.scholarships = [];
  for (let i = 0; i < schlCount; i++) {
    data.scholarships.push({
      _id: newObjectId(),
      studentId: randomPick(data.students)._id,
      name: randomPick(scholNames),
      type: randomPick(['merit', 'need', 'sports', 'government']),
      amount: randomBetween(5000, 100000),
      academicYear: randomPick(['2022-2023', '2023-2024', '2024-2025']),
      status: randomPick(['active', 'disbursed', 'revoked']),
    });
  }

  return data;
};

// ═══════════════════════════════════════════════════════════════════
// HOSPITAL DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════
const generateHospitalData = (config) => {
  const { counts = {}, dateRange = {}, qualityIssuePercentage = 5, seed } = config;
  const schema = getIndustrySchema(INDUSTRIES.HOSPITAL);
  seedFaker(seed);

  const startDate = dateRange.start || new Date('2022-01-01');
  const endDate = dateRange.end || new Date();
  const q = qualityIssuePercentage;
  const data = {};

  // --- DEPARTMENTS ---
  const deptNames = schema.collections.departments.enums.names;
  const deptCodes = schema.collections.departments.enums.codes;
  const deptCount = counts.departments || schema.collections.departments.defaultCount;
  data.departments = [];
  for (let i = 0; i < deptCount; i++) {
    data.departments.push({
      _id: newObjectId(),
      name: i < deptNames.length ? deptNames[i] : `Department ${i + 1}`,
      code: i < deptCodes.length ? deptCodes[i] : `D${i + 1}`,
      headDoctor: faker.person.fullName(),
      floor: randomBetween(0, 10),
      phone: indianPhone(),
      isEmergency: i < deptNames.length ? ['Emergency Medicine', 'General Surgery'].includes(deptNames[i]) : false,
    });
  }

  // --- MEDICINES ---
  const medCategories = schema.collections.medicines.enums.categories;
  const manufacturers = schema.collections.medicines.enums.manufacturers;
  const medicineNames = [
    'Paracetamol', 'Amoxicillin', 'Metformin', 'Amlodipine', 'Pantoprazole',
    'Cetirizine', 'Azithromycin', 'Atorvastatin', 'Omeprazole', 'Ibuprofen',
    'Ciprofloxacin', 'Metoprolol', 'Losartan', 'Dolo 650', 'Crocin',
    'Augmentin', 'Combiflam', 'Shelcal', 'Becosules', 'Insulin Glargine',
  ];
  const medCount = counts.medicines || schema.collections.medicines.defaultCount;
  data.medicines = [];
  for (let i = 0; i < medCount; i++) {
    const name = i < medicineNames.length ? medicineNames[i] : faker.science.chemicalElement().name + ' ' + randomPick(['Forte', 'Plus', 'XR', 'SR', 'HD']);
    data.medicines.push({
      _id: newObjectId(),
      name,
      genericName: faker.science.chemicalElement().name.toLowerCase(),
      manufacturer: randomPick(manufacturers),
      category: randomPick(medCategories),
      form: randomPick(['tablet', 'capsule', 'syrup', 'injection']),
      strength: randomPick(['100mg', '250mg', '500mg', '1000mg', '5ml', '10ml']),
      price: randomFloat(5, 5000, 2),
      stock: randomBetween(0, 10000),
      expiryDate: randomDate(endDate, new Date(endDate.getTime() + 365 * 2 * 24 * 60 * 60 * 1000)),
    });
  }

  // --- DOCTORS ---
  const docQuals = schema.collections.doctors.enums.qualifications;
  const docSpecs = schema.collections.doctors.enums.specializations;
  const docCount = counts.doctors || schema.collections.doctors.defaultCount;
  data.doctors = [];
  for (let i = 0; i < docCount; i++) {
    const dept = data.departments[i % data.departments.length];
    data.doctors.push({
      _id: newObjectId(),
      name: `Dr. ${faker.person.fullName()}`,
      email: faker.internet.email({ provider: 'hospital.org' }).toLowerCase(),
      phone: indianPhone(),
      departmentId: dept._id,
      specialization: i < docSpecs.length ? docSpecs[i % docSpecs.length] : randomPick(docSpecs),
      qualification: randomPick(docQuals),
      experience: randomBetween(1, 40),
      consultationFee: randomBetween(200, 5000),
      schedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '13:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '10:00', end: '14:00' },
      },
      isAvailable: Math.random() > 0.1,
    });
  }

  // --- PATIENTS ---
  const patAllergies = schema.collections.patients.enums.allergies;
  const patCount = counts.patients || schema.collections.patients.defaultCount;
  data.patients = [];
  for (let i = 0; i < patCount; i++) {
    const gender = randomPick(GENDERS);
    const sex = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'male';
    data.patients.push({
      _id: newObjectId(),
      name: faker.person.fullName({ sex }),
      email: maybeNull(faker.internet.email().toLowerCase(), q),
      phone: indianPhone(),
      gender,
      dateOfBirth: faker.date.birthdate({ min: 1, max: 90, mode: 'age' }),
      bloodGroup: randomPick(BLOOD_GROUPS),
      address: generateAddress(),
      emergencyContact: {
        name: faker.person.fullName(),
        phone: indianPhone(),
        relation: randomPick(['Spouse', 'Parent', 'Sibling', 'Child', 'Friend']),
      },
      allergies: Array.from({ length: randomBetween(0, 3) }, () => randomPick(patAllergies)),
      registeredAt: randomDate(startDate, endDate),
    });
  }

  // --- APPOINTMENTS ---
  const apptTypes = ['consultation', 'follow_up', 'emergency'];
  const apptStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
  const apptCount = counts.appointments || schema.collections.appointments.defaultCount;
  data.appointments = [];
  for (let i = 0; i < apptCount; i++) {
    const patient = randomPick(data.patients);
    const doctor = randomPick(data.doctors);
    const status = randomPick(apptStatuses);
    data.appointments.push({
      _id: newObjectId(),
      patientId: patient._id,
      doctorId: doctor._id,
      departmentId: doctor.departmentId,
      date: randomDate(startDate, endDate),
      time: `${randomBetween(9, 17)}:${randomPick(['00', '15', '30', '45'])}`,
      type: randomPick(apptTypes),
      status,
      notes: maybeNull(faker.lorem.sentence(), q),
    });
  }

  // --- PRESCRIPTIONS ---
  const diagnoses = schema.collections.prescriptions.enums.diagnoses;
  const dosages = schema.collections.prescriptions.enums.dosages;
  const durations = schema.collections.prescriptions.enums.durations;
  const presCount = counts.prescriptions || schema.collections.prescriptions.defaultCount;
  data.prescriptions = [];
  const completedAppts = data.appointments.filter((a) => a.status === 'completed');
  for (let i = 0; i < presCount; i++) {
    const appt = completedAppts.length > 0 ? completedAppts[i % completedAppts.length] : randomPick(data.appointments);
    data.prescriptions.push({
      _id: newObjectId(),
      appointmentId: appt._id,
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      medicines: Array.from({ length: randomBetween(1, 5) }, () => ({
        medicineId: randomPick(data.medicines)._id,
        dosage: randomPick(dosages),
        frequency: randomPick(['1-0-1', '1-1-1', '0-0-1', '1-0-0', 'SOS']),
        duration: randomPick(durations),
      })),
      diagnosis: randomPick(diagnoses),
      notes: maybeNull(faker.lorem.sentence(), q),
      prescribedAt: appt.date,
    });
  }

  // --- BILLS ---
  const billCount = counts.bills || schema.collections.bills.defaultCount;
  data.bills = [];
  data.payments = [];
  for (let i = 0; i < billCount; i++) {
    const patient = randomPick(data.patients);
    const appt = randomPick(data.appointments);
    const consultation = randomBetween(200, 5000);
    const medicine = randomBetween(100, 3000);
    const lab = Math.random() > 0.5 ? randomBetween(200, 10000) : 0;
    const subtotal = consultation + medicine + lab;
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const discount = Math.random() > 0.7 ? randomFloat(0, subtotal * 0.1, 2) : 0;
    const total = parseFloat((subtotal + tax - discount).toFixed(2));
    const status = randomPick(['pending', 'paid', 'paid', 'paid', 'partial', 'cancelled']);
    const billId = newObjectId();

    data.bills.push({
      _id: billId,
      patientId: patient._id,
      appointmentId: appt._id,
      items: [
        { description: 'Consultation Fee', amount: consultation },
        { description: 'Medicines', amount: medicine },
        ...(lab > 0 ? [{ description: 'Lab Tests', amount: lab }] : []),
      ],
      subtotal,
      tax,
      discount,
      total,
      status,
      billedAt: randomDate(startDate, endDate),
    });

    // Payment
    data.payments.push({
      _id: newObjectId(),
      billId,
      patientId: patient._id,
      amount: status === 'paid' ? total : status === 'partial' ? randomFloat(total * 0.3, total * 0.8, 2) : 0,
      method: randomPick(['cash', 'card', 'upi', 'insurance', 'net_banking']),
      status: status === 'paid' ? 'success' : status === 'partial' ? 'success' : 'pending',
      transactionId: status !== 'pending' ? `HPT${faker.string.alphanumeric(10).toUpperCase()}` : null,
      paidAt: status !== 'pending' ? randomDate(startDate, endDate) : null,
    });
  }

  // --- LAB REPORTS ---
  const testNames = schema.collections.lab_reports.enums.testNames;
  const labCategories = schema.collections.lab_reports.enums.categories;
  const labCount = counts.lab_reports || schema.collections.lab_reports.defaultCount;
  data.lab_reports = [];
  for (let i = 0; i < labCount; i++) {
    const testName = randomPick(testNames);
    data.lab_reports.push({
      _id: newObjectId(),
      patientId: randomPick(data.patients)._id,
      doctorId: randomPick(data.doctors)._id,
      testName,
      category: randomPick(labCategories),
      results: { value: randomFloat(0.1, 500, 2), unit: randomPick(['mg/dL', 'mmol/L', 'g/dL', 'U/L', '%', 'mm/hr']) },
      normalRange: `${randomFloat(0.5, 50, 1)} - ${randomFloat(51, 500, 1)}`,
      status: randomPick(['pending', 'completed', 'completed', 'reviewed']),
      reportDate: randomDate(startDate, endDate),
    });
  }

  // --- ADMISSIONS ---
  const admCount = counts.admissions || schema.collections.admissions.defaultCount;
  data.admissions = [];
  for (let i = 0; i < admCount; i++) {
    const admDate = randomDate(startDate, endDate);
    const status = randomPick(['admitted', 'discharged', 'discharged', 'transferred']);
    data.admissions.push({
      _id: newObjectId(),
      patientId: randomPick(data.patients)._id,
      doctorId: randomPick(data.doctors)._id,
      departmentId: randomPick(data.departments)._id,
      roomNumber: `${randomBetween(1, 5)}${String(randomBetween(1, 20)).padStart(2, '0')}`,
      bedNumber: `${randomPick(['A', 'B', 'C', 'D'])}${randomBetween(1, 4)}`,
      admissionDate: admDate,
      dischargeDate: status === 'discharged' ? randomDate(admDate, new Date(admDate.getTime() + 30 * 24 * 60 * 60 * 1000)) : null,
      status,
      diagnosis: maybeNull(randomPick(diagnoses), q),
    });
  }

  return data;
};

// ═══════════════════════════════════════════════════════════════════
// CRM DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════
const generateCRMData = (config) => {
  const { counts = {}, dateRange = {}, qualityIssuePercentage = 5, seed } = config;
  const schema = getIndustrySchema(INDUSTRIES.CRM);
  seedFaker(seed);

  const startDate = dateRange.start || new Date('2022-01-01');
  const endDate = dateRange.end || new Date();
  const q = qualityIssuePercentage;
  const data = {};

  // --- SOURCES ---
  const sourceNames = schema.collections.sources.enums.names;
  const sourceTypes = ['website', 'referral', 'social', 'cold_call', 'event', 'advertisement'];
  data.sources = [];
  const srcCount = counts.sources || schema.collections.sources.defaultCount;
  for (let i = 0; i < srcCount; i++) {
    data.sources.push({
      _id: newObjectId(),
      name: i < sourceNames.length ? sourceNames[i] : `Source ${i + 1}`,
      type: sourceTypes[i % sourceTypes.length],
      isActive: Math.random() > 0.1,
    });
  }

  // --- EMPLOYEES ---
  const empDepts = schema.collections.employees.enums.departments;
  const roles = ['sales_rep', 'manager', 'executive', 'director'];
  const empCount = counts.employees || schema.collections.employees.defaultCount;
  data.employees = [];
  for (let i = 0; i < empCount; i++) {
    const role = i < 2 ? 'director' : i < 6 ? 'manager' : i < 15 ? 'executive' : 'sales_rep';
    data.employees.push({
      _id: newObjectId(),
      name: faker.person.fullName(),
      email: faker.internet.email({ provider: 'company.com' }).toLowerCase(),
      phone: indianPhone(),
      role,
      department: randomPick(empDepts),
      reportingTo: i > 2 ? data.employees[randomBetween(0, Math.min(i - 1, 5))]._id : null,
      target: randomBetween(500000, 10000000),
      joinDate: randomDate(new Date('2018-01-01'), endDate),
      isActive: Math.random() > 0.05,
    });
  }

  // --- COMPANIES ---
  const compIndustries = schema.collections.companies.enums.industries;
  const compCount = counts.companies || schema.collections.companies.defaultCount;
  data.companies = [];
  for (let i = 0; i < compCount; i++) {
    const size = randomPick(['small', 'medium', 'large', 'enterprise']);
    const revRanges = { small: [100000, 10000000], medium: [10000000, 100000000], large: [100000000, 500000000], enterprise: [500000000, 1000000000] };
    const [minRev, maxRev] = revRanges[size];
    data.companies.push({
      _id: newObjectId(),
      name: faker.company.name(),
      industry: randomPick(compIndustries),
      website: maybeNull(faker.internet.url(), q),
      phone: indianPhone(),
      email: faker.internet.email({ provider: 'business.com' }).toLowerCase(),
      address: generateAddress(),
      size,
      revenue: randomBetween(minRev, maxRev),
      contactPerson: faker.person.fullName(),
      status: randomPick(['active', 'active', 'inactive', 'prospect']),
    });
  }

  // --- LEADS ---
  const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  const leadCount = counts.leads || schema.collections.leads.defaultCount;
  data.leads = [];
  for (let i = 0; i < leadCount; i++) {
    const company = randomPick(data.companies);
    const status = randomPick(leadStatuses);
    const statusScore = { new: [10, 25], contacted: [20, 40], qualified: [40, 60], proposal: [50, 75], negotiation: [60, 85], won: [80, 100], lost: [5, 30] };
    const [minS, maxS] = statusScore[status];
    data.leads.push({
      _id: newObjectId(),
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: indianPhone(),
      company: company.name,
      companyId: company._id,
      sourceId: randomPick(data.sources)._id,
      assignedTo: randomPick(data.employees)._id,
      status,
      score: randomBetween(minS, maxS),
      estimatedValue: maybeOutlier(randomBetween(50000, 50000000), q, 10000, 50000000),
      notes: maybeNull(faker.lorem.sentence(), q),
      createdAt: randomDate(startDate, endDate),
    });
  }

  // --- ACTIVITIES ---
  const outcomes = schema.collections.activities.enums.outcomes;
  const actTypes = ['call', 'email', 'meeting', 'demo', 'follow_up'];
  const actCount = counts.activities || schema.collections.activities.defaultCount;
  data.activities = [];
  for (let i = 0; i < actCount; i++) {
    const type = randomPick(actTypes);
    data.activities.push({
      _id: newObjectId(),
      leadId: randomPick(data.leads)._id,
      employeeId: randomPick(data.employees)._id,
      type,
      subject: faker.lorem.sentence(randomBetween(3, 8)),
      description: maybeNull(faker.lorem.paragraph(1), q),
      duration: type === 'meeting' ? randomBetween(30, 120) : type === 'call' ? randomBetween(5, 60) : randomBetween(10, 30),
      outcome: randomPick(outcomes),
      scheduledAt: randomDate(startDate, endDate),
      completedAt: Math.random() > 0.2 ? randomDate(startDate, endDate) : null,
    });
  }

  // --- FOLLOWUPS ---
  const fuCount = counts.followups || schema.collections.followups.defaultCount;
  data.followups = [];
  for (let i = 0; i < fuCount; i++) {
    const scheduledDate = randomDate(startDate, endDate);
    const status = randomPick(['pending', 'completed', 'missed', 'rescheduled']);
    data.followups.push({
      _id: newObjectId(),
      leadId: randomPick(data.leads)._id,
      employeeId: randomPick(data.employees)._id,
      type: randomPick(actTypes),
      scheduledDate,
      completedDate: status === 'completed' ? randomDate(scheduledDate, endDate) : null,
      status,
      notes: maybeNull(faker.lorem.sentence(), q),
      priority: randomPick(['low', 'medium', 'high']),
    });
  }

  // --- OPPORTUNITIES ---
  const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  const oppCount = counts.opportunities || schema.collections.opportunities.defaultCount;
  data.opportunities = [];
  for (let i = 0; i < oppCount; i++) {
    const lead = randomPick(data.leads);
    const stage = randomPick(stages);
    const probMap = { prospecting: [10, 25], qualification: [25, 50], proposal: [40, 65], negotiation: [55, 80], closed_won: [100, 100], closed_lost: [0, 0] };
    const [minP, maxP] = probMap[stage];
    data.opportunities.push({
      _id: newObjectId(),
      leadId: lead._id,
      companyId: lead.companyId,
      employeeId: randomPick(data.employees)._id,
      title: `${faker.commerce.productName()} - ${faker.company.buzzNoun()}`,
      value: randomBetween(50000, 50000000),
      probability: randomBetween(minP, maxP),
      stage,
      expectedCloseDate: randomDate(startDate, new Date(endDate.getTime() + 180 * 24 * 60 * 60 * 1000)),
      closedAt: (stage === 'closed_won' || stage === 'closed_lost') ? randomDate(startDate, endDate) : null,
    });
  }

  // --- SALES ---
  const wonOpps = data.opportunities.filter((o) => o.stage === 'closed_won');
  const salesCount = counts.sales || Math.min(wonOpps.length, schema.collections.sales.defaultCount);
  data.sales = [];
  for (let i = 0; i < salesCount; i++) {
    const opp = wonOpps[i % wonOpps.length] || randomPick(data.opportunities);
    data.sales.push({
      _id: newObjectId(),
      opportunityId: opp._id,
      companyId: opp.companyId,
      employeeId: opp.employeeId,
      amount: opp.value || randomBetween(50000, 5000000),
      products: Array.from({ length: randomBetween(1, 4) }, () => faker.commerce.productName()),
      invoiceNumber: `INV-${faker.string.alphanumeric(8).toUpperCase()}`,
      status: randomPick(['invoiced', 'paid', 'paid', 'overdue', 'cancelled']),
      closedAt: opp.closedAt || randomDate(startDate, endDate),
    });
  }

  // --- TARGETS ---
  const tgtCount = counts.targets || schema.collections.targets.defaultCount;
  data.targets = [];
  for (let i = 0; i < tgtCount; i++) {
    const emp = randomPick(data.employees);
    const targetAmount = randomBetween(500000, 5000000);
    const achieved = randomBetween(0, Math.floor(targetAmount * 1.3));
    const pct = achieved / targetAmount;
    data.targets.push({
      _id: newObjectId(),
      employeeId: emp._id,
      period: randomPick(['monthly', 'quarterly', 'yearly']),
      year: randomBetween(2022, 2026),
      month: randomBetween(1, 12),
      targetAmount,
      achievedAmount: achieved,
      status: pct >= 1 ? 'achieved' : pct >= 0.7 ? 'on_track' : pct >= 0.4 ? 'at_risk' : 'missed',
    });
  }

  // --- CAMPAIGNS ---
  const campCount = counts.campaigns || schema.collections.campaigns.defaultCount;
  data.campaigns = [];
  for (let i = 0; i < campCount; i++) {
    const budget = randomBetween(10000, 5000000);
    const spent = randomBetween(0, budget);
    const leads = randomBetween(0, 500);
    const conversions = randomBetween(0, Math.floor(leads * 0.3));
    const roi = spent > 0 ? parseFloat(((conversions * randomBetween(10000, 100000) - spent) / spent * 100).toFixed(2)) : 0;
    const campStart = randomDate(startDate, endDate);
    data.campaigns.push({
      _id: newObjectId(),
      name: `${faker.company.buzzAdjective()} ${faker.company.buzzNoun()} Campaign`,
      type: randomPick(['email', 'social', 'event', 'webinar', 'advertising']),
      budget,
      spent,
      startDate: campStart,
      endDate: randomDate(campStart, new Date(campStart.getTime() + 90 * 24 * 60 * 60 * 1000)),
      leadsGenerated: leads,
      conversions,
      roi,
      status: randomPick(['planned', 'active', 'completed', 'cancelled']),
    });
  }

  return data;
};

// ═══════════════════════════════════════════════════════════════════
// BANKING DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════
const generateBankingData = (config) => {
  const { counts = {}, dateRange = {}, qualityIssuePercentage = 5, seed } = config;
  const schema = getIndustrySchema(INDUSTRIES.BANKING);
  seedFaker(seed);

  const startDate = dateRange.start || new Date('2022-01-01');
  const endDate = dateRange.end || new Date();
  const q = qualityIssuePercentage;
  const data = {};

  // --- BRANCHES ---
  const brCount = counts.branches || schema.collections.branches.defaultCount;
  data.branches = [];
  for (let i = 0; i < brCount; i++) {
    const city = randomPick(INDIAN_CITIES);
    const state = randomPick(INDIAN_STATES);
    data.branches.push({
      _id: newObjectId(),
      name: `${city} ${randomPick(['Main', 'Central', 'Metro', 'City', 'West', 'East', 'North', 'South'])} Branch`,
      code: `BR${String(i + 1).padStart(3, '0')}`,
      city,
      state,
      address: { ...generateAddress(), city, state },
      phone: indianPhone(),
      managerId: null, // will update
      ifscCode: `ICOD0${String(i + 1).padStart(6, '0')}`,
      isActive: Math.random() > 0.05,
    });
  }

  // --- EMPLOYEES ---
  const empDepts = schema.collections.employees.enums.departments;
  const empCount = counts.employees || schema.collections.employees.defaultCount;
  data.employees = [];
  for (let i = 0; i < empCount; i++) {
    const role = i < data.branches.length ? 'manager' : randomPick(['officer', 'clerk', 'teller']);
    const salary = role === 'manager' ? randomBetween(80000, 300000) : role === 'officer' ? randomBetween(50000, 120000) : randomBetween(25000, 60000);
    const branch = data.branches[i % data.branches.length];
    data.employees.push({
      _id: newObjectId(),
      name: faker.person.fullName(),
      email: faker.internet.email({ provider: 'icodedbank.in' }).toLowerCase(),
      phone: indianPhone(),
      branchId: branch._id,
      role,
      department: randomPick(empDepts),
      joinDate: randomDate(new Date('2010-01-01'), endDate),
      salary,
    });
    // Set branch manager
    if (role === 'manager' && i < data.branches.length) {
      data.branches[i].managerId = data.employees[i]._id.toString();
    }
  }

  // --- CUSTOMERS ---
  const occupations = schema.collections.customers.enums.occupations;
  const custCount = counts.customers || schema.collections.customers.defaultCount;
  data.customers = [];
  for (let i = 0; i < custCount; i++) {
    const gender = randomPick(GENDERS);
    const sex = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'male';
    const occupation = randomPick(occupations);
    const incomeRange = { Salaried: [300000, 3000000], 'Self-Employed': [200000, 5000000], 'Business Owner': [500000, 50000000], Professional: [500000, 10000000], 'Government Employee': [300000, 2000000], Student: [100000, 300000], Retired: [200000, 2000000], Homemaker: [100000, 500000], Freelancer: [200000, 3000000] };
    const [minInc, maxInc] = incomeRange[occupation] || [200000, 2000000];
    data.customers.push({
      _id: newObjectId(),
      name: faker.person.fullName({ sex }),
      email: maybeNull(faker.internet.email().toLowerCase(), q),
      phone: indianPhone(),
      gender,
      dateOfBirth: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }),
      panNumber: panNumber(),
      aadharNumber: aadharNumber(),
      address: generateAddress(),
      occupation,
      annualIncome: randomBetween(minInc, maxInc),
      kycStatus: randomPick(['verified', 'verified', 'verified', 'pending', 'rejected']),
      registeredAt: randomDate(startDate, endDate),
    });
  }

  // --- ACCOUNTS ---
  const accTypes = ['savings', 'current', 'fixed_deposit', 'recurring_deposit'];
  const accCount = counts.accounts || schema.collections.accounts.defaultCount;
  data.accounts = [];
  for (let i = 0; i < accCount; i++) {
    const customer = data.customers[i % data.customers.length];
    const type = randomPick(accTypes);
    const interestRate = type === 'savings' ? randomFloat(2.5, 7, 2) : type === 'current' ? 0 : type === 'fixed_deposit' ? randomFloat(5, 9, 2) : randomFloat(5, 8, 2);
    const balance = type === 'savings' ? randomBetween(500, 5000000) : type === 'current' ? randomBetween(10000, 50000000) : randomBetween(25000, 10000000);
    data.accounts.push({
      _id: newObjectId(),
      customerId: customer._id,
      branchId: randomPick(data.branches)._id,
      accountNumber: `${randomBetween(1000, 9999)}${faker.string.numeric(8)}`,
      type,
      balance: maybeOutlier(balance, q, 0, 100000000),
      interestRate,
      openDate: randomDate(customer.registeredAt || startDate, endDate),
      status: randomPick(['active', 'active', 'active', 'dormant', 'closed', 'frozen']),
      nomineeDetails: Math.random() > 0.3 ? { name: faker.person.fullName(), relation: randomPick(['Spouse', 'Parent', 'Child', 'Sibling']), phone: indianPhone() } : null,
    });
  }

  // --- TRANSACTIONS ---
  const txnCategories = ['salary', 'transfer', 'withdrawal', 'deposit', 'emi', 'bill_payment', 'shopping', 'atm'];
  const channels = ['branch', 'atm', 'online', 'upi', 'mobile'];
  const txnCount = counts.transactions || schema.collections.transactions.defaultCount;
  data.transactions = [];
  for (let i = 0; i < txnCount; i++) {
    const account = randomPick(data.accounts);
    const type = randomPick(['credit', 'debit']);
    const category = randomPick(txnCategories);
    const amount = category === 'salary' ? randomBetween(20000, 500000) : category === 'emi' ? randomBetween(5000, 100000) : randomBetween(100, 200000);
    data.transactions.push({
      _id: newObjectId(),
      accountId: account._id,
      type,
      category,
      amount,
      balance: Math.max(0, account.balance + (type === 'credit' ? amount : -amount)),
      description: maybeNull(`${category} - ${faker.lorem.words(3)}`, q),
      transactionDate: randomDate(startDate, endDate),
      referenceNumber: `REF${faker.string.alphanumeric(12).toUpperCase()}`,
      channel: randomPick(channels),
      status: randomPick(['success', 'success', 'success', 'success', 'failed', 'pending', 'reversed']),
    });
  }

  // --- LOANS ---
  const loanTypes = ['home', 'personal', 'car', 'education', 'business', 'gold'];
  const loanCount = counts.loans || schema.collections.loans.defaultCount;
  data.loans = [];
  for (let i = 0; i < loanCount; i++) {
    const customer = randomPick(data.customers);
    const account = data.accounts.find((a) => a.customerId.equals(customer._id)) || randomPick(data.accounts);
    const type = randomPick(loanTypes);
    const amountRange = { home: [1000000, 50000000], personal: [50000, 2000000], car: [300000, 5000000], education: [100000, 3000000], business: [500000, 20000000], gold: [50000, 2000000] };
    const [minAmt, maxAmt] = amountRange[type];
    const amount = randomBetween(minAmt, maxAmt);
    const tenure = type === 'home' ? randomBetween(60, 360) : type === 'personal' ? randomBetween(12, 60) : randomBetween(12, 180);
    const interestRate = randomFloat(6, 24, 2);
    const monthlyRate = interestRate / 1200;
    const emiAmount = Math.round(amount * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1));

    data.loans.push({
      _id: newObjectId(),
      customerId: customer._id,
      accountId: account._id,
      type,
      amount,
      interestRate,
      tenure,
      emiAmount,
      disbursedDate: randomDate(startDate, endDate),
      status: randomPick(['applied', 'approved', 'active', 'active', 'closed', 'defaulted', 'rejected']),
      guarantor: Math.random() > 0.5 ? { name: faker.person.fullName(), phone: indianPhone(), relation: randomPick(['Friend', 'Relative', 'Colleague']) } : null,
    });
  }

  // --- REPAYMENTS ---
  const repCount = counts.repayments || schema.collections.repayments.defaultCount;
  data.repayments = [];
  const activeLoans = data.loans.filter((l) => l.status === 'active' || l.status === 'closed');
  for (let i = 0; i < repCount; i++) {
    const loan = activeLoans.length > 0 ? activeLoans[i % activeLoans.length] : randomPick(data.loans);
    const emiNum = (i % loan.tenure) + 1;
    const interest = Math.round(loan.amount * (loan.interestRate / 1200));
    const principal = loan.emiAmount - interest;
    const penalty = Math.random() > 0.9 ? randomBetween(100, 5000) : 0;
    data.repayments.push({
      _id: newObjectId(),
      loanId: loan._id,
      emiNumber: emiNum,
      amount: loan.emiAmount + penalty,
      principal: Math.max(0, principal),
      interest: Math.max(0, interest),
      penalty,
      paidDate: randomDate(startDate, endDate),
      status: randomPick(['paid', 'paid', 'paid', 'overdue', 'partial']),
    });
  }

  // --- CARDS ---
  const cardCount = counts.cards || schema.collections.cards.defaultCount;
  data.cards = [];
  for (let i = 0; i < cardCount; i++) {
    const customer = randomPick(data.customers);
    const account = data.accounts.find((a) => a.customerId.equals(customer._id)) || randomPick(data.accounts);
    const type = randomPick(['debit', 'credit']);
    const limit = type === 'credit' ? randomBetween(25000, 1000000) : 0;
    data.cards.push({
      _id: newObjectId(),
      customerId: customer._id,
      accountId: account._id,
      type,
      cardNumber: maskString(`${randomBetween(4000, 5999)}${faker.string.numeric(12)}`, 4),
      expiryDate: randomDate(endDate, new Date(endDate.getTime() + 5 * 365 * 24 * 60 * 60 * 1000)),
      limit,
      used: type === 'credit' ? randomBetween(0, limit) : 0,
      status: randomPick(['active', 'active', 'blocked', 'expired', 'cancelled']),
      issuedAt: randomDate(startDate, endDate),
    });
  }

  // --- COMPLAINTS ---
  const compSubjects = schema.collections.complaints.enums.subjects;
  const compCount = counts.complaints || schema.collections.complaints.defaultCount;
  data.complaints = [];
  for (let i = 0; i < compCount; i++) {
    const createdAt = randomDate(startDate, endDate);
    const status = randomPick(['open', 'in_progress', 'resolved', 'escalated', 'closed']);
    data.complaints.push({
      _id: newObjectId(),
      customerId: randomPick(data.customers)._id,
      category: randomPick(['transaction', 'card', 'loan', 'service', 'fraud']),
      subject: randomPick(compSubjects),
      description: faker.lorem.paragraph(1),
      status,
      priority: randomPick(['low', 'medium', 'high', 'critical']),
      assignedTo: randomPick(data.employees)._id,
      createdAt,
      resolvedAt: ['resolved', 'closed'].includes(status) ? randomDate(createdAt, endDate) : null,
    });
  }

  // --- CREDIT ASSESSMENTS ---
  const caCount = counts.credit_assessments || schema.collections.credit_assessments.defaultCount;
  data.credit_assessments = [];
  for (let i = 0; i < caCount; i++) {
    const loan = randomPick(data.loans);
    const creditScore = randomBetween(300, 900);
    const riskCategory = creditScore >= 750 ? 'low' : creditScore >= 650 ? 'medium' : creditScore >= 500 ? 'high' : 'very_high';
    const recommendation = riskCategory === 'low' ? 'approve' : riskCategory === 'very_high' ? 'reject' : randomPick(['approve', 'review', 'reject']);
    data.credit_assessments.push({
      _id: newObjectId(),
      customerId: loan.customerId,
      loanId: loan._id,
      creditScore,
      assessmentDate: randomDate(startDate, endDate),
      riskCategory,
      recommendation,
      assessedBy: randomPick(data.employees)._id,
      factors: {
        paymentHistory: randomFloat(0, 100, 1),
        creditUtilization: randomFloat(0, 100, 1),
        creditAge: randomBetween(1, 20),
        recentInquiries: randomBetween(0, 10),
        debtToIncome: randomFloat(10, 60, 1),
      },
    });
  }

  return data;
};

// ═══════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════

/**
 * Generator map
 */
const generators = {
  [INDUSTRIES.ECOMMERCE]: generateEcommerceData,
  [INDUSTRIES.COLLEGE_ERP]: generateCollegeERPData,
  [INDUSTRIES.HOSPITAL]: generateHospitalData,
  [INDUSTRIES.CRM]: generateCRMData,
  [INDUSTRIES.BANKING]: generateBankingData,
};

/**
 * Generate data for an industry
 * @param {string} industry - Industry identifier
 * @param {Object} config - Generation config (counts, dateRange, qualityIssuePercentage, seed)
 * @returns {Object} Generated data organized by collection name
 */
const generateIndustryData = (industry, config = {}) => {
  const norm = normalizeIndustry(industry);
  const generator = generators[norm] || generators[industry] || generators[INDUSTRIES.ECOMMERCE];
  if (!generator) {
    throw new Error(`No generator for industry: ${industry}. Available: ${Object.keys(generators).join(', ')}`);
  }

  logger.info(`Starting data generation for industry: ${norm} (${industry})`);
  const data = generator(config);

  // Log counts
  const totalRecords = Object.values(data).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  logger.info(`Generated ${totalRecords} total records across ${Object.keys(data).length} collections for ${industry}`);

  return data;
};

module.exports = {
  generateIndustryData,
  generateEcommerceData,
  generateCollegeERPData,
  generateHospitalData,
  generateCRMData,
  generateBankingData,
  generators,
};
