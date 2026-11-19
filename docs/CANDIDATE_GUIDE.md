# Candidate Assessment Guide – Data Analyst Workspace

Welcome to your iCoded Automation Technical Assessment. You have been granted access to an isolated, read-only replica of a production business dataset on MongoDB Atlas.

---

## 🔑 Logging In
1. Navigate to the login portal at `http://localhost:5173/login`.
2. Enter your candidate email and password (or use the one-click "Candidate Lab" demo button).
3. You will be redirected directly to your **Candidate Workspace**.

---

## 💻 Candidate Workspace Features

### 1. Task Navigator (Left Pane)
- View all 20 analytical tasks.
- Read the **Business Scenario**, exact **Task Requirement**, and **Expected Output**.
- Target collections are highlighted for each question.

### 2. Query Console (Right Pane)
- Choose between `find()` and `aggregate()` query modes.
- Select your target collection from the dropdown.
- Write valid JSON query filters or aggregation pipeline stages:
  ```json
  [
    { "$match": { "status": "completed" } },
    { "$group": { "_id": "$category", "totalRevenue": { "$sum": "$total" } } },
    { "$sort": { "totalRevenue": -1 } }
  ]
  ```
- Click **Execute Query** to view live results from MongoDB Atlas.
- Review document counts and execution duration (ms).

### 3. Saving & Submitting Answers
- When satisfied with your query result, click **Save Answer** for the current task.
- When all tasks are completed, click **Final Submit Assessment** in the top navigation bar.
- Your answers will be automatically evaluated against benchmark criteria.

---

## 🛡️ Sandbox Rules & Security
- **Read-Only Access**: All write operations (`insert`, `update`, `delete`, `drop`, `rename`) are blocked.
- **Code Execution Blocked**: JavaScript execution operators (`$where`, `$accumulator`, `$function`, `mapReduce`) are forbidden.
- **Scope Limit**: You can only query collections within your assigned dataset namespace.
- **Query Timeout**: Queries exceeding 30,000ms will be automatically terminated.
