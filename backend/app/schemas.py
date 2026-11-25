from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class HazardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category: str
    description: str
    lat: float
    lng: float
    severity: str
    status: str
    verification: str
    photo_url: Optional[str] = None
    confirmations: int
    resolved_flags: int
    is_demo: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def _utc(self, v: datetime) -> str:
        # SQLite returns naive datetimes; they are always stored as UTC.
        return (v if v.tzinfo else v.replace(tzinfo=timezone.utc)).isoformat()


class HazardCreateResult(BaseModel):
    hazard: HazardOut
    possible_duplicates: List[HazardOut]


class AdminUpdate(BaseModel):
    status: Optional[str] = None
    verification: Optional[str] = None
    severity: Optional[str] = None


class LatLng(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class RouteRequest(BaseModel):
    origin: LatLng
    destination: LatLng
