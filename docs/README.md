# iCoded Automation – AI-Powered Realistic Dataset Generator & Data Analyst Assessment System

A production-grade enterprise platform engineered for **iCoded Automation Pvt. Ltd.** to generate synthetic, interconnected business datasets on MongoDB Atlas, automate realistic technical assignments, provide isolated read-only query sandboxes for candidates, and deliver real-time telemetry and automated evaluation.

---

## 🚀 Key Capabilities

1. **AI Dataset Generator**:
   - Generates realistic, interconnected business schemas for 10+ industries (E-Commerce, College ERP, Hospital, CRM, Banking, Logistics, etc.).
   - Employs hybrid generation (AI schema planner + deterministic relational generator with Faker.js).
   - Injects realistic, configurable data quality anomalies (null values, duplicates, outliers, inconsistent statuses).
   - Real-time batch insertion to MongoDB Atlas with live Socket.IO telemetry and cancellation recovery.

2. **MongoDB Database Explorer**:
   - Native Atlas cluster inspector for databases, collections, inferred schemas, and indexes.
   - Safe read-only document browsing with JSON formatting and pagination.

3. **AI Assignment Generator**:
   - Generates 15–30 technical assessment tasks per dataset ($match, $group, $lookup, $unwind, windowing, business KPIs).
   - Pre-validates query executability against real dataset schemas.
   - Retains hidden benchmark criteria for automated grading.

4. **Secure Candidate Sandboxing**:
   - Unique assessment session access tokens with expiration.
   - Enforces strict read-only execution: blocks insert, update, delete, drop, rename, $where, and administrative commands.
   - Restricts candidate queries strictly to their assigned dataset namespace.

5. **Live Candidate Telemetry & Monitoring**:
   - Live query audit stream (execution time, result count, error logging, active timestamps).
   - Live socket updates for candidate status and task progression.

6. **Automated Evaluation Engine**:
   - Automated grading of query correctness and output structure against hidden expected criteria.
   - Performance reports detailing total marks, percentage, strengths, and areas for improvement.

---

## 🎨 Enterprise Design System
Built with the iCoded brand identity:
- **Charcoal**: `#1B1D21`
- **Orange**: `#E96A1C`
- **Light Orange**: `#F4A261`
- **Cream**: `#FAF9F7`
- **Font**: Inter

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js, Mongoose, Socket.IO, JWT, Helmet, Winston, Jest
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Socket.IO Client
- **Database**: MongoDB Atlas Cluster (Shared Connection Pool)
- **AI**: OpenAI GPT-4 API + Expert Built-in Schema Templates
