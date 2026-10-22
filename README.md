# KORVIX — AI-Powered Enterprise Digital Twin
> **Tagline:** Intelligence Behind Every Decision  
> **Purpose:** Academic AI Mini-Project Demonstration  

---

## 1. Project Overview
**Korvix** is an enterprise intelligence platform that creates a digital twin representation of an organization by connecting its **departments, workforce, roles, projects, strategic goals, KPIs, milestones, dependencies, and operational risks**.

### Key System Highlights
- **Organisational Digital Twin**: Interactive visual hierarchy (Organisation ➔ Departments ➔ Workforce ➔ Projects ➔ KPIs ➔ Risks & Dependencies) with node inspection drawer and dependency chain highlighting.
- **Dynamic Operational Health Telemetry**: Normalised organizational health score (out of 100) calculated deterministically from active project progress, overdue milestone penalties, and risk severities.
- **Transparent Operational Risk Engine**: Deterministic rule-based detection for:
  - *Rule A: Overdue Milestones* (due date passed and status is incomplete)
  - *Rule B: KPI Threshold Breaches* (actual value crosses critical or warning variance targets)
  - *Rule C: Unresolved Dependencies* (blocked deliverables near schedule window)
  - *Rule D: Missing / Stale Data Quality* (unassigned owners or records older than freshness threshold)
  - *Rule E: Schedule Variance* (earned progress vs elapsed calendar duration)
- **Conversational AI Copilot**: Grounded in live SQLite records with exact deterministic calculations and an expandable **"Grounded Source Records"** citation panel.
- **Role-Based Access Control (RBAC)**: Backend-enforced permissions for `ADMIN`, `MANAGER`, and `EMPLOYEE` accounts.
- **1-Click Live Presentation Reset**: Instant database restore button in Settings to reset sample data before faculty demonstration.

---

## 2. Technology Stack
- **Frontend**: React (Vite), JavaScript, Tailwind CSS, Lucide React, Recharts
- **Backend**: Python FastAPI, Uvicorn, Pydantic, Python-Multipart
- **Database**: SQLite (persisted locally at `backend/korvix.db`, architected for easy PostgreSQL migration)
- **API Architecture**: RESTful endpoints with bearer demo token headers and Vite proxy

---

## 3. Project Structure
```text
korvix/
├── backend/
│   ├── database.py         # SQLite schema, tables, foreign keys, and seed data generator
│   ├── rules.py            # Transparent rule-based risk detection & health scoring engine
│   ├── copilot_engine.py   # Grounded natural language query engine with source attribution
│   ├── main.py             # FastAPI REST endpoints & RBAC permission checks
│   ├── requirements.txt    # Python dependencies
│   ├── korvix.db           # SQLite database
│   └── venv/               # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx     # Dark navy navigation sidebar with custom geometric wordmark
│   │   │   ├── Header.jsx      # Top bar with live search, alert dropdown, workspace pill
│   │   │   └── LoginModal.jsx  # Professional login with 1-click demo role selector
│   │   ├── pages/
│   │   │   ├── OverviewPage.jsx    # Executive dashboard with charts & health telemetry
│   │   │   ├── DigitalTwinPage.jsx # Connected hierarchy & interactive node inspection
│   │   │   ├── DepartmentsPage.jsx # Department CRUD modals, budgets, staff lists
│   │   │   ├── ProjectsPage.jsx    # Projects CRUD, milestone checklist, dependency flags
│   │   │   ├── AICopilotPage.jsx   # Conversational Copilot with 7 suggested questions
│   │   │   ├── RiskMonitorPage.jsx # Rule-based risk monitor with mitigation modal
│   │   │   ├── ReportsPage.jsx     # CSV exports, print-ready layout, audit tables
│   │   │   └── SettingsPage.jsx    # Workspace config, RBAC matrix, live audit logs
│   │   ├── api.js          # Centralized fetch wrapper
│   │   ├── App.jsx         # Primary root component
│   │   ├── main.jsx        # React entrypoint
│   │   └── index.css       # Tailwind CSS & print styles
│   ├── vite.config.js      # Vite configuration with API proxy to port 8000
│   └── package.json        # Frontend dependencies
├── .gitignore
└── README.md
```

---

## 4. Demo Login Credentials

For faculty evaluation, the login dialog includes **1-click quick-select buttons** or you may enter credentials manually:

| Role | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@korvix.demo` | `korvix123` | Full workspace authority, create/edit/delete departments & projects, manage settings, view audit logs, reset demo state. |
| **MANAGER** | `manager@korvix.demo` | `korvix123` | VP of Engineering. Manage assigned projects & milestones, update risks, query AI Copilot. |
| **EMPLOYEE** | `employee@korvix.demo` | `korvix123` | Cloud Architect. Role-scoped visibility into assigned projects and personal milestone completion. |

---

## 5. Quick Start Instructions (Local Execution)

### Prerequisites
- Node.js (v18+) and npm
- Python (v3.10+ or `py` launcher on Windows)

### 1. Launch the Backend Server
```powershell
# Open Terminal 1
cd C:\Users\dell\.gemini\antigravity\scratch\korvix\backend

# Activate virtual environment
.\venv\Scripts\activate

# Start FastAPI server on port 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend API documentation is available at `http://127.0.0.1:8000/docs`.*

### 2. Launch the Frontend Application
```powershell
# Open Terminal 2
cd C:\Users\dell\.gemini\antigravity\scratch\korvix\frontend

# Start Vite dev server on port 5173
npm run dev -- --host 127.0.0.1 --port 5173
```
*Open your browser and navigate to: `http://localhost:5173`.*

---

## 6. Live Faculty Demonstration Guide

When presenting to faculty, follow this structured walkthrough:

1. **Login & RBAC**:
   - Demonstrate the 1-click role switcher at the login screen.
   - Show how the interface dynamically adapts between `ADMIN`, `MANAGER`, and `EMPLOYEE`.
2. **Overview Dashboard**:
   - Highlight the **Operational Health Score (out of 100)**, calculated from real database conditions.
   - Point out the **Performance Trend Line Chart** showing Q1-Q4 KPI achievement vs target baseline.
   - Point out the automatically detected **Overdue Milestones** in red.
3. **Interactive Digital Twin**:
   - Explore the organization as a connected graph: *Enterprise ➔ Department ➔ Role ➔ Project ➔ Milestone ➔ Risk*.
   - Click any node to open the **Live Telemetry & Dependency Drawer**.
   - Show how blocked deliverables are explicitly highlighted with blocker warning badges.
4. **Projects & Milestone Checklists**:
   - Open a project (e.g. *Cloud Native Migration Platform* or *NextGen ERP Integration*).
   - Click the checkmark to mark a milestone as completed: watch the project progress percentage and health score recalculate in real-time.
5. **AI Copilot with Ground-Truth Attribution**:
   - Click the **Suggested Prompt Chips**:
     - *"Which projects have overdue milestones?"*
     - *"Which departments are below their quarterly targets?"*
     - *"What are the top three organisational risks?"*
     - *"Summarise the organisation's current operational health."*
   - Expand the **"Grounded Source Records"** panel to prove to faculty that answers are derived from actual SQLite data rather than hallucinated text.
6. **Risk Monitor & Mitigation**:
   - Review transparent rules (*Rule A: Overdue Milestones*, *Rule B: KPI Breaches*, *Rule C: Unresolved Dependencies*).
   - Click **"Acknowledge"** or update a risk mitigation note; show how it logs to the **System Audit Trail**.
7. **Executive Reports & Export**:
   - Filter by department and click **"Export Projects CSV"** or **"Export KPIs CSV"**.
   - Click **"Print Report"** to preview the clean executive printable layout.
8. **Reset Demo Data**:
   - Click **"Reset Demo"** in the top header or in Settings to restore the database to its pristine state for the next demonstration.

---

## 7. Known Prototype Limitations
- **Local Demonstration Auth**: Uses demo session tokens and passwords suited for offline presentation without requiring external identity providers (OAuth/SSO).
- **SQLite Database**: Optimized for zero-configuration local laptop execution; data layer uses clean repository queries ready to point to PostgreSQL in production.
- **AI Mode**: Runs deterministically without requiring external paid API keys. If `OPENAI_API_KEY` or `GEMINI_API_KEY` is provided in environment variables, the backend seamlessly forwards prompts to external LLMs.

---
*Built for College AI Mini-Project Demonstration • Korvix Enterprise Digital Twin v2.4*
