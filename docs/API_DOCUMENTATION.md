# iCoded Automation – REST API Specification

Base URL: `http://localhost:5000/api`

---

## 1. Authentication (`/api/auth`)
- `POST /register`: Register a new user (`name`, `email`, `password`, `role`).
- `POST /login`: Authenticate and receive JWT token (`email`, `password`).
- `GET /me`: Get authenticated user profile (`Bearer <token>`).
- `PUT /profile`: Update name or avatar.

---

## 2. Dataset Management (`/api/datasets`) - Admin Only
- `POST /`: Initiate AI dataset generation with industry, record counts, and anomaly parameters.
- `GET /`: List datasets with search, industry filter, pagination, and sorting.
- `GET /:id`: Get single dataset configuration and metadata.
- `DELETE /:id`: Drop dataset from Atlas and delete metadata record.
- `POST /:id/regenerate`: Trigger regeneration of collections and records.
- `POST /:id/cancel`: Cancel an active generation job.
- `GET /:id/preview`: Sample records from each collection.
- `GET /:id/schema`: Relational schema and foreign keys.
- `GET /:id/quality`: Anomaly and data-quality audit report.

---

## 3. Database Explorer (`/api/databases`) - Admin Only
- `GET /`: List all databases on Atlas cluster.
- `GET /:dbName/collections`: List collections in database with document counts.
- `GET /:dbName/:collection/documents`: Paginated read-only document viewer with optional filter JSON.
- `GET /:dbName/:collection/schema`: Inferred field names and BSON types.
- `GET /:dbName/:collection/indexes`: List indexes on collection.

---

## 4. Assignment Generator (`/api/assignments`) - Admin Only
- `POST /generate`: Generate 15–30 assessment tasks from dataset schema using AI.
- `GET /`: List all assignments.
- `GET /:id`: Get assignment details (hides benchmark answers from candidates).
- `PUT /:id`: Update questions or time limits.
- `POST /:id/publish`: Publish assignment.
- `DELETE /:id`: Delete assignment.

---

## 5. Candidate Assessments (`/api/assessments`)
- `GET /my`: Get current logged-in candidate's assigned assessment.
- `POST /assign`: (Admin) Assign assessment to candidate with unique token and expiry.
- `POST /:id/start`: Mark assessment session as in_progress.
- `POST /:id/responses`: Save draft query answer for a specific question.
- `POST /:id/submit`: Final submission of entire assessment for evaluation.
- `POST /:id/evaluate`: (Admin) Trigger automated grading engine.
- `GET /:id/results`: Performance report and strengths/weaknesses breakdown.

---

## 6. Secure Query Execution (`/api/queries`) - Candidate Sandbox
- `POST /execute`: Execute read-only MongoDB query (`find`, `aggregate`, `countDocuments`, `distinct`).
  - Strict sandboxing: Blocks all write/admin operators.
  - Automatically restricts execution to the candidate's assigned dataset.
  - Returns result documents, count, and execution time in ms.
- `GET /history`: View candidate's executed query log.
- `POST /save`: Save query snippet to favorites.
- `GET /saved`: Get saved query snippets.

---

## 7. Live Candidate Telemetry (`/api/monitor`) - Admin Only
- `GET /active`: Live active candidate sessions with query counts and status.
- `GET /candidates/:id/timeline`: Timestamped activity history for candidate.
- `GET /stats`: Aggregated live statistics (total queries, success rates, active candidates).
