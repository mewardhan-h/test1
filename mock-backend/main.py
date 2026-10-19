"""
Mock backend — mimics the real Discovery Platform API for frontend development.
Stores everything in memory (resets on restart).
"""

import secrets
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Discovery Platform Mock")

# Allow the Vite dev server to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Persistent store (JSON file next to main.py) ──────────────────────────────
import json
from pathlib import Path

_DB_FILE = Path(__file__).parent / "mock_db.json"
_lock = threading.Lock()

def _load_db():
    if _DB_FILE.exists():
        try:
            return json.loads(_DB_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"users": {}, "sessions": {}, "workspaces": {}, "logs": {}}

def _save_db():
    tmp = _DB_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(_store, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(_DB_FILE)

_store = _load_db()
_users: dict = _store["users"]
_sessions: dict = _store["sessions"]
_workspaces: dict = _store["workspaces"]
_logs: dict = _store["logs"]

def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def _get_user(token: str) -> dict:
    user_id = _sessions.get(token)
    if not user_id:
        raise HTTPException(401, "Please sign in.")
    user = _users.get(user_id)
    if not user:
        raise HTTPException(401, "Session expired. Please sign in again.")
    return user

def _current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not token:
        raise HTTPException(401, "Please sign in.")
    return _get_user(token)

# ── Auth models ───────────────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    full_name: str
    email: str
    password: str

class LoginIn(BaseModel):
    email: str
    password: str
    remember: bool = False

# ── Auth routes ───────────────────────────────────────────────────────────────
@app.post("/auth/register")
def register(body: RegisterIn):
    email = body.email.strip().lower()
    name = body.full_name.strip()
    if len(name) < 2:
        raise HTTPException(400, "Please enter your full name.")
    if "@" not in email:
        raise HTTPException(400, "Please enter a valid e-mail address.")
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    with _lock:
        if email in _users:
            raise HTTPException(409, "An account with this e-mail address already exists.")
        user_id = str(uuid.uuid4())
        _users[email] = {"id": user_id, "email": email, "full_name": name, "password": body.password}
        token = secrets.token_urlsafe(32)
        _sessions[token] = user_id
        _save_db()
    return {"token": token, "user": {"id": user_id, "email": email, "full_name": name}}

@app.post("/auth/login")
def login(body: LoginIn):
    email = body.email.strip().lower()
    user = _users.get(email)
    if not user or user["password"] != body.password:
        raise HTTPException(401, "Invalid e-mail or password.")
    token = secrets.token_urlsafe(32)
    with _lock:
        _sessions[token] = user["id"]
        _save_db()
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"]}}

@app.post("/auth/logout")
def logout(authorization: Optional[str] = Header(default=None)):
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        _sessions.pop(token, None)
    return {"ok": True}

@app.get("/auth/me")
def me(authorization: Optional[str] = Header(default=None)):
    user = _current_user(authorization)
    return {"user": user}

# ── Tech stack ────────────────────────────────────────────────────────────────
@app.get("/tech-stack")
def tech_stack(authorization: Optional[str] = Header(default=None)):
    _current_user(authorization)
    return {
        "domains": ["Banking", "Retail", "Insurance", "Healthcare", "Telecom", "Other"],
        "tabs": [
            {
                "id": "mainframe",
                "label": "Mainframe",
                "categories": [
                    {
                        "id": "languages",
                        "label": "Languages",
                        "icon": "code",
                        "items": [
                            {"id": "cobol",     "label": "COBOL",     "parser_available": True},
                            {"id": "pli",       "label": "PL/I",      "parser_available": True},
                            {"id": "assembler", "label": "Assembler", "parser_available": True},
                            {"id": "jcl",       "label": "JCL",       "parser_available": True},
                            {"id": "natural",   "label": "Natural",   "parser_available": False},
                            {"id": "rexx",      "label": "REXX",      "parser_available": False},
                            {"id": "clst",      "label": "CL/ST",     "parser_available": False},
                        ],
                    },
                    {
                        "id": "databases",
                        "label": "Databases",
                        "icon": "database",
                        "items": [
                            {"id": "idms",   "label": "IDMS",   "parser_available": True},
                            {"id": "db2",    "label": "DB2",    "parser_available": True},
                            {"id": "imsdb",  "label": "IMS DB", "parser_available": True},
                            {"id": "adabas", "label": "Adabas", "parser_available": False},
                            {"id": "supra",  "label": "Supra",  "parser_available": False},
                            {"id": "vsam",   "label": "VSAM",   "parser_available": True},
                        ],
                    },
                    {
                        "id": "reporting",
                        "label": "Reporting Tools",
                        "icon": "chart",
                        "items": [
                            {"id": "easytrieve", "label": "Easytrieve",     "parser_available": True},
                            {"id": "sas",        "label": "SAS",            "parser_available": True},
                            {"id": "crystal",    "label": "Crystal Reports","parser_available": False},
                            {"id": "focus",      "label": "FOCUS",          "parser_available": False},
                        ],
                    },
                    {
                        "id": "schedulers",
                        "label": "Schedulers",
                        "icon": "clock",
                        "items": [
                            {"id": "ca7",  "label": "CA7",  "parser_available": True},
                            {"id": "tws",  "label": "TWS",  "parser_available": True},
                            {"id": "zebb", "label": "Zebb", "parser_available": False},
                        ],
                    },
                    {
                        "id": "transaction",
                        "label": "Transaction / Online",
                        "icon": "refresh",
                        "items": [
                            {"id": "cics",     "label": "CICS",      "parser_available": True},
                            {"id": "imsdc",    "label": "IMS DC",    "parser_available": True},
                            {"id": "complete", "label": "Com-plete", "parser_available": False},
                        ],
                    },
                    {
                        "id": "messaging",
                        "label": "Messaging & Integration",
                        "icon": "signal",
                        "items": [
                            {"id": "mq",    "label": "MQ",     "parser_available": True},
                            {"id": "kafka", "label": "Kafka",  "parser_available": True},
                            {"id": "ibmmq", "label": "IBM MQ", "parser_available": True},
                        ],
                    },
                ],
            },
            {
                "id": "non_mainframe",
                "label": "Non-Mainframe",
                "categories": [
                    {
                        "id": "languages",
                        "label": "Languages",
                        "icon": "code",
                        "items": [
                            {"id": "java",   "label": "Java",   "parser_available": True},
                            {"id": "dotnet", "label": ".NET",   "parser_available": True},
                            {"id": "python", "label": "Python", "parser_available": True},
                            {"id": "cpp",    "label": "C/C++",  "parser_available": False},
                        ],
                    },
                    {
                        "id": "databases",
                        "label": "Databases",
                        "icon": "database",
                        "items": [
                            {"id": "oracle",  "label": "Oracle",     "parser_available": True},
                            {"id": "mssql",   "label": "SQL Server",  "parser_available": True},
                            {"id": "mysql",   "label": "MySQL",       "parser_available": True},
                            {"id": "postgres","label": "PostgreSQL",  "parser_available": True},
                        ],
                    },
                ],
            },
        ],
    }

# ── Workspace models ──────────────────────────────────────────────────────────
class WorkspaceIn(BaseModel):
    client_name: str
    domain: str
    description: Optional[str] = ""
    tech_stack: List[str]
    info_type: Optional[str] = ""
    info_link: Optional[str] = ""
    notes: Optional[str] = ""

# ── Workspace routes ──────────────────────────────────────────────────────────
@app.get("/workspaces")
def list_workspaces(authorization: Optional[str] = Header(default=None)):
    user = _current_user(authorization)
    result = [w for w in _workspaces.values() if w["user_id"] == user["id"]]
    result.sort(key=lambda w: w["created_at"], reverse=True)
    return {"workspaces": result}

@app.post("/workspaces")
def create_workspace(body: WorkspaceIn, authorization: Optional[str] = Header(default=None)):
    user = _current_user(authorization)
    if not body.client_name.strip():
        raise HTTPException(400, "Client name is required.")
    if not body.tech_stack:
        raise HTTPException(400, "Select at least one technology.")

    year = datetime.now().year
    with _lock:
        n = sum(1 for w in _workspaces.values() if w["user_id"] == user["id"]) + 1
        ws_id = f"WS-{year}-{n:04d}"
        ws = {
            "id": ws_id,
            "user_id": user["id"],
            "client_name": body.client_name.strip(),
            "domain": body.domain,
            "description": (body.description or "").strip(),
            "tech_stack": body.tech_stack,
            "info_type": body.info_type or "",
            "info_link": body.info_link or "",
            "notes": body.notes or "",
            "status": "Created",
            "progress": 0,
            "step": "create",
            "error": None,
            "has_logo": False,
            "created_at": _now(),
            "last_run_at": None,
        }
        _workspaces[ws_id] = ws
        _logs[ws_id] = []
        _save_db()
    return ws

@app.put("/workspaces/{ws_id}/files/{kind}")
async def upload_file(ws_id: str, kind: str, authorization: Optional[str] = Header(default=None)):
    user = _current_user(authorization)
    ws = _workspaces.get(ws_id)
    if not ws or ws["user_id"] != user["id"]:
        raise HTTPException(404, "Workspace not found.")
    if kind == "logo":
        ws["has_logo"] = True
    return {"ok": True, "name": f"{kind}_file", "size": 0, "note": ""}

@app.post("/workspaces/{ws_id}/process", status_code=202)
def process_workspace(ws_id: str, authorization: Optional[str] = Header(default=None)):
    user = _current_user(authorization)
    ws = _workspaces.get(ws_id)
    if not ws or ws["user_id"] != user["id"]:
        raise HTTPException(404, "Workspace not found.")
    if ws["status"] in ("Extracting", "Analysing"):
        raise HTTPException(409, "Already processing.")

    # Run simulated pipeline in background thread
    thread = threading.Thread(target=_simulate_run, args=(ws_id,), daemon=True)
    thread.start()
    return {"ok": True, "id": ws_id}

def _log(ws_id: str, level: str, message: str):
    seq = len(_logs.get(ws_id, [])) + 1
    _logs.setdefault(ws_id, []).append({
        "seq": seq,
        "ts": _now(),
        "level": level,
        "message": message,
    })
    _save_db()

def _simulate_run(ws_id: str):
    """Simulates the pipeline with realistic steps and timing."""
    ws = _workspaces.get(ws_id)
    if not ws:
        return

    steps = [
        ("Extracting", "extract",  5,  "Extracting ZIP archive..."),
        ("Extracting", "extract",  20, "Found 1,240 source files (cobol: 820, jcl: 340, other: 80)"),
        ("Extracting", "extract",  35, "Extraction complete"),
        ("Analysing",  "analyse",  45, "Starting inventory analysis"),
        ("Analysing",  "analyse",  55, "Parsing COBOL programs..."),
        ("Analysing",  "analyse",  65, "Parsing JCL procedures..."),
        ("Analysing",  "analyse",  75, "Building component relationships..."),
        ("Analysing",  "analyse",  85, "Resolving cross-references..."),
        ("Analysing",  "analyse",  92, "Finalising discovery database..."),
        ("Completed",  "finalize", 100,"Analysis complete: 142 components, 820 programs, 1.2M LOC"),
    ]

    ws["status"] = "Extracting"
    ws["progress"] = 0
    _log(ws_id, "INFO", f"Starting discovery for {ws['client_name']} ({ws_id})")

    for status, step, progress, message in steps:
        time.sleep(2)
        ws["status"] = status
        ws["step"] = step
        ws["progress"] = progress
        ws["last_run_at"] = _now()
        _log(ws_id, "INFO", message)

    ws["status"] = "Completed"
    ws["progress"] = 100
    ws["last_run_at"] = _now()
    _log(ws_id, "INFO", "Workspace ready.")

# ── Status & logs ─────────────────────────────────────────────────────────────
STAGES = [
    {"id": "create",   "label": "Create"},
    {"id": "extract",  "label": "Extract"},
    {"id": "prepare",  "label": "Prepare"},
    {"id": "analyse",  "label": "Analyse"},
    {"id": "finalize", "label": "Finalize"},
]

@app.get("/workspaces/{ws_id}/status")
def get_status(ws_id: str, since: int = 0, authorization: Optional[str] = Header(default=None)):
    user = _current_user(authorization)
    ws = _workspaces.get(ws_id)
    if not ws or ws["user_id"] != user["id"]:
        raise HTTPException(404, "Workspace not found.")

    ids = [s["id"] for s in STAGES]
    current = ids.index(ws["step"]) if ws["step"] in ids else -1

    steps = []
    for index, stage in enumerate(STAGES):
        if ws["status"] == "Completed":
            state = "done"
        elif current < 0:
            state = "pending"
        elif index < current:
            state = "done"
        elif index == current:
            state = "failed" if ws["status"] == "Failed" else "active"
        else:
            state = "pending"
        steps.append({"id": stage["id"], "label": stage["label"], "state": state})

    all_logs = _logs.get(ws_id, [])
    new_lines = [l for l in all_logs if l["seq"] > since]
    last_seq = all_logs[-1]["seq"] if all_logs else since

    reply = {
        "status": ws["status"],
        "progress": ws["progress"],
        "step": ws["step"],
        "error": ws.get("error"),
        "steps": steps,
        "log": new_lines,
        "last_seq": last_seq,
    }

    if ws["status"] == "Completed":
        reply["summary"] = {
            "components": 142,
            "programs": 820,
            "loc": "1.2M",
            "loc_total": 1200000,
        }

    return reply

@app.get("/workspaces/{ws_id}")
def get_workspace(ws_id: str, authorization: Optional[str] = Header(default=None)):
    user = _current_user(authorization)
    ws = _workspaces.get(ws_id)
    if not ws or ws["user_id"] != user["id"]:
        raise HTTPException(404, "Workspace not found.")
    return ws

@app.post("/workspaces/{ws_id}/open")
def open_workspace(ws_id: str, authorization: Optional[str] = Header(default=None)):
    user = _current_user(authorization)
    ws = _workspaces.get(ws_id)
    if not ws or ws["user_id"] != user["id"]:
        raise HTTPException(404, "Workspace not found.")
    if ws["status"] != "Completed":
        raise HTTPException(409, "Analysis has not completed yet.")
    return {"ok": True, "workspace": ws, "repointed": [], "rebound": [], "refreshed": [], "warnings": []}

# ── Platform settings (used by frontend on load) ──────────────────────────────
@app.get("/platform/settings")
def platform_settings():
    return {
        "branding": {"platform_name": "Discovery Platform"},
        "ui": {"status_poll_ms": 1500, "list_poll_ms": 3000},
    }
