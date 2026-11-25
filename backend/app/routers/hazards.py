import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import config
from ..database import get_db
from ..geo import haversine_m
from ..models import Hazard
from ..schemas import HazardCreateResult, HazardOut

router = APIRouter(prefix="/api/hazards", tags=["hazards"])

DUPLICATE_RADIUS_M = 50
DUPLICATE_WINDOW_DAYS = 14
CONFIRMATIONS_FOR_COMMUNITY_CONFIRMED = 3
FLAGS_FOR_REVIEW = 3

IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _looks_like_image(data: bytes, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return data[:3] == b"\xff\xd8\xff"
    if content_type == "image/png":
        return data[:8] == b"\x89PNG\r\n\x1a\n"
    if content_type == "image/webp":
        return data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return False


def _get_or_404(db: Session, hazard_id: str) -> Hazard:
    h = db.get(Hazard, hazard_id)
    if not h:
        raise HTTPException(404, "Hazard report not found.")
    return h


@router.get("", response_model=List[HazardOut])
def list_hazards(
    status: str = "active,under_review",
    category: Optional[str] = None,
    limit: int = Query(500, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    statuses = [s for s in status.split(",") if s in config.STATUSES]
    q = select(Hazard).where(Hazard.status.in_(statuses)).order_by(Hazard.created_at.desc()).limit(limit)
    if category:
        q = q.where(Hazard.category == category)
    return db.scalars(q).all()


@router.get("/{hazard_id}", response_model=HazardOut)
def get_hazard(hazard_id: str, db: Session = Depends(get_db)):
    return _get_or_404(db, hazard_id)


@router.post("", response_model=HazardCreateResult, status_code=201)
async def create_hazard(
    category: str = Form(...),
    description: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    severity: str = Form("medium"),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    description = description.strip()
    if category not in config.CATEGORIES:
        raise HTTPException(422, "Unknown hazard category.")
    if severity not in config.SEVERITIES:
        raise HTTPException(422, "Unknown severity level.")
    if not (10 <= len(description) <= 500):
        raise HTTPException(422, "Description must be between 10 and 500 characters.")
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(422, "Location coordinates are out of range.")

    photo_name = None
    if photo is not None and photo.filename:
        ext = IMAGE_TYPES.get(photo.content_type or "")
        if not ext:
            raise HTTPException(422, "Photo must be a JPEG, PNG or WebP image.")
        data = await photo.read(config.MAX_UPLOAD_BYTES + 1)
        if len(data) > config.MAX_UPLOAD_BYTES:
            raise HTTPException(422, "Photo is larger than 5 MB.")
        if not _looks_like_image(data, photo.content_type or ""):
            raise HTTPException(422, "File content does not match an image.")
        os.makedirs(config.UPLOAD_DIR, exist_ok=True)
        photo_name = uuid.uuid4().hex + ext
        with open(os.path.join(config.UPLOAD_DIR, photo_name), "wb") as f:
            f.write(data)

    # Rule-based duplicate check (NOT machine learning): same category, within 50 m, last 14 days.
    since = datetime.now(timezone.utc) - timedelta(days=DUPLICATE_WINDOW_DAYS)
    box = 0.001  # ~110 m pre-filter before the exact distance check
    candidates = db.scalars(
        select(Hazard).where(
            Hazard.category == category,
            Hazard.status != "resolved",
            Hazard.lat.between(lat - box, lat + box),
            Hazard.lng.between(lng - box, lng + box),
        )
    ).all()
    duplicates = []
    for c in candidates:
        created = c.created_at if c.created_at.tzinfo else c.created_at.replace(tzinfo=timezone.utc)
        if created >= since and haversine_m(lat, lng, c.lat, c.lng) <= DUPLICATE_RADIUS_M:
            duplicates.append(c)

    hazard = Hazard(
        category=category, description=description, lat=lat, lng=lng,
        severity=severity, photo_path=photo_name,
    )
    db.add(hazard)
    db.commit()
    db.refresh(hazard)
    return {"hazard": hazard, "possible_duplicates": duplicates}


@router.post("/{hazard_id}/confirm", response_model=HazardOut)
def confirm_hazard(hazard_id: str, db: Session = Depends(get_db)):
    h = _get_or_404(db, hazard_id)
    if h.status == "resolved":
        raise HTTPException(409, "This hazard is marked resolved.")
    h.confirmations += 1
    if h.confirmations >= CONFIRMATIONS_FOR_COMMUNITY_CONFIRMED and h.verification == "unverified":
        h.verification = "community_confirmed"
    h.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(h)
    return h


@router.post("/{hazard_id}/flag-resolved", response_model=HazardOut)
def flag_resolved(hazard_id: str, db: Session = Depends(get_db)):
    h = _get_or_404(db, hazard_id)
    if h.status == "resolved":
        raise HTTPException(409, "This hazard is already marked resolved.")
    h.resolved_flags += 1
    if h.resolved_flags >= FLAGS_FOR_REVIEW and h.status == "active":
        h.status = "under_review"
    h.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(h)
    return h
