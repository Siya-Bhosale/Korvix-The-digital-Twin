"""
Korvix Enterprise Digital Twin - SQLite Database Layer
Provides reliable local database persistence, initial schema creation,
and rich interconnected demo dataset seeding.
"""

import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "korvix.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Departments
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        department_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        manager_id TEXT,
        cost_centre TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        description TEXT,
        budget REAL DEFAULT 0,
        color TEXT DEFAULT '#3B82F6'
    )
    """)

    # Users / Employees
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role_id TEXT NOT NULL,
        department_id TEXT,
        title TEXT,
        active_status INTEGER NOT NULL DEFAULT 1,
        avatar_initials TEXT,
        FOREIGN KEY(department_id) REFERENCES departments(department_id) ON DELETE SET NULL
    )
    """)

    # Roles and Permissions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS roles (
        role_id TEXT PRIMARY KEY,
        role_name TEXT NOT NULL,
        description TEXT,
        permissions TEXT NOT NULL -- JSON string of permitted actions
    )
    """)

    # Projects
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        project_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_department TEXT NOT NULL,
        project_owner_id TEXT,
        start_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL, -- 'Planned', 'In Progress', 'At Risk', 'Completed'
        priority TEXT NOT NULL, -- 'Low', 'Medium', 'High', 'Critical'
        progress INTEGER NOT NULL DEFAULT 0,
        budget REAL DEFAULT 0,
        FOREIGN KEY(owner_department) REFERENCES departments(department_id) ON DELETE CASCADE,
        FOREIGN KEY(project_owner_id) REFERENCES users(user_id) ON DELETE SET NULL
    )
    """)

    # Milestones
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS milestones (
        milestone_id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL,
        completion_date TEXT,
        status TEXT NOT NULL, -- 'Pending', 'In Progress', 'Completed', 'Overdue'
        owner_id TEXT,
        FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY(owner_id) REFERENCES users(user_id) ON DELETE SET NULL
    )
    """)

    # Goals and KPIs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS goals_kpis (
        goal_id TEXT PRIMARY KEY,
        metric_name TEXT NOT NULL,
        department_id TEXT,
        project_id TEXT,
        target_value REAL NOT NULL,
        actual_value REAL NOT NULL,
        unit TEXT NOT NULL,
        period TEXT NOT NULL,
        status TEXT NOT NULL, -- 'On Track', 'At Risk', 'Breached', 'Exceeded'
        critical_threshold REAL,
        warning_threshold REAL,
        source_timestamp TEXT NOT NULL,
        FOREIGN KEY(department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
        FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
    )
    """)

    # Risks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS risks (
        risk_id TEXT PRIMARY KEY,
        project_id TEXT,
        department_id TEXT,
        title TEXT NOT NULL,
        category TEXT NOT NULL, -- 'Schedule', 'KPI Breach', 'Dependency', 'Data Quality', 'Operational'
        severity TEXT NOT NULL, -- 'Low', 'Medium', 'High', 'Critical'
        status TEXT NOT NULL, -- 'Active', 'Under Review', 'Mitigated', 'Closed'
        owner_id TEXT,
        description TEXT,
        triggering_rule TEXT,
        mitigation TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY(department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
        FOREIGN KEY(owner_id) REFERENCES users(user_id) ON DELETE SET NULL
    )
    """)

    # Dependencies
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dependencies (
        dependency_id TEXT PRIMARY KEY,
        source_entity_id TEXT NOT NULL, -- The dependent project/milestone
        target_entity_id TEXT NOT NULL, -- The entity it depends on
        dependency_type TEXT NOT NULL, -- 'Blocks', 'Requires', 'Precedes'
        state TEXT NOT NULL, -- 'Resolved', 'Unresolved', 'At Risk'
        description TEXT
    )
    """)

    # Audit Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        log_id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL
    )
    """)

    # Application Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT
    )
    """)

    conn.commit()
    conn.close()

def seed_demo_data(reset=False):
    """
    Populates SQLite database with rich, realistic, interconnected illustrative data.
    Designed specifically for live presentation with intentional overdue milestones,
    KPI breaches, and dependencies to demonstrate the Digital Twin & Risk Monitor.
    """
    conn = get_connection()
    cursor = conn.cursor()

    if reset:
        cursor.execute("DELETE FROM dependencies")
        cursor.execute("DELETE FROM risks")
        cursor.execute("DELETE FROM goals_kpis")
        cursor.execute("DELETE FROM milestones")
        cursor.execute("DELETE FROM projects")
        cursor.execute("DELETE FROM users")
        cursor.execute("DELETE FROM roles")
        cursor.execute("DELETE FROM departments")
        cursor.execute("DELETE FROM audit_logs")
        cursor.execute("DELETE FROM settings")
        conn.commit()

    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM departments")
    if cursor.fetchone()[0] > 0 and not reset:
        conn.close()
        return

    now = datetime.now()
    d_minus_15 = (now - timedelta(days=15)).strftime("%Y-%m-%d")
    d_minus_7 = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    d_minus_3 = (now - timedelta(days=3)).strftime("%Y-%m-%d")
    d_minus_1 = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    d_today = now.strftime("%Y-%m-%d")
    d_plus_7 = (now + timedelta(days=7)).strftime("%Y-%m-%d")
    d_plus_14 = (now + timedelta(days=14)).strftime("%Y-%m-%d")
    d_plus_20 = (now + timedelta(days=20)).strftime("%Y-%m-%d")
    d_plus_30 = (now + timedelta(days=30)).strftime("%Y-%m-%d")
    d_plus_60 = (now + timedelta(days=60)).strftime("%Y-%m-%d")
    d_plus_90 = (now + timedelta(days=90)).strftime("%Y-%m-%d")
    d_plus_120 = (now + timedelta(days=120)).strftime("%Y-%m-%d")

    # 1. Roles
    roles = [
        ("ADMIN", "System Administrator", "Full workspace access, user management, audit logs, and settings",
         json.dumps(["manage_workspace", "manage_departments", "manage_projects", "manage_users", "view_all", "manage_settings", "manage_risks"])),
        ("MANAGER", "Department Manager", "Departmental oversight, project administration, milestone tracking, and AI Copilot access",
         json.dumps(["view_department", "manage_assigned_projects", "manage_milestones", "view_kpis", "manage_risks", "use_copilot"])),
        ("EMPLOYEE", "Team Member", "Role-scoped project viewing and individual milestone completion reporting",
         json.dumps(["view_assigned_projects", "view_milestones", "view_basic_info"]))
    ]
    cursor.executemany("INSERT INTO roles VALUES (?, ?, ?, ?)", roles)

    # 2. Departments
    departments = [
        ("DEP-ENG", "Engineering & Architecture", "USR-002", "CC-101", "Active",
         "Core software platform, microservices infrastructure, and cloud scalability.", 1850000.0, "#3B82F6"),
        ("DEP-OPS", "Global Operations & Delivery", "USR-003", "CC-202", "Active",
         "Supply chain automation, logistical operations, and vendor management.", 1200000.0, "#10B981"),
        ("DEP-FIN", "Corporate Finance & Risk", "USR-004", "CC-303", "Active",
         "Fiscal management, budget allocations, compliance reporting, and audit.", 850000.0, "#6366F1"),
        ("DEP-HR", "People & Organisational Development", "USR-005", "CC-404", "Active",
         "Talent acquisition, employee retention, and professional workforce enablement.", 620000.0, "#EC4899")
    ]
    cursor.executemany("INSERT INTO departments VALUES (?, ?, ?, ?, ?, ?, ?, ?)", departments)

    # 3. Users / Employees (password for all: korvix123)
    users = [
        ("USR-001", "Dr. Sarah Jenkins", "admin@korvix.demo", "korvix123", "ADMIN", "DEP-ENG", "Chief Technology Officer & Admin", 1, "SJ"),
        ("USR-002", "Marcus Vance", "manager@korvix.demo", "korvix123", "MANAGER", "DEP-ENG", "VP of Engineering", 1, "MV"),
        ("USR-003", "Elena Rostova", "elena.ops@korvix.demo", "korvix123", "MANAGER", "DEP-OPS", "Director of Global Operations", 1, "ER"),
        ("USR-004", "David Sterling", "david.fin@korvix.demo", "korvix123", "MANAGER", "DEP-FIN", "Chief Financial Controller", 1, "DS"),
        ("USR-005", "Amara Okonjo", "amara.hr@korvix.demo", "korvix123", "MANAGER", "DEP-HR", "Head of People Operations", 1, "AO"),
        ("USR-006", "Alex Chen", "employee@korvix.demo", "korvix123", "EMPLOYEE", "DEP-ENG", "Senior Cloud Systems Architect", 1, "AC"),
        ("USR-007", "Sophia Martinez", "sophia.m@korvix.demo", "korvix123", "EMPLOYEE", "DEP-OPS", "Operations Workflow Lead", 1, "SM"),
        ("USR-008", "Liam O'Connor", "liam.oc@korvix.demo", "korvix123", "EMPLOYEE", "DEP-FIN", "Senior Financial Analyst", 1, "LO")
    ]
    cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", users)

    # 4. Projects (At least 6 realistic projects)
    projects = [
        ("PRJ-101", "Cloud Native Migration Platform",
         "Migrate legacy monolithic systems to distributed Kubernetes clusters with zero-downtime microservices.",
         "DEP-ENG", "USR-002", d_minus_15, d_plus_60, "In Progress", "Critical", 65, 450000.0),
        ("PRJ-102", "NextGen ERP Integration",
         "Consolidate operational logistics, inventory dispatch, and procurement tracking into unified SAP core.",
         "DEP-OPS", "USR-003", d_minus_15, d_plus_30, "At Risk", "High", 42, 380000.0),
        ("PRJ-103", "Automated Compliance & Audit Engine",
         "Real-time regulatory compliance verification with automated ledger reconciliation and SOX report generation.",
         "DEP-FIN", "USR-004", d_minus_7, d_plus_90, "In Progress", "High", 35, 210000.0),
        ("PRJ-104", "Global Workforce Analytics Suite",
         "Employee retention telemetry, skill gap mapping, and automated talent growth planning dashboard.",
         "DEP-HR", "USR-005", d_minus_7, d_plus_14, "At Risk", "Medium", 58, 140000.0),
        ("PRJ-105", "Zero Trust Identity Architecture",
         "Enterprise-wide single sign-on with biometric MFA, device posture checking, and privileged access guardrails.",
         "DEP-ENG", "USR-006", d_minus_15, d_plus_120, "In Progress", "Critical", 78, 310000.0),
        ("PRJ-106", "Vendor Quality & Logistics Optimization",
         "Automated SLA monitoring, automated defect triage, and automated freight rate negotiation framework.",
         "DEP-OPS", "USR-007", d_today, d_plus_90, "Planned", "Medium", 15, 175000.0)
    ]
    cursor.executemany("INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", projects)

    # 5. Milestones (At least 15 milestones, including intentionally OVERDUE ones for live demo!)
    milestones = [
        # PRJ-101 Milestones
        ("MLS-01", "PRJ-101", "Containerization of Core Ingestion Service", d_minus_7, d_minus_7, "Completed", "USR-006"),
        ("MLS-02", "PRJ-101", "Kubernetes Cluster Provisioning in EU Region", d_minus_3, None, "Overdue", "USR-006"),
        ("MLS-03", "PRJ-101", "Database Read Replica Synchronization", d_plus_14, None, "In Progress", "USR-002"),
        ("MLS-04", "PRJ-101", "Final Cutover & Traffic Migration", d_plus_60, None, "Pending", "USR-002"),

        # PRJ-102 Milestones (At Risk)
        ("MLS-05", "PRJ-102", "Legacy Data Schema Mapping & Cleanup", d_minus_3, None, "Overdue", "USR-007"),
        ("MLS-06", "PRJ-102", "Procurement API Middleware Gateway", d_plus_7, None, "In Progress", "USR-003"),
        ("MLS-07", "PRJ-102", "User Acceptance Testing with Regional Warehouses", d_plus_20, None, "Pending", "USR-003"),
        ("MLS-08", "PRJ-102", "Global Go-Live Deployment", d_plus_30, None, "Pending", "USR-003"),

        # PRJ-103 Milestones
        ("MLS-09", "PRJ-103", "SOX Regulatory Rulebook Formalization", d_minus_7, d_minus_7, "Completed", "USR-004"),
        ("MLS-10", "PRJ-103", "Automated Ledger Reconciliation Pipeline", d_plus_14, None, "In Progress", "USR-008"),
        ("MLS-11", "PRJ-103", "Security Audit & Third-Party Attestation", d_plus_60, None, "Pending", "USR-004"),

        # PRJ-104 Milestones
        ("MLS-12", "PRJ-104", "Data Privacy & GDPR Employee Consent Matrix", d_minus_1, None, "Overdue", "USR-005"),
        ("MLS-13", "PRJ-104", "Talent Retention Machine Model Validation", d_plus_7, None, "In Progress", "USR-005"),
        ("MLS-14", "PRJ-104", "Executive Pulse Dashboard Rollout", d_plus_14, None, "Pending", "USR-005"),

        # PRJ-105 Milestones
        ("MLS-15", "PRJ-105", "Okta MFA Hardware Token Distribution", d_minus_15, d_minus_7, "Completed", "USR-006"),
        ("MLS-16", "PRJ-105", "Conditional Access Policy Enforcement", d_plus_30, None, "In Progress", "USR-006"),

        # PRJ-106 Milestones
        ("MLS-17", "PRJ-106", "Vendor SLA Telemetry Ingestion API", d_plus_14, None, "Pending", "USR-007")
    ]
    cursor.executemany("INSERT INTO milestones VALUES (?, ?, ?, ?, ?, ?, ?)", milestones)

    # 6. Goals & KPIs (At least 8 records, including breached and warning ones)
    goals = [
        ("KPI-01", "Platform Uptime SLA", "DEP-ENG", "PRJ-101", 99.95, 99.88, "%", "Q4 2026", "On Track", 99.50, 99.90, d_today),
        ("KPI-02", "Sprint Velocity Achievement", "DEP-ENG", "PRJ-101", 90.0, 92.5, "%", "Q4 2026", "Exceeded", 75.0, 85.0, d_today),
        ("KPI-03", "Order Fulfillment Cycle Time", "DEP-OPS", "PRJ-102", 24.0, 31.5, "Hours", "Q4 2026", "Breached", 30.0, 26.0, d_today),
        ("KPI-04", "Inventory Discrepancy Rate", "DEP-OPS", "PRJ-102", 1.5, 2.8, "%", "Q4 2026", "Breached", 2.5, 1.8, d_today),
        ("KPI-05", "Budget Variance Deviation", "DEP-FIN", "PRJ-103", 5.0, 4.1, "%", "Q4 2026", "On Track", 8.0, 6.0, d_today),
        ("KPI-06", "Audit Cycle Duration", "DEP-FIN", "PRJ-103", 10.0, 8.5, "Days", "Q4 2026", "On Track", 14.0, 11.0, d_today),
        ("KPI-07", "Quarterly Employee Attrition", "DEP-HR", "PRJ-104", 6.0, 8.4, "%", "Q4 2026", "At Risk", 9.0, 7.0, d_today),
        ("KPI-08", "Time-to-Hire Critical Roles", "DEP-HR", "PRJ-104", 30.0, 27.0, "Days", "Q4 2026", "On Track", 45.0, 35.0, d_today)
    ]
    cursor.executemany("INSERT INTO goals_kpis VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", goals)

    # 7. Risks (6 risks across categories and severities with triggering rules & mitigations)
    risks = [
        ("RSK-001", "PRJ-101", "DEP-ENG", "Kubernetes Deployment Delayed Past Window",
         "Schedule", "High", "Active", "USR-006",
         "Infrastructure provisioning milestone MLS-02 is overdue by 3 days, jeopardizing EU cutover window.",
         "RULE-OVERDUE-MILESTONE: MLS-02 due date passed without completion.",
         "Reassign secondary DevOps engineer from Identity team to expedite Terraform script debugging.",
         d_minus_3),
        ("RSK-002", "PRJ-102", "DEP-OPS", "Order Fulfillment KPI Breach & Warehouse Delays",
         "KPI Breach", "Critical", "Active", "USR-003",
         "Order fulfillment cycle time is 31.5 hrs against target of 24.0 hrs due to legacy schema migration freeze.",
         "RULE-KPI-BREACH: KPI-03 exceeded critical threshold of 30.0 Hours.",
         "Institute manual fallback routing for tier-1 distributors while schema reconciliation is prioritized.",
         d_minus_3),
        ("RSK-003", "PRJ-102", "DEP-OPS", "Unresolved Data Migration Dependency",
         "Dependency", "Critical", "Active", "USR-007",
         "PRJ-102 middleware depends on legacy schema cleanup (MLS-05) which is overdue.",
         "RULE-UNRESOLVED-DEPENDENCY: Upstream milestone MLS-05 incomplete near dependent milestone MLS-06 due date.",
         "Deploy senior database administrator to complete automated deduplication scripts within 48 hours.",
         d_minus_1),
        ("RSK-004", "PRJ-104", "DEP-HR", "GDPR Employee Consent Compliance Gap",
         "Schedule", "Medium", "Under Review", "USR-005",
         "Data Privacy Matrix MLS-12 is overdue, delaying talent model validation in compliance with EU regulations.",
         "RULE-OVERDUE-MILESTONE: MLS-12 overdue by 1 day.",
         "Legal counsel scheduled emergency clearance review meeting for tomorrow morning.",
         d_minus_1),
        ("RSK-005", "PRJ-103", "DEP-FIN", "Q4 Regulatory SOX Filing Capacity Constraint",
         "Operational", "Medium", "Active", "USR-004",
         "Parallel execution of ERP integration and SOX automation puts pressure on shared finance personnel.",
         "RULE-CAPACITY-PRESSURE: 2 critical financial milestones assigned to same primary reviewer.",
         "Contract temporary external SOX auditing contractor for 30 calendar days.",
         d_minus_7),
        ("RSK-006", "PRJ-105", "DEP-ENG", "MFA Posture Drift on Legacy Linux Workstations",
         "Operational", "Low", "Mitigated", "USR-006",
         "Older Ubuntu engineering workstations require manual PAM module configuration for Zero Trust compliance.",
         "RULE-POLICY-GAP: Non-standard workstation OS detected in posture audit.",
         "Automated Ansible script pushed to all engineering laptops; 94% compliance verified.",
         d_minus_15)
    ]
    cursor.executemany("INSERT INTO risks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", risks)

    # 8. Dependencies
    dependencies = [
        ("DEP-01", "MLS-06", "MLS-05", "Requires", "Unresolved",
         "Procurement API Middleware Gateway cannot begin integration tests until Legacy Schema Mapping is completed."),
        ("DEP-02", "PRJ-102", "PRJ-101", "Requires", "At Risk",
         "NextGen ERP integration requires the Cloud Native Platform EU Kubernetes cluster for hosting."),
        ("DEP-03", "MLS-13", "MLS-12", "Requires", "Unresolved",
         "Talent Retention Model cannot process employee data until GDPR Consent Matrix is officially signed off."),
        ("DEP-04", "PRJ-105", "PRJ-101", "Related", "Resolved",
         "Zero Trust policy enforcement rules synced with Cloud Platform service mesh.")
    ]
    cursor.executemany("INSERT INTO dependencies VALUES (?, ?, ?, ?, ?, ?)", dependencies)

    # 9. Audit Logs
    audit_logs = [
        ("LOG-001", "WORKSPACE_INITIALIZATION", "SYSTEM", "KORVIX-CORE", "USR-001", "Dr. Sarah Jenkins",
         "System initialized with Enterprise Digital Twin configuration v2.4.", d_minus_15),
        ("LOG-002", "PROJECT_CREATED", "PROJECT", "PRJ-101", "USR-002", "Marcus Vance",
         "Created Project 'Cloud Native Migration Platform' with Critical priority.", d_minus_15),
        ("LOG-003", "RISK_FLAGGED", "RISK", "RSK-002", "SYSTEM", "Automated Risk Engine",
         "Flagged Critical KPI Breach on Order Fulfillment Cycle Time (31.5 hrs).", d_minus_3),
        ("LOG-004", "MILESTONE_UPDATED", "MILESTONE", "MLS-01", "USR-006", "Alex Chen",
         "Marked milestone 'Containerization of Core Ingestion Service' as Completed.", d_minus_7),
        ("LOG-005", "RISK_STATUS_CHANGE", "RISK", "RSK-006", "USR-006", "Alex Chen",
         "Updated risk status to Mitigated following Ansible script patch.", d_minus_7)
    ]
    cursor.executemany("INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?)", audit_logs)

    # 10. Settings
    settings = [
        ("workspace_name", "Korvix Global Enterprise Digital Twin", "Profile", "Primary enterprise organization name"),
        ("fiscal_year", "FY 2026-2027", "Profile", "Current operating fiscal cycle"),
        ("kpi_critical_threshold_percent", "15.0", "KPI", "Variance percentage below target to trigger Critical alert"),
        ("kpi_warning_threshold_percent", "8.0", "KPI", "Variance percentage below target to trigger Warning alert"),
        ("risk_auto_detection", "true", "Risk", "Automatically evaluate operational rules on data mutations"),
        ("data_freshness_threshold_days", "7", "Quality", "Days before un-updated records are flagged stale"),
        ("copilot_mode", "Deterministic Local Demo Mode", "AI", "Active AI processing engine"),
        ("demo_watermark", "true", "Demo", "Display illustrative demo disclaimer across executive reports")
    ]
    cursor.executemany("INSERT INTO settings VALUES (?, ?, ?, ?)", settings)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_demo_data(reset=True)
    print("Database initialized and demo data seeded successfully.")
