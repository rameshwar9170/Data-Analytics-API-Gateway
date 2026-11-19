# System Setup & Deployment Guide

## 1. Prerequisites
- **Node.js**: v18.0.0+ (Tested on v20.19.6)
- **npm**: v9.0.0+ (Tested on v11.7.0)
- **MongoDB Atlas Cluster**: Ready M0 / M10+ cluster
- **Git**

---

## 2. Environment Configuration
Create a `.env` file in the `server` directory (a template is available in `server/.env.example`):

```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/icoded_main?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
OPENAI_API_KEY=your_openai_key_optional
OPENAI_MODEL=gpt-4
MAX_RECORDS_PER_COLLECTION=100000
BATCH_SIZE=1000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=500
QUERY_TIMEOUT_MS=30000
QUERY_RESULT_LIMIT=1000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 3. Installation

### Backend Setup:
```bash
cd server
npm install
```

### Frontend Setup:
```bash
cd client
npm install
```

---

## 4. Running the Platform

### Option A: Run Full Stack Simultaneously (From Project Root)
```bash
npm run dev
```

### Option B: Run Services Individually
**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 (React Frontend):**
```bash
cd client
npm run dev
# UI starts at http://localhost:5173 or http://localhost:3000
```

---

## 5. Seeding Initial Datasets
To generate the 5 standard datasets (E-Commerce, College ERP, Hospital, CRM, Banking) on your Atlas cluster:
```bash
cd server
node seeds/generateInitialDatasets.js
```

---

## 6. Default Login Credentials
Upon initial boot, default credentials are automatically initialized:

- **Admin Account**:
  - Email: `admin@icoded.in`
  - Password: `admin123`
- **Candidate Account**:
  - Email: `candidate@icoded.in`
  - Password: `candidate123`
