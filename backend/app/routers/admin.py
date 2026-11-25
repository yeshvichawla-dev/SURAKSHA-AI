import hmac
from collections import Counter
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import config
from ..database import get_db
from ..models import Hazard
from ..schemas import AdminUpdate, HazardOut
from datetime import datetime, timezone

SEVERITY_WEIGHT = {"low": 1, "medium": 2, "high": 4, "critical": 8}


def require_admin(x_admin_token: Optional[str] = Header(None)):
    if not config.ADMIN_TOKEN:
        raise HTTPException(503, "Admin is disabled. Set ADMIN_TOKEN in backend/.env and restart the server.")
    if not x_admin_token or not hmac.compare_digest(x_admin_token, config.ADMIN_TOKEN):
        raise HTTPException(401, "Invalid admin token.")


router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/check")
def check():
    return {"ok": True}


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    rows = db.scalars(select(Hazard)).all()
    open_rows = [h for h in rows if h.status != "resolved"]

    # Hotspots: open reports grouped into ~110 m grid cells (3 decimal places).
    cells = Counter((round(h.lat, 3), round(h.lng, 3)) for h in open_rows)
    hotspots = [
        {"lat": k[0], "lng": k[1], "count": v} for k, v in cells.most_common(5) if v >= 2
    ]

    # Rule-based maintenance priority (NOT machine learning).
    queue = sorted(
        open_rows,
        key=lambda h: SEVERITY_WEIGHT.get(h.severity, 1) * (1 + h.confirmations),
        reverse=True,
    )[:10]

    recent = sorted(rows, key=lambda h: h.created_at.replace(tzinfo=None), reverse=True)[:10]
    return {
        "total": len(rows),
        "active": sum(h.status == "active" for h in rows),
        "under_review": sum(h.status == "under_review" for h in rows),
        "resolved": sum(h.status == "resolved" for h in rows),
        "high_severity_open": sum(h.severity in ("high", "critical") for h in open_rows),
        "demo_count": sum(h.is_demo for h in rows),
        "by_category": dict(Counter(h.category for h in rows)),
        "by_severity": dict(Counter(h.severity for h in rows)),
        "hotspots": hotspots,
        "priority_formula": "severity weight (low 1, medium 2, high 4, critical 8) x (1 + confirmations). Rule-based, not AI.",
        "priority_queue": [HazardOut.model_validate(h).model_dump(mode="json") for h in queue],
        "recent": [HazardOut.model_validate(h).model_dump(mode="json") for h in recent],
    }


@router.patch("/hazards/{hazard_id}", response_model=HazardOut)
def update_hazard(hazard_id: str, body: AdminUpdate, db: Session = Depends(get_db)):
    h = db.get(Hazard, hazard_id)
    if not h:
        raise HTTPException(404, "Hazard report not found.")
    if body.status is not None:
        if body.status not in config.STATUSES:
            raise HTTPException(422, "Unknown status.")
        h.status = body.status
    if body.verification is not None:
        if body.verification not in config.VERIFICATIONS:
            raise HTTPException(422, "Unknown verification value.")
        h.verification = body.verification
    if body.severity is not None:
        if body.severity not in config.SEVERITIES:
            raise HTTPException(422, "Unknown severity.")
        h.severity = body.severity
    h.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(h)
    return h
