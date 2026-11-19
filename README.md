# Data-Analytics-API-Gateway

> **AI-Powered Realistic Dataset Generator, Data Analyst Assessment Sandbox & Live Analytics API Gateway**

An enterprise-grade platform built with **Node.js, Express, MongoDB Atlas, React, and Tailwind CSS** that generates interconnected business datasets with referential integrity, provides an isolated candidate query sandbox, and exposes a secure **Live Data Analytics API Gateway** for querying and exporting data directly into Python, Pandas, Power BI, and BI tools.

---

## 🌟 Key Features

### 1. 🚀 Live Data Analytics API Gateway
- **Live Query Execution**: Query cloud-hosted MongoDB databases in real-time via REST API using standard MongoDB filters or aggregation pipelines.
- **Direct CSV / JSON Export**: Export query results on the fly with streaming `Content-Disposition` attachments ready for data analysts.
- **Zero-Setup Pandas Integration**: Read live datasets into a Pandas DataFrame in 4 lines of Python code.
- **Read-Only Sandbox**: Strictly enforces query sandboxing (blocks `drop`, `delete`, `update`, `insert`, `$where`, code execution).

### 2. 🎲 Synthetic Business Dataset Generator
- Generate **240,000+ realistic, interconnected records** across 5 baseline industries:
  - **E-Commerce Enterprise** (`icoded_ecommerce_demo`): 10 collections (categories, products, customers, orders, payments, shipments, etc.)
  - **Banking & Financial Services** (`icoded_banking_demo`): 10 collections (accounts, transactions, loans, cards, repayments, etc.)
  - **Healthcare & Hospital ERP** (`icoded_hospital_demo`): 10 collections (patients, doctors, appointments, medical records, billing, etc.)
  - **University / College ERP** (`icoded_college_erp_demo`): 10 collections (departments, courses, faculty, students, grades, etc.)
  - **CRM & Sales Pipeline** (`icoded_crm_demo`): 10 collections (leads, accounts, contacts, opportunities, deals, etc.)
- **Referential Integrity**: Maintains foreign-key relationships across collections.
- **Configurable Complexity**: Injects realistic data quality issues (outliers, missing values, duplicates) for real-world analyst testing.

### 3. 🔍 MongoDB Database Explorer
- **3 View Modes**: Table Grid View, Syntax-Highlighted JSON Tree, and Modular Card View.
- **Schema & Field Analyzer**: Inferred field types, BSON data types, and document distribution stats.
- **Index Inspector**: Visual inspection of compound and unique indexes on MongoDB Atlas.

### 4. 🎓 Candidate Assessment Sandbox & Live Telemetry
- Isolated query execution environment for candidates and analysts.
- Real-time query performance monitoring, error logging, and evaluation scoring.

---

## 📡 Live Analytics API Reference

### 1. Query Data (Live JSON)
```http
POST /api/analytics/query
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "database": "icoded_ecommerce_demo",
  "collection": "orders",
  "queryType": "find",
  "filter": {
    "status": "completed",
    "totalAmount": { "$gt": 2500 }
  },
  "options": {
    "limit": 100,
    "sort": { "orderDate": -1 }
  }
}
```

---

### 2. Direct File Download (CSV or JSON)
```http
POST /api/analytics/export?format=csv
Authorization: Bearer <TOKEN>
Content-Type: application/json
```
or via direct link:
```http
GET /api/analytics/export?database=icoded_banking_demo&collection=loans&format=csv
Authorization: Bearer <TOKEN>
```

---

## 🐍 Python & Pandas Integration

Data analysts can pull live data directly into Python:

```python
import requests
import pandas as pd

API_URL = "https://your-domain.com/api/analytics/query"
HEADERS = {"Authorization": "Bearer YOUR_JWT_TOKEN"}

payload = {
    "database": "icoded_ecommerce_demo",
    "collection": "orders",
    "filter": {"status": "completed"},
    "options": {"limit": 1000}
}

response = requests.post(API_URL, json=payload, headers=HEADERS)
records = response.json().get("results", [])

# Load directly into Pandas DataFrame
df = pd.DataFrame(records)
print(df.head())
print(df.info())
```

---

## 🏗️ Project Architecture

```
icoded-automation/
├── client/                     # Frontend Application (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── pages/admin/        # Explorer, Generator, Datasets, Assessments, Monitor
│   │   ├── pages/candidate/    # Candidate Query Sandbox
│   │   ├── context/            # AuthContext, SocketContext
│   │   └── services/           # Axios API Client
│   └── public/                 # Static assets & compiled Tailwind bundle
│
├── server/                     # Backend API (Node.js + Express + Mongoose + Socket.IO)
│   ├── config/                 # Atlas connection, app settings
│   ├── controllers/            # Analytics, Datasets, Databases, Queries, Auth
│   ├── middleware/             # Sandbox security, JWT auth, rate limiter
│   ├── models/                 # User, Dataset, Assessment, Assignment, AuditLog
│   ├── routes/                 # Express REST routes (/api/analytics, /api/datasets, etc.)
│   ├── services/               # Data generation engine, Query sandbox execution
│   └── seeds/                  # Default user accounts seed script
│
├── .gitignore                  # Production Git ignore rules
└── README.md                   # Project documentation
```

---

## ⚙️ Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster URI

### 2. Clone and Setup Environment
```bash
git clone https://github.com/rameshwar9170/Data-Analytics-API-Gateway.git
cd Data-Analytics-API-Gateway

# Copy environment variables
cp .env.example .env
cp .env.example server/.env
```

Edit `server/.env` with your MongoDB Atlas credentials:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/icoded_main?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret
```

### 3. Install Dependencies
```bash
# Install root & backend dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 4. Run Development Servers
```bash
# Terminal 1 - Start Backend API (Port 5000)
cd server
node server.js

# Terminal 2 - Start Frontend (Port 3000)
cd client
npm run dev
```

### 5. Default Credentials
- **Admin Portal**: `admin@icoded.in` / `admin123`
- **Candidate Workspace**: `candidate@icoded.in` / `candidate123`

---

## 🔒 Security & Namespace Protection

1. **Namespace Isolation**: The platform strictly restricts access to databases starting with the `icoded_` prefix. External databases on your Atlas cluster (`sample_mflix`, `admin`, `local`) are completely blocked from listing, querying, or modification.
2. **Read-Only Enforced Sandbox**: Candidate & Analytics queries can only perform read operations (`find`, `aggregate`, `countDocuments`, `distinct`).
3. **Execution Limits**: Built-in 30-second query timeouts prevent unindexed queries from hanging the server.

---

## 🚀 Deployment

### Deploying to Render / Railway:
1. Push your repository to GitHub.
2. Create a **Web Service** pointing to the repository.
3. Set the Root Directory to `server/` (or run `npm start` from root).
4. Add your Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`).
5. Deploy! Your API will be live with free automatic SSL (`https://...`).

---

## 📄 License
MIT License. Built by iCoded Automation Pvt. Ltd.
