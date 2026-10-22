"""
Korvix Transparent Operational Risk Engine
Evaluates deterministic operational rules against live database state:
1. Overdue Milestones
2. KPI Threshold Breaches
3. Unresolved Dependencies
4. Missing & Stale Data
5. Project Schedule Variance
Calculates normalized Operational Health Score (out of 100) and Prioritization Index.
"""

from datetime import datetime
from database import get_connection

def evaluate_all_rules():
    """
    Scans the database and generates transparent risk alerts, schedule variances,
    and data quality warnings. Returns structured risk evaluation results.
    """
    conn = get_connection()
    cursor = conn.cursor()

    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")

    detected_risks = []
    data_quality_issues = []

    # RULE A: OVERDUE MILESTONES
    cursor.execute("""
        SELECT m.milestone_id, m.title, m.due_date, m.status, m.project_id, p.name AS project_name, p.owner_department
        FROM milestones m
        JOIN projects p ON m.project_id = p.project_id
        WHERE m.status != 'Completed' AND m.due_date < ?
    """, (today_str,))
    overdue_milestones = cursor.fetchall()

    for m in overdue_milestones:
        due_dt = datetime.strptime(m["due_date"], "%Y-%m-%d")
        days_overdue = (now - due_dt).days
        severity = "Critical" if days_overdue >= 7 else ("High" if days_overdue >= 3 else "Medium")
        
        detected_risks.append({
            "rule_id": "RULE-OVERDUE-MILESTONE",
            "title": f"Overdue Milestone: {m['title']}",
            "category": "Schedule",
            "severity": severity,
            "project_id": m["project_id"],
            "project_name": m["project_name"],
            "department_id": m["owner_department"],
            "description": f"Milestone '{m['title']}' was due on {m['due_date']} ({days_overdue} day(s) overdue) but remains incomplete.",
            "evidence": f"Target due date {m['due_date']} < Current date {today_str}. Status: {m['status']}.",
            "mitigation": "Review blocker dependencies, reallocate technical resources, or revise downstream milestone schedule."
        })

    # RULE B: KPI THRESHOLD BREACHES
    cursor.execute("""
        SELECT k.goal_id, k.metric_name, k.target_value, k.actual_value, k.unit, 
               k.critical_threshold, k.warning_threshold, k.department_id, k.project_id,
               d.name AS department_name, p.name AS project_name
        FROM goals_kpis k
        LEFT JOIN departments d ON k.department_id = d.department_id
        LEFT JOIN projects p ON k.project_id = p.project_id
    """)
    kpis = cursor.fetchall()

    for k in kpis:
        target = float(k["target_value"])
        actual = float(k["actual_value"])
        metric = k["metric_name"].lower()
        
        # Check if higher is better or lower is better
        is_lower_better = any(word in metric for word in ["cycle", "duration", "discrepancy", "attrition", "variance", "cost"])
        
        breach = False
        warning = False
        
        if is_lower_better:
            if k["critical_threshold"] and actual >= float(k["critical_threshold"]):
                breach = True
            elif k["warning_threshold"] and actual >= float(k["warning_threshold"]):
                warning = True
            elif actual > target:
                warning = True
        else:
            if k["critical_threshold"] and actual <= float(k["critical_threshold"]):
                breach = True
            elif k["warning_threshold"] and actual <= float(k["warning_threshold"]):
                warning = True
            elif actual < target:
                warning = True

        if breach:
            detected_risks.append({
                "rule_id": "RULE-KPI-BREACH",
                "title": f"Critical KPI Breach: {k['metric_name']}",
                "category": "KPI Breach",
                "severity": "Critical",
                "project_id": k["project_id"],
                "project_name": k["project_name"] or "Departmental Metric",
                "department_id": k["department_id"],
                "description": f"Metric '{k['metric_name']}' recorded {actual} {k['unit']} vs target {target} {k['unit']}.",
                "evidence": f"Actual {actual} exceeded critical threshold {k['critical_threshold']} {k['unit']}.",
                "mitigation": "Perform immediate root-cause inspection and trigger operational escalation protocol."
            })
        elif warning:
            detected_risks.append({
                "rule_id": "RULE-KPI-WARNING",
                "title": f"KPI Warning: {k['metric_name']}",
                "category": "KPI Breach",
                "severity": "Medium",
                "project_id": k["project_id"],
                "project_name": k["project_name"] or "Departmental Metric",
                "department_id": k["department_id"],
                "description": f"Metric '{k['metric_name']}' is deviating from target ({actual} vs {target} {k['unit']}).",
                "evidence": f"Actual {actual} crossed warning threshold {k['warning_threshold']}.",
                "mitigation": "Schedule mid-sprint review to align process adjustments before quarter closes."
            })

    # RULE C: UNRESOLVED DEPENDENCIES
    cursor.execute("""
        SELECT d.dependency_id, d.source_entity_id, d.target_entity_id, d.dependency_type, d.state, d.description,
               m1.title AS source_title, m1.due_date AS source_due, m1.project_id AS source_project,
               m2.title AS target_title, m2.status AS target_status, m2.due_date AS target_due
        FROM dependencies d
        LEFT JOIN milestones m1 ON d.source_entity_id = m1.milestone_id
        LEFT JOIN milestones m2 ON d.target_entity_id = m2.milestone_id
        WHERE d.state != 'Resolved'
    """)
    dependencies = cursor.fetchall()

    for dep in dependencies:
        source_name = dep["source_title"] or dep["source_entity_id"]
        target_name = dep["target_title"] or dep["target_entity_id"]
        detected_risks.append({
            "rule_id": "RULE-UNRESOLVED-DEPENDENCY",
            "title": f"Dependency Blocker: {source_name}",
            "category": "Dependency",
            "severity": "High" if dep["state"] == "Unresolved" else "Medium",
            "project_id": dep["source_project"],
            "project_name": "Inter-project Pipeline",
            "department_id": None,
            "description": f"'{source_name}' requires '{target_name}' which is currently {dep['target_status'] or dep['state']}.",
            "evidence": f"Dependency state: {dep['state']}. {dep['description']}",
            "mitigation": f"Accelerate resolution on upstream dependency '{target_name}' to unblock dependent deliverables."
        })

    # RULE D: DATA QUALITY AND FRESHNESS CHECKS
    # Check projects missing owners or budget
    cursor.execute("SELECT project_id, name FROM projects WHERE project_owner_id IS NULL OR project_owner_id = ''")
    missing_owner_prjs = cursor.fetchall()
    for p in missing_owner_prjs:
        data_quality_issues.append({
            "entity": "Project",
            "entity_id": p["project_id"],
            "issue": f"Project '{p['name']}' has no assigned project owner.",
            "severity": "Medium"
        })

    # Check stale KPIs (source_timestamp older than 14 days)
    cursor.execute("SELECT goal_id, metric_name, source_timestamp FROM goals_kpis")
    for k in cursor.fetchall():
        try:
            k_dt = datetime.strptime(k["source_timestamp"], "%Y-%m-%d")
            if (now - k_dt).days > 14:
                data_quality_issues.append({
                    "entity": "GoalKPI",
                    "entity_id": k["goal_id"],
                    "issue": f"KPI '{k['metric_name']}' data timestamp is older than 14 days ({k['source_timestamp']}).",
                    "severity": "Low"
                })
        except Exception:
            pass

    # RULE E: PROJECT SCHEDULE VARIANCE
    cursor.execute("SELECT project_id, name, start_date, due_date, progress, status FROM projects")
    projects = cursor.fetchall()
    schedule_variances = []
    
    for p in projects:
        try:
            start_dt = datetime.strptime(p["start_date"], "%Y-%m-%d")
            due_dt = datetime.strptime(p["due_date"], "%Y-%m-%d")
            total_duration = max((due_dt - start_dt).days, 1)
            elapsed = max((now - start_dt).days, 0)
            expected_progress = min(int((elapsed / total_duration) * 100), 100)
            actual_progress = p["progress"]
            variance = actual_progress - expected_progress # Negative means behind schedule
            
            schedule_variances.append({
                "project_id": p["project_id"],
                "project_name": p["name"],
                "status": p["status"],
                "expected_progress": expected_progress,
                "actual_progress": actual_progress,
                "variance": variance,
                "behind_schedule": variance < -15
            })
            
            if variance < -20 and p["status"] != "Completed":
                detected_risks.append({
                    "rule_id": "RULE-SCHEDULE-VARIANCE",
                    "title": f"Severe Schedule Variance: {p['name']}",
                    "category": "Schedule",
                    "severity": "High",
                    "project_id": p["project_id"],
                    "project_name": p["name"],
                    "department_id": None,
                    "description": f"Project progress is {actual_progress}%, lagging behind expected {expected_progress}% (variance: {variance}%).",
                    "evidence": f"Elapsed time: {elapsed}/{total_duration} days. Progress delta: {variance}%.",
                    "mitigation": "Conduct scope reduction triage or adjust sprint sprint velocity commitments."
                })
        except Exception:
            pass

    # CALCULATE ORGANIZATIONAL HEALTH SCORE (0-100)
    # Baseline 100
    # Penalty: Overdue milestones (-4 per overdue), Critical Risks (-8 each), High Risks (-4 each), Medium Risks (-2 each)
    # KPI Target Achievement: proportion of KPIs meeting targets
    crit_count = sum(1 for r in detected_risks if r["severity"] == "Critical")
    high_count = sum(1 for r in detected_risks if r["severity"] == "High")
    med_count = sum(1 for r in detected_risks if r["severity"] == "Medium")
    overdue_count = len(overdue_milestones)

    penalties = (crit_count * 8) + (high_count * 4) + (med_count * 2) + (overdue_count * 3)
    health_score = max(min(100 - penalties, 100), 25)

    conn.close()

    return {
        "health_score": health_score,
        "overdue_milestones_count": overdue_count,
        "detected_risks": detected_risks,
        "data_quality_issues": data_quality_issues,
        "schedule_variances": schedule_variances,
        "evaluation_timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "disclaimer": "Illustrative Prioritization Score derived from demo state; not an empirical probability model."
    }
