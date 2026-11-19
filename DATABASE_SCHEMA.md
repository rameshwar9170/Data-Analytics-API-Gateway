# MongoDB Database Schemas & Architecture

This document outlines the database namespaces and collection designs created in MongoDB Atlas.

---

## 1. Application Namespace: `icoded_main`
Stores metadata, system configuration, assessment tracking, and candidate submissions.

- `users`: User profiles (Admins, Candidates) with bcrypt hashed passwords and JWT sessions.
- `datasets`: Metadata, configurations, schemas, target counts, and generation logs for all databases.
- `assignments`: Assessment challenges, question banks, marks, and evaluation logic.
- `assessments`: Candidate assessment sessions, access tokens, task submissions, scores, and feedback.
- `activitylogs`: Timestamped audit events for candidate actions and navigation.
- `queryhistories`: Detailed log of every candidate query, execution duration, and error messages.

---

## 2. Dataset A: E-Commerce (`icoded_ecommerce_demo`)
1. `categories`: Category taxonomy with self-referencing hierarchy (`parentCategory`).
2. `products`: SKUs, pricing (price, cost, compare), stock, tags, and category references (`categoryId`).
3. `customers`: Customer profiles, addresses, phone, and loyalty metrics.
4. `orders`: Orders with status, totals, tax, shipping, and customer links (`customerId`).
5. `order_items`: Order line items with quantity, pricing, and product references (`orderId`, `productId`).
6. `payments`: Payment transactions, methods (UPI, Credit Card, COD), and status (`orderId`).
7. `returns`: Product return requests, reason codes, refund amounts, and status (`orderId`).
8. `reviews`: Customer ratings (1-5), verified badges, and text feedback (`productId`, `customerId`).
9. `shipments`: Tracking numbers, carriers, dispatch dates, and delivery timestamps (`orderId`).
10. `coupons`: Discount codes, percentage/fixed values, limits, and expiry dates.

---

## 3. Dataset B: College ERP (`icoded_college_erp_demo`)
1. `departments`: Academic departments, heads of department, and buildings.
2. `courses`: Courses, course codes, credits, and department references (`departmentId`).
3. `faculty`: Professors, designations, qualifications, and department links (`departmentId`).
4. `students`: Enrolled students, roll numbers, CGPA, and department references (`departmentId`).
5. `admissions`: Admission records, entrance exam ranks, and academic years (`studentId`).
6. `attendance`: Daily class attendance logs (present/absent) by student and course (`studentId`, `courseId`).
7. `examinations`: Scheduled exams, midterm/endterm types, max marks, and dates (`courseId`).
8. `results`: Student grades and marks obtained per exam (`studentId`, `examinationId`, `courseId`).
9. `fee_payments`: Tuition and hostel fee payment logs and status (`studentId`).
10. `scholarships`: Merit and need-based financial aid awards (`studentId`).

---

## 4. Dataset C: Hospital Management (`icoded_hospital_demo`)
1. `departments`: Clinical wards (Cardiology, Neurology, Emergency, etc.).
2. `doctors`: Medical specialists, license numbers, fees, and department links (`departmentId`).
3. `patients`: Medical history, blood groups, allergies, and contact details.
4. `appointments`: Consultations, scheduling times, and status (`patientId`, `doctorId`).
5. `prescriptions`: Medication instructions, dosages, and diagnosis notes (`appointmentId`, `patientId`).
6. `medicines`: Formulary catalogue, manufacturer names, strengths, and unit prices.
7. `bills`: Inpatient & outpatient invoices with itemized charges (`patientId`).
8. `payments`: Payment receipts and settlement methods (`billId`, `patientId`).
9. `lab_reports`: Diagnostic test results, normal reference ranges, and flags (`patientId`, `doctorId`).
10. `admissions`: Inpatient bed assignments, admission, and discharge dates (`patientId`, `doctorId`).

---

## 5. Dataset D: CRM & Sales Pipeline (`icoded_crm_demo`)
1. `sources`: Marketing acquisition channels (Organic, Google Ads, Referrals).
2. `employees`: Sales representatives, account executives, and reporting managers.
3. `companies`: Prospective & client enterprise accounts, annual revenues, and industries.
4. `leads`: Inbound leads, qualification statuses, scores, and assignments (`assignedTo`, `sourceId`).
5. `activities`: Sales interactions (calls, meetings, demos) logged by reps (`leadId`, `employeeId`).
6. `followups`: Scheduled tasks and reminders (`leadId`, `employeeId`).
7. `opportunities`: Deal pipelines, expected close dates, and values (`companyId`, `employeeId`).
8. `sales`: Invoiced closed revenue and payment settlement records (`opportunityId`, `employeeId`).
9. `targets`: Monthly and quarterly quota attainment metrics (`employeeId`).
10. `campaigns`: Marketing initiatives, spend, conversion rates, and ROI metrics.

---

## 6. Dataset E: Banking & Finance (`icoded_banking_demo`)
1. `branches`: Physical branches, IFSC codes, and regional manager IDs.
2. `employees`: Bank staff, branch officers, and tellers (`branchId`).
3. `customers`: Retail & commercial bank customers, KYC status, PAN, and income brackets.
4. `accounts`: Savings, current, and term deposit accounts with balances (`customerId`, `branchId`).
5. `transactions`: Deposits, withdrawals, NEFT/UPI transfers, and running balances (`accountId`).
6. `loans`: Retail & mortgage loans, interest rates, and approval status (`customerId`, `accountId`).
7. `repayments`: Monthly EMI installments, principal, interest, and status (`loanId`).
8. `cards`: Debit & credit card issues, limits, and expiration dates (`customerId`, `accountId`).
9. `complaints`: Customer grievance tickets, severity levels, and resolution logs (`customerId`).
10. `credit_assessments`: CIBIL/Credit scores, risk tiers, and loan underwriting recommendations (`customerId`).
