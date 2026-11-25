import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _new_id() -> str:
    return "SR-" + uuid.uuid4().hex[:8].upper()


class Hazard(Base):
    __tablename__ = "hazards"

    id: Mapped[str] = mapped_column(String(16), primary_key=True, default=_new_id)
    category: Mapped[str] = mapped_column(String(32), index=True)
    description: Mapped[str] = mapped_column(Text)
    lat: Mapped[float] = mapped_column(Float, index=True)
    lng: Mapped[float] = mapped_column(Float, index=True)
    severity: Mapped[str] = mapped_column(String(16), default="medium")
    status: Mapped[str] = mapped_column(String(16), default="active", index=True)
    verification: Mapped[str] = mapped_column(String(24), default="unverified")
    photo_path: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    confirmations: Mapped[int] = mapped_column(Integer, default=0)
    resolved_flags: Mapped[int] = mapped_column(Integer, default=0)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    @property
    def photo_url(self) -> Optional[str]:
        return f"/uploads/{self.photo_path}" if self.photo_path else None
