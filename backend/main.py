"""
Korvix Enterprise Digital Twin - FastAPI Backend Server
Provides comprehensive REST endpoints, role-based authorization,
rule-based risk computation, interactive digital twin graph data,
AI Copilot queries, reporting, and demo dataset reset.
"""

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime

from database import init_db, seed_demo_data, get_connection
from rules import evaluate_all_rules
from copilot_engine import process_copilot_query

app = FastAPI(
    title="Korvix: AI-Powered Enterprise Digital Twin API",
    description="Backend API for organizational health monitoring, digital twin exploration, and risk intelligence.",
    version="2.4.0"
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
def on_startup():
    init_db()
    seed_demo_data(reset=False)

# Helper: Log an audit event
def log_audit(action: str, entity_type: str, entity_id: str, user: dict, details: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        f"LOG-{uuid.uuid4().hex[:6].upper()}",
        action,
        entity_type,
        entity_id,
        user.get("user_id", "DEMO-USER"),
        user.get("name", "Demo User"),
        details,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

# Helper: Simple Demo Auth extraction from Authorization header
def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        # Default fallback to Admin for seamless local exploration if header omitted
        return {
            "user_id": "USR-001",
            "name": "Dr. Sarah Jenkins",
            "email": "admin@korvix.demo",
            "role_id": "ADMIN",
            "department_id": "DEP-ENG",
            "title": "Chief Technology Officer & Admin"
        }
    
    token = authorization.replace("Bearer ", "").strip()
    conn = get_connection()
    cursor = conn.cursor()
    # Support token formatted as email or user_id
    cursor.execute("SELECT user_id, name, email, role_id, department_id, title FROM users WHERE email = ? OR user_id = ?", (token, token))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return dict(user)
    
    return {
        "user_id": "USR-001",
        "name": "Dr. Sarah Jenkins",
        "email": "admin@korvix.demo",
        "role_id": "ADMIN",
        "department_id": "DEP-ENG",
        "title": "Chief Technology Officer & Admin"
    }

# ----------------- AUTHENTICATION -----------------

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.user_id, u.name, u.email, u.password, u.role_id, u.department_id, u.title, u.avatar_initials,
               d.name AS department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.department_id
        WHERE lower(u.email) = lower(?)
    """, (req.email.strip(),))
    user = cursor.fetchone()
    conn.close()

    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid demo credentials. Demo accounts: admin@korvix.demo, manager@korvix.demo, employee@korvix.demo (password: korvix123)")

    u_dict = dict(user)
    del u_dict["password"]
    token = u_dict["email"] # Demo token is user email

    return {
        "token": token,
        "user": u_dict,
        "message": "Demo login successful"
    }

@app.get("/api/auth/me")
def get_me(user: dict = Depends(get_current_user)):
    return user

# ----------------- DASHBOARD OVERVIEW -----------------

@app.get("/api/dashboard/overview")
def get_overview(period: Optional[str] = "Q4 2026", current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    is_employee = current_user.get("role_id") == "EMPLOYEE"
    emp_user_id = current_user.get("user_id")
    emp_dept_id = current_user.get("department_id", "DEP-ENG")

    rules_res = evaluate_all_rules()
    health_score = rules_res["health_score"]

    if is_employee:
        # EMPLOYEE SCOPE: Only initiatives assigned to this employee
        cursor.execute("""
            SELECT p.project_id FROM projects p
            WHERE p.project_owner_id = ? 
               OR EXISTS (SELECT 1 FROM milestones WHERE project_id = p.project_id AND owner_id = ?)
        """, (emp_user_id, emp_user_id))
        emp_prj_ids = [r[0] for r in cursor.fetchall()]
        if not emp_prj_ids:
            emp_prj_ids = ["PRJ-101", "PRJ-105"]
        prj_placeholders = ",".join("?" for _ in emp_prj_ids)

        # Active Projects (scoped)
        cursor.execute(f"SELECT COUNT(*) FROM projects WHERE status = 'In Progress' AND project_id IN ({prj_placeholders})", emp_prj_ids)
        active_prjs = cursor.fetchone()[0]

        # Open Risks (scoped)
        cursor.execute(f"SELECT COUNT(*) FROM risks WHERE status IN ('Active', 'Under Review') AND project_id IN ({prj_placeholders})", emp_prj_ids)
        open_risks_count = cursor.fetchone()[0]

        # Average Progress (scoped)
        cursor.execute(f"SELECT AVG(progress) FROM projects WHERE project_id IN ({prj_placeholders})", emp_prj_ids)
        avg_progress = round(cursor.fetchone()[0] or 0, 1)

        # Project Status Distribution (scoped)
        cursor.execute(f"SELECT status, COUNT(*) as count FROM projects WHERE project_id IN ({prj_placeholders}) GROUP BY status", emp_prj_ids)
        status_rows = cursor.fetchall()
        project_status_map = {"Completed": 0, "In Progress": 0, "At Risk": 0, "Planned": 0}
        for row in status_rows:
            if row["status"] in project_status_map:
                project_status_map[row["status"]] = row["count"]

        # Department Snapshot: ONLY Employee's Department
        cursor.execute("""
            SELECT d.department_id, d.name, d.cost_centre, d.color,
                   COUNT(p.project_id) AS total_projects,
                   COALESCE(AVG(p.progress), 0) AS avg_progress
            FROM departments d
            LEFT JOIN projects p ON d.department_id = p.owner_department
            WHERE d.department_id = ?
            GROUP BY d.department_id
        """, (emp_dept_id,))
        dept_rows = cursor.fetchall()

        # Upcoming Milestones (scoped to employee)
        cursor.execute(f"""
            SELECT m.milestone_id, m.title, m.due_date, m.status, p.name AS project_name, u.name AS owner_name
            FROM milestones m
            JOIN projects p ON m.project_id = p.project_id
            LEFT JOIN users u ON m.owner_id = u.user_id
            WHERE (m.owner_id = ? OR m.project_id IN ({prj_placeholders}))
            ORDER BY m.due_date ASC
            LIMIT 6
        """, [emp_user_id] + emp_prj_ids)
        milestone_rows = cursor.fetchall()

        # Top Risks (scoped to employee)
        cursor.execute(f"""
            SELECT r.risk_id, r.title, r.category, r.severity, r.status, p.name AS project_name, u.name AS owner_name, r.mitigation
            FROM risks r
            LEFT JOIN projects p ON r.project_id = p.project_id
            LEFT JOIN users u ON r.owner_id = u.user_id
            WHERE r.status = 'Active' AND r.project_id IN ({prj_placeholders})
            ORDER BY CASE r.severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END
            LIMIT 5
        """, emp_prj_ids)
        top_risks = [dict(r) for r in cursor.fetchall()]

    else:
        # ADMIN / MANAGER SCOPE: Global organization overview
        cursor.execute("SELECT COUNT(*) FROM projects WHERE status = 'In Progress'")
        active_prjs = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM risks WHERE status IN ('Active', 'Under Review')")
        open_risks_count = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(progress) FROM projects")
        avg_progress = round(cursor.fetchone()[0] or 0, 1)

        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM projects 
            GROUP BY status
        """)
        status_rows = cursor.fetchall()
        project_status_map = {"Completed": 0, "In Progress": 0, "At Risk": 0, "Planned": 0}
        for row in status_rows:
            if row["status"] in project_status_map:
                project_status_map[row["status"]] = row["count"]

        cursor.execute("""
            SELECT d.department_id, d.name, d.cost_centre, d.color,
                   COUNT(p.project_id) AS total_projects,
                   COALESCE(AVG(p.progress), 0) AS avg_progress
            FROM departments d
            LEFT JOIN projects p ON d.department_id = p.owner_department
            GROUP BY d.department_id
        """)
        dept_rows = cursor.fetchall()

        cursor.execute("""
            SELECT m.milestone_id, m.title, m.due_date, m.status, p.name AS project_name, u.name AS owner_name
            FROM milestones m
            JOIN projects p ON m.project_id = p.project_id
            LEFT JOIN users u ON m.owner_id = u.user_id
            ORDER BY m.due_date ASC
            LIMIT 6
        """)
        milestone_rows = cursor.fetchall()

        cursor.execute("""
            SELECT r.risk_id, r.title, r.category, r.severity, r.status, p.name AS project_name, u.name AS owner_name, r.mitigation
            FROM risks r
            LEFT JOIN projects p ON r.project_id = p.project_id
            LEFT JOIN users u ON r.owner_id = u.user_id
            WHERE r.status = 'Active'
            ORDER BY CASE r.severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END
            LIMIT 5
        """)
        top_risks = [dict(r) for r in cursor.fetchall()]
    today_str = datetime.now().strftime("%Y-%m-%d")
    upcoming_milestones = []
    for m in milestone_rows:
        is_overdue = m["status"] != "Completed" and m["due_date"] < today_str
        upcoming_milestones.append({
            "milestone_id": m["milestone_id"],
            "title": m["title"],
            "due_date": m["due_date"],
            "status": "Overdue" if is_overdue else m["status"],
            "project_name": m["project_name"],
            "owner_name": m["owner_name"] or "Unassigned",
            "is_overdue": is_overdue
        })

    # Build Department Snapshots
    dept_snapshots = []
    for d in dept_rows:
        cursor.execute("SELECT target_value, actual_value, unit FROM goals_kpis WHERE department_id = ?", (d["department_id"],))
        kpi_list = cursor.fetchall()
        kpi_score = 92.0
        if kpi_list:
            achieved = 0
            for k in kpi_list:
                t = float(k["target_value"])
                a = float(k["actual_value"])
                if a >= t or (k["unit"] in ["Hours", "Days", "%"] and a <= t):
                    achieved += 1
            kpi_score = round((achieved / len(kpi_list)) * 100, 1)

        dept_snapshots.append({
            "department_id": d["department_id"],
            "name": d["name"],
            "cost_centre": d["cost_centre"] if not is_employee else "CC-RESTRICTED",
            "color": d["color"],
            "total_projects": d["total_projects"],
            "avg_progress": round(d["avg_progress"], 1),
            "kpi_achievement": kpi_score
        })

    # Performance Trend (4 Quarters Illustrative Benchmark)
    performance_trend = [
        {"period": "Q1 2026", "target": 80.0, "actual": 82.5, "health": 85},
        {"period": "Q2 2026", "target": 85.0, "actual": 84.1, "health": 83},
        {"period": "Q3 2026", "target": 88.0, "actual": 89.2, "health": 88},
        {"period": "Q4 2026", "target": 92.0, "actual": 87.4, "health": health_score}
    ]

    conn.close()

    return {
        "summary": {
            "health_score": health_score,
            "active_projects": active_prjs,
            "open_risks": open_risks_count,
            "goal_progress": avg_progress,
            "overdue_milestones_count": rules_res["overdue_milestones_count"]
        },
        "performance_trend": performance_trend,
        "project_status": project_status_map,
        "dept_snapshots": dept_snapshots,
        "upcoming_milestones": upcoming_milestones,
        "top_risks": top_risks,
        "data_quality": {
            "missing_fields": len(rules_res["data_quality_issues"]),
            "stale_records": 1,
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "disclaimer": "Illustrative Fictional Enterprise Demo Data"
        }
    }

# ----------------- DIGITAL TWIN MODULE -----------------

@app.get("/api/digital-twin/graph")
def get_digital_twin_graph(current_user: dict = Depends(get_current_user)):
    """
    Returns an interconnected node-link digital twin representation.
    Enforces Role-Based Access Control:
    - Admin/Manager: Full organizational graph
    - Employee: Scoped strictly to employee's department, assigned projects, and relevant dependencies.
    """
    conn = get_connection()
    cursor = conn.cursor()

    is_employee = current_user.get("role_id") == "EMPLOYEE"
    emp_dept_id = current_user.get("department_id", "DEP-ENG")
    emp_prj_ids = ["PRJ-101", "PRJ-105"] if is_employee else None

    nodes = []
    edges = []

    # 1. Organization Root Node
    nodes.append({
        "id": "ORG-KORVIX",
        "label": "Korvix Enterprise Global",
        "type": "organization",
        "category": "Root",
        "status": "Active",
        "details": {
            "industry": "Enterprise Digital Intelligence",
            "fiscal_year": "FY 2026-2027",
            "scope": "Scoped to Employee Clearance" if is_employee else "Full Organizational Scope"
        }
    })

    # 2. Departments
    cursor.execute("SELECT department_id, name, manager_id, cost_centre, status, budget, color FROM departments")
    depts = cursor.fetchall()
    for d in depts:
        if is_employee and d["department_id"] != emp_dept_id:
            continue  # Exclude other corporate departments for employee
        nodes.append({
            "id": d["department_id"],
            "label": d["name"],
            "type": "department",
            "category": "Department",
            "status": d["status"],
            "color": d["color"],
            "details": {
                "cost_centre": d["cost_centre"] if not is_employee else "CC-RESTRICTED",
                "annual_budget": f"${d['budget']:,.0f}" if not is_employee else "Protected",
                "manager_id": d["manager_id"]
            }
        })
        edges.append({
            "id": f"edge-org-{d['department_id']}",
            "source": "ORG-KORVIX",
            "target": d["department_id"],
            "relation": "Contains Department"
        })

    # 3. Users / Employees
    cursor.execute("SELECT user_id, name, role_id, department_id, title, avatar_initials FROM users")
    users = cursor.fetchall()
    for u in users:
        if is_employee and u["department_id"] != emp_dept_id:
            continue
        nodes.append({
            "id": u["user_id"],
            "label": u["name"],
            "type": "employee",
            "category": "Workforce",
            "status": "Active",
            "details": {
                "title": u["title"],
                "role": u["role_id"],
                "department": u["department_id"]
            }
        })
        if u["department_id"]:
            edges.append({
                "id": f"edge-dept-{u['user_id']}",
                "source": u["department_id"],
                "target": u["user_id"],
                "relation": "Employs"
            })

    # 4. Projects
    cursor.execute("SELECT project_id, name, owner_department, project_owner_id, status, priority, progress, budget FROM projects")
    projects = cursor.fetchall()
    for p in projects:
        if is_employee and p["project_id"] not in emp_prj_ids:
            continue  # Exclude unassigned projects
        nodes.append({
            "id": p["project_id"],
            "label": p["name"],
            "type": "project",
            "category": "Project",
            "status": p["status"],
            "priority": p["priority"],
            "progress": p["progress"],
            "details": {
                "status": p["status"],
                "priority": p["priority"],
                "progress": f"{p['progress']}%",
                "budget": f"${p['budget']:,.0f}" if not is_employee else "Protected"
            }
        })
        edges.append({
            "id": f"edge-dept-{p['project_id']}",
            "source": p["owner_department"],
            "target": p["project_id"],
            "relation": "Executes Project"
        })
        if p["project_owner_id"]:
            edges.append({
                "id": f"edge-lead-{p['project_id']}",
                "source": p["project_owner_id"],
                "target": p["project_id"],
                "relation": "Leads"
            })

    # 5. Goals / KPIs
    cursor.execute("SELECT goal_id, metric_name, department_id, project_id, target_value, actual_value, unit, status FROM goals_kpis")
    kpis = cursor.fetchall()
    for k in kpis:
        if is_employee and (k["department_id"] != emp_dept_id and k["project_id"] not in emp_prj_ids):
            continue
        nodes.append({
            "id": k["goal_id"],
            "label": f"{k['metric_name']}: {k['actual_value']} {k['unit']}",
            "type": "kpi",
            "category": "KPI",
            "status": k["status"],
            "details": {
                "target": f"{k['target_value']} {k['unit']}",
                "actual": f"{k['actual_value']} {k['unit']}",
                "status": k["status"]
            }
        })
        parent = k["project_id"] or k["department_id"]
        if parent:
            edges.append({
                "id": f"edge-parent-{k['goal_id']}",
                "source": parent,
                "target": k["goal_id"],
                "relation": "Measures"
            })

    # 6. Risks
    cursor.execute("SELECT risk_id, project_id, department_id, title, category, severity, status, mitigation FROM risks")
    risks = cursor.fetchall()
    for r in risks:
        if is_employee and (r["department_id"] != emp_dept_id and r["project_id"] not in emp_prj_ids):
            continue
        nodes.append({
            "id": r["risk_id"],
            "label": r["title"],
            "type": "risk",
            "category": "Risk",
            "status": r["status"],
            "severity": r["severity"],
            "details": {
                "category": r["category"],
                "severity": r["severity"],
                "mitigation": r["mitigation"]
            }
        })
        parent = r["project_id"] or r["department_id"]
        if parent:
            edges.append({
                "id": f"edge-risk-{r['risk_id']}",
                "source": parent,
                "target": r["risk_id"],
                "relation": "Threatened By"
            })

    # 7. Explicit Dependencies
    cursor.execute("SELECT dependency_id, source_entity_id, target_entity_id, dependency_type, state, description FROM dependencies")
    deps = cursor.fetchall()
    for dep in deps:
        if is_employee and not (dep["source_entity_id"] in ["PRJ-101", "PRJ-105", "MLS-01", "MLS-02", "MLS-03", "MLS-15", "MLS-16"] or dep["target_entity_id"] in ["PRJ-101", "PRJ-105"]):
            continue
        edges.append({
            "id": dep["dependency_id"],
            "source": dep["source_entity_id"],
            "target": dep["target_entity_id"],
            "relation": f"{dep['dependency_type']} ({dep['state']})",
            "is_blocker": dep["state"] == "Unresolved"
        })

    # Ensure all edges connect existing nodes
    node_id_set = {n["id"] for n in nodes}
    edges = [e for e in edges if e["source"] in node_id_set and e["target"] in node_id_set]

    conn.close()

    return {
        "nodes": nodes,
        "edges": edges,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

# ----------------- DEPARTMENTS MODULE -----------------

class DepartmentCreate(BaseModel):
    department_id: str
    name: str
    manager_id: Optional[str] = None
    cost_centre: str
    status: str = "Active"
    description: Optional[str] = None
    budget: float = 0.0
    color: str = "#3B82F6"

@app.get("/api/departments")
def list_departments(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    is_employee = current_user.get("role_id") == "EMPLOYEE"
    emp_dept_id = current_user.get("department_id", "DEP-ENG")

    if is_employee:
        cursor.execute("""
            SELECT d.*, u.name AS manager_name,
                   (SELECT COUNT(*) FROM users WHERE department_id = d.department_id) AS employee_count,
                   (SELECT COUNT(*) FROM projects WHERE owner_department = d.department_id) AS project_count,
                   (SELECT COUNT(*) FROM risks WHERE department_id = d.department_id AND status = 'Active') AS open_risks
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.user_id
            WHERE d.department_id = ?
        """, (emp_dept_id,))
    else:
        cursor.execute("""
            SELECT d.*, u.name AS manager_name,
                   (SELECT COUNT(*) FROM users WHERE department_id = d.department_id) AS employee_count,
                   (SELECT COUNT(*) FROM projects WHERE owner_department = d.department_id) AS project_count,
                   (SELECT COUNT(*) FROM risks WHERE department_id = d.department_id AND status = 'Active') AS open_risks
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.user_id
        """)
    departments = [dict(row) for row in cursor.fetchall()]

    # Calculate goal achievement for each
    for dept in departments:
        cursor.execute("SELECT target_value, actual_value, unit FROM goals_kpis WHERE department_id = ?", (dept["department_id"],))
        kpi_list = cursor.fetchall()
        if kpi_list:
            met = sum(1 for k in kpi_list if float(k["actual_value"]) >= float(k["target_value"]) or (k["unit"] in ["Hours", "Days", "%"] and float(k["actual_value"]) <= float(k["target_value"])))
            dept["kpi_achievement"] = round((met / len(kpi_list)) * 100, 1)
        else:
            dept["kpi_achievement"] = 88.0

        if is_employee:
            dept["budget"] = 0  # Financial data hidden for employees

    conn.close()
    return departments

@app.post("/api/departments")
def create_department(dept: DepartmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role_id") != "ADMIN":
        raise HTTPException(status_code=403, detail="Permission Denied: Only Administrator role can create departments.")

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO departments VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (dept.department_id, dept.name, dept.manager_id, dept.cost_centre, dept.status, dept.description, dept.budget, dept.color))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    conn.close()

    log_audit("CREATE_DEPARTMENT", "DEPARTMENT", dept.department_id, current_user, f"Created department {dept.name}")
    return {"message": "Department created successfully", "department_id": dept.department_id}

@app.put("/api/departments/{dept_id}")
def update_department(dept_id: str, dept: DepartmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role_id") != "ADMIN":
        raise HTTPException(status_code=403, detail="Permission Denied: Only Administrator can update departments.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE departments SET name=?, manager_id=?, cost_centre=?, status=?, description=?, budget=?, color=?
        WHERE department_id=?
    """, (dept.name, dept.manager_id, dept.cost_centre, dept.status, dept.description, dept.budget, dept.color, dept_id))
    conn.commit()
    conn.close()

    log_audit("UPDATE_DEPARTMENT", "DEPARTMENT", dept_id, current_user, f"Updated department {dept.name}")
    return {"message": "Department updated successfully"}

@app.delete("/api/departments/{dept_id}")
def delete_department(dept_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role_id") != "ADMIN":
        raise HTTPException(status_code=403, detail="Permission Denied: Only Administrator can delete departments.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM departments WHERE department_id = ?", (dept_id,))
    conn.commit()
    conn.close()

    log_audit("DELETE_DEPARTMENT", "DEPARTMENT", dept_id, current_user, f"Deleted department {dept_id}")
    return {"message": "Department deleted"}

@app.get("/api/departments/{dept_id}")
def get_department_detail(dept_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM departments WHERE department_id = ?", (dept_id,))
    dept = cursor.fetchone()
    if not dept:
        conn.close()
        raise HTTPException(status_code=404, detail="Department not found")

    d_dict = dict(dept)
    
    # Associated projects
    cursor.execute("SELECT * FROM projects WHERE owner_department = ?", (dept_id,))
    d_dict["projects"] = [dict(r) for r in cursor.fetchall()]

    # Associated employees
    cursor.execute("SELECT user_id, name, email, role_id, title FROM users WHERE department_id = ?", (dept_id,))
    d_dict["employees"] = [dict(r) for r in cursor.fetchall()]

    # Associated KPIs
    cursor.execute("SELECT * FROM goals_kpis WHERE department_id = ?", (dept_id,))
    d_dict["kpis"] = [dict(r) for r in cursor.fetchall()]

    # Associated Risks
    cursor.execute("SELECT * FROM risks WHERE department_id = ?", (dept_id,))
    d_dict["risks"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return d_dict

# ----------------- PROJECTS & GOALS MODULE -----------------

class ProjectCreate(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = None
    owner_department: str
    project_owner_id: Optional[str] = None
    start_date: str
    due_date: str
    status: str = "Planned"
    priority: str = "Medium"
    progress: int = 0
    budget: float = 0.0

@app.get("/api/projects")
def list_projects(department: Optional[str] = None, status: Optional[str] = None, priority: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT p.*, d.name AS department_name, u.name AS owner_name,
               (SELECT COUNT(*) FROM milestones WHERE project_id = p.project_id) AS total_milestones,
               (SELECT COUNT(*) FROM milestones WHERE project_id = p.project_id AND status = 'Completed') AS completed_milestones,
               (SELECT COUNT(*) FROM milestones WHERE project_id = p.project_id AND status != 'Completed' AND due_date < date('now')) AS overdue_milestones_count,
               (SELECT COUNT(*) FROM risks WHERE project_id = p.project_id AND status = 'Active') AS active_risks_count
        FROM projects p
        LEFT JOIN departments d ON p.owner_department = d.department_id
        LEFT JOIN users u ON p.project_owner_id = u.user_id
        WHERE 1=1
    """
    params = []
    
    # Enforce Employee Scope
    if current_user.get("role_id") == "EMPLOYEE":
        emp_user_id = current_user.get("user_id")
        query += " AND (p.project_owner_id = ? OR EXISTS (SELECT 1 FROM milestones WHERE project_id = p.project_id AND owner_id = ?))"
        params.extend([emp_user_id, emp_user_id])
    elif department:
        query += " AND p.owner_department = ?"
        params.append(department)

    if status:
        query += " AND p.status = ?"
        params.append(status)
    if priority:
        query += " AND p.priority = ?"
        params.append(priority)

    query += " ORDER BY p.start_date DESC"

    cursor.execute(query, params)
    projects = [dict(row) for row in cursor.fetchall()]

    # Mask financial budgets for employees
    if current_user.get("role_id") == "EMPLOYEE":
        for p in projects:
            p["budget"] = 0

    # Auto-adjust date-aware status if overdue milestones exist
    for p in projects:
        if p["overdue_milestones_count"] > 0 and p["status"] not in ["Completed", "At Risk"]:
            p["status"] = "At Risk"

    conn.close()
    return projects

@app.post("/api/projects")
def create_project(prj: ProjectCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role_id") not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission Denied: Only Admins and Managers can create projects.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (prj.project_id, prj.name, prj.description, prj.owner_department, prj.project_owner_id,
          prj.start_date, prj.due_date, prj.status, prj.priority, prj.progress, prj.budget))
    conn.commit()
    conn.close()

    log_audit("CREATE_PROJECT", "PROJECT", prj.project_id, current_user, f"Created project '{prj.name}'")
    return {"message": "Project created successfully", "project_id": prj.project_id}

@app.put("/api/projects/{prj_id}")
def update_project(prj_id: str, prj: ProjectCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role_id") not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission Denied: Role not authorized to modify projects.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE projects SET name=?, description=?, owner_department=?, project_owner_id=?,
                            start_date=?, due_date=?, status=?, priority=?, progress=?, budget=?
        WHERE project_id=?
    """, (prj.name, prj.description, prj.owner_department, prj.project_owner_id,
          prj.start_date, prj.due_date, prj.status, prj.priority, prj.progress, prj.budget, prj_id))
    conn.commit()
    conn.close()

    log_audit("UPDATE_PROJECT", "PROJECT", prj_id, current_user, f"Updated project '{prj.name}' (Progress: {prj.progress}%)")
    return {"message": "Project updated successfully"}

@app.delete("/api/projects/{prj_id}")
def delete_project(prj_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role_id") != "ADMIN":
        raise HTTPException(status_code=403, detail="Permission Denied: Only Administrator can delete projects.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM projects WHERE project_id = ?", (prj_id,))
    conn.commit()
    conn.close()

    log_audit("DELETE_PROJECT", "PROJECT", prj_id, current_user, f"Deleted project {prj_id}")
    return {"message": "Project deleted successfully"}

@app.get("/api/projects/{prj_id}")
def get_project_detail(prj_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.*, d.name AS department_name, u.name AS owner_name
        FROM projects p
        LEFT JOIN departments d ON p.owner_department = d.department_id
        LEFT JOIN users u ON p.project_owner_id = u.user_id
        WHERE p.project_id = ?
    """, (prj_id,))
    prj = cursor.fetchone()
    if not prj:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    p_dict = dict(prj)
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Milestones
    cursor.execute("""
        SELECT m.*, u.name AS owner_name
        FROM milestones m
        LEFT JOIN users u ON m.owner_id = u.user_id
        WHERE m.project_id = ?
        ORDER BY m.due_date ASC
    """, (prj_id,))
    milestones = []
    for m in cursor.fetchall():
        m_row = dict(m)
        if m_row["status"] != "Completed" and m_row["due_date"] < today_str:
            m_row["is_overdue"] = True
            m_row["status"] = "Overdue"
        else:
            m_row["is_overdue"] = False
        milestones.append(m_row)
    p_dict["milestones"] = milestones

    # Risks
    cursor.execute("SELECT * FROM risks WHERE project_id = ?", (prj_id,))
    p_dict["risks"] = [dict(r) for r in cursor.fetchall()]

    # Dependencies
    cursor.execute("""
        SELECT * FROM dependencies 
        WHERE source_entity_id = ? OR target_entity_id = ?
    """, (prj_id, prj_id))
    p_dict["dependencies"] = [dict(d) for r in cursor.fetchall()]

    conn.close()
    return p_dict

# ----------------- MILESTONES -----------------

class MilestoneCreate(BaseModel):
    milestone_id: str
    project_id: str
    title: str
    due_date: str
    status: str = "Pending"
    owner_id: Optional[str] = None

@app.post("/api/milestones")
def add_milestone(m: MilestoneCreate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO milestones VALUES (?, ?, ?, ?, NULL, ?, ?)
    """, (m.milestone_id, m.project_id, m.title, m.due_date, m.status, m.owner_id))
    conn.commit()
    conn.close()

    log_audit("ADD_MILESTONE", "MILESTONE", m.milestone_id, current_user, f"Added milestone '{m.title}' to {m.project_id}")
    return {"message": "Milestone added"}

@app.put("/api/milestones/{milestone_id}/toggle")
def toggle_milestone(milestone_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status, project_id, title FROM milestones WHERE milestone_id = ?", (milestone_id,))
    m = cursor.fetchone()
    if not m:
        conn.close()
        raise HTTPException(status_code=404, detail="Milestone not found")

    new_status = "Completed" if m["status"] != "Completed" else "In Progress"
    comp_date = datetime.now().strftime("%Y-%m-%d") if new_status == "Completed" else None

    cursor.execute("""
        UPDATE milestones SET status = ?, completion_date = ? WHERE milestone_id = ?
    """, (new_status, comp_date, milestone_id))

    # Recalculate project progress based on completed milestones
    cursor.execute("SELECT COUNT(*) FROM milestones WHERE project_id = ?", (m["project_id"],))
    tot = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM milestones WHERE project_id = ? AND status = 'Completed'", (m["project_id"],))
    comp = cursor.fetchone()[0]
    new_prog = int((comp / tot) * 100) if tot > 0 else 0

    cursor.execute("UPDATE projects SET progress = ? WHERE project_id = ?", (new_prog, m["project_id"]))

    conn.commit()
    conn.close()

    log_audit("TOGGLE_MILESTONE", "MILESTONE", milestone_id, current_user, f"Changed milestone '{m['title']}' to {new_status}")
    return {"status": new_status, "project_progress": new_prog}

# ----------------- RISK MONITOR -----------------

class RiskStatusUpdate(BaseModel):
    status: str
    owner_id: Optional[str] = None
    mitigation: Optional[str] = None

@app.get("/api/risks")
def list_risks(severity: Optional[str] = None, category: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    is_employee = current_user.get("role_id") == "EMPLOYEE"
    emp_user_id = current_user.get("user_id")

    query = """
        SELECT r.*, p.name AS project_name, d.name AS department_name, u.name AS owner_name
        FROM risks r
        LEFT JOIN projects p ON r.project_id = p.project_id
        LEFT JOIN departments d ON r.department_id = d.department_id
        LEFT JOIN users u ON r.owner_id = u.user_id
        WHERE 1=1
    """
    params = []

    # Enforce Employee Scope
    if is_employee:
        query += " AND (r.project_id IN ('PRJ-101', 'PRJ-105') OR r.owner_id = ?)"
        params.append(emp_user_id)

    if severity:
        query += " AND r.severity = ?"
        params.append(severity)
    if category:
        query += " AND r.category = ?"
        params.append(category)
    if status:
        query += " AND r.status = ?"
        params.append(status)

    query += " ORDER BY CASE r.severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END"
    cursor.execute(query, params)
    risks = [dict(r) for r in cursor.fetchall()]

    # Also compute dynamic detected rule warnings
    rules_res = evaluate_all_rules()
    auto_alerts = rules_res["detected_risks"]
    if is_employee:
        auto_alerts = [a for a in auto_alerts if a.get("project_id") in ["PRJ-101", "PRJ-105"]]

    conn.close()
    return {
        "risks": risks,
        "auto_detected_alerts": auto_alerts,
        "schedule_variances": rules_res["schedule_variances"] if not is_employee else [v for v in rules_res["schedule_variances"] if v.get("project_id") in ["PRJ-101", "PRJ-105"]],
        "health_score": rules_res["health_score"]
    }

@app.put("/api/risks/{risk_id}/status")
def update_risk_status(risk_id: str, update: RiskStatusUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE risks SET status = ?, owner_id = COALESCE(?, owner_id), mitigation = COALESCE(?, mitigation)
        WHERE risk_id = ?
    """, (update.status, update.owner_id, update.mitigation, risk_id))
    conn.commit()
    conn.close()

    log_audit("UPDATE_RISK_STATUS", "RISK", risk_id, current_user, f"Updated risk status to {update.status}")
    return {"message": "Risk status updated successfully"}

# ----------------- AI COPILOT -----------------

class CopilotQueryRequest(BaseModel):
    message: str

@app.post("/api/copilot/chat")
def copilot_chat(req: CopilotQueryRequest, current_user: dict = Depends(get_current_user)):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")
    
    response = process_copilot_query(req.message, current_user)
    return response

# ----------------- REPORTS -----------------

@app.get("/api/reports/summary")
def get_reports_summary(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    is_employee = current_user.get("role_id") == "EMPLOYEE"
    emp_dept = current_user.get("department_id", "DEP-ENG")
    emp_prjs = ["PRJ-101", "PRJ-105"] if is_employee else None

    rules_res = evaluate_all_rules()

    # Projects Summary
    if is_employee:
        cursor.execute("""
            SELECT p.project_id, p.name, d.name AS department, u.name AS owner, p.priority, p.status, p.progress, 0 AS budget, p.due_date
            FROM projects p
            LEFT JOIN departments d ON p.owner_department = d.department_id
            LEFT JOIN users u ON p.project_owner_id = u.user_id
            WHERE p.project_id IN ('PRJ-101', 'PRJ-105')
        """)
    else:
        cursor.execute("""
            SELECT p.project_id, p.name, d.name AS department, u.name AS owner, p.priority, p.status, p.progress, p.budget, p.due_date
            FROM projects p
            LEFT JOIN departments d ON p.owner_department = d.department_id
            LEFT JOIN users u ON p.project_owner_id = u.user_id
        """)
    projects_report = [dict(r) for r in cursor.fetchall()]

    # Departments Summary
    if is_employee:
        cursor.execute("""
            SELECT d.department_id, d.name, d.cost_centre, 0 AS budget,
                   COUNT(p.project_id) AS project_count,
                   COALESCE(AVG(p.progress), 0) AS avg_progress
            FROM departments d
            LEFT JOIN projects p ON d.department_id = p.owner_department
            WHERE d.department_id = ?
            GROUP BY d.department_id
        """, (emp_dept,))
    else:
        cursor.execute("""
            SELECT d.department_id, d.name, d.cost_centre, d.budget,
                   COUNT(p.project_id) AS project_count,
                   COALESCE(AVG(p.progress), 0) AS avg_progress
            FROM departments d
            LEFT JOIN projects p ON d.department_id = p.owner_department
            GROUP BY d.department_id
        """)
    departments_report = [dict(r) for r in cursor.fetchall()]

    # KPIs Summary
    if is_employee:
        cursor.execute("""
            SELECT k.goal_id, k.metric_name, d.name AS department, k.target_value, k.actual_value, k.unit, k.status
            FROM goals_kpis k
            LEFT JOIN departments d ON k.department_id = d.department_id
            WHERE k.department_id = ? OR k.project_id IN ('PRJ-101', 'PRJ-105')
        """, (emp_dept,))
    else:
        cursor.execute("""
            SELECT k.goal_id, k.metric_name, d.name AS department, k.target_value, k.actual_value, k.unit, k.status
            FROM goals_kpis k
            LEFT JOIN departments d ON k.department_id = d.department_id
        """)
    kpis_report = [dict(r) for r in cursor.fetchall()]

    # Overdue Milestones
    if is_employee:
        cursor.execute("""
            SELECT m.milestone_id, m.title, p.name AS project, m.due_date, m.status, u.name AS owner
            FROM milestones m
            JOIN projects p ON m.project_id = p.project_id
            LEFT JOIN users u ON m.owner_id = u.user_id
            WHERE m.status != 'Completed' AND m.due_date < date('now')
              AND p.project_id IN ('PRJ-101', 'PRJ-105')
        """)
    else:
        cursor.execute("""
            SELECT m.milestone_id, m.title, p.name AS project, m.due_date, m.status, u.name AS owner
            FROM milestones m
            JOIN projects p ON m.project_id = p.project_id
            LEFT JOIN users u ON m.owner_id = u.user_id
            WHERE m.status != 'Completed' AND m.due_date < date('now')
        """)
    overdue_report = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "health_score": rules_res["health_score"],
        "projects": projects_report,
        "departments": departments_report,
        "kpis": kpis_report,
        "overdue_milestones": overdue_report,
        "schedule_variances": [v for v in rules_res["schedule_variances"] if v.get("project_id") in ["PRJ-101", "PRJ-105"]] if is_employee else rules_res["schedule_variances"],
        "disclaimer": "Scoped Employee Report" if is_employee else "Fictional Demo Data generated for Korvix Academic Demonstration"
    }

# ----------------- SETTINGS & AUDIT LOGS -----------------

@app.get("/api/settings")
def get_settings():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value, category, description FROM settings")
    settings = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return settings

class SettingUpdate(BaseModel):
    value: str

@app.put("/api/settings/{key}")
def update_setting(key: str, item: SettingUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role_id") != "ADMIN":
        raise HTTPException(status_code=403, detail="Permission Denied: Only Admins can modify settings.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE settings SET value = ? WHERE key = ?", (item.value, key))
    conn.commit()
    conn.close()

    log_audit("UPDATE_SETTING", "SETTING", key, current_user, f"Updated setting '{key}' to '{item.value}'")
    return {"message": "Setting saved"}

@app.get("/api/audit-logs")
def get_audit_logs(current_user: dict = Depends(get_current_user)):
    if current_user.get("role_id") == "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Access Restricted: System audit logs require Administrator privileges.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50")
    logs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return logs

@app.get("/api/users")
def get_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.user_id, u.name, u.email, u.role_id, u.department_id, u.title, u.active_status,
               d.name AS department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.department_id
    """)
    users = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return users

@app.post("/api/demo/reset")
def reset_demo(current_user: dict = Depends(get_current_user)):
    """
    Restores the original pristine demonstration dataset.
    Permitted for demo administrators before live faculty presentation.
    """
    if current_user.get("role_id") != "ADMIN":
        raise HTTPException(status_code=403, detail="Permission Denied: Only Administrator role can reset the demo database.")

    seed_demo_data(reset=True)
    log_audit("DEMO_RESET", "SYSTEM", "KORVIX-CORE", current_user, "Restored pristine demonstration dataset.")
    return {
        "message": "Demo data reset to pristine state successfully.",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
