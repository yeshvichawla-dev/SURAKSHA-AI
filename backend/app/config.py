import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./suraksha.db")
GOOGLE_ROUTES_API_KEY = os.getenv("GOOGLE_ROUTES_API_KEY", "")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

CATEGORIES = (
    "pothole", "damaged_road", "waterlogging", "accident",
    "road_blockage", "construction", "traffic_obstruction", "other",
)
SEVERITIES = ("low", "medium", "high", "critical")
STATUSES = ("active", "under_review", "resolved")
VERIFICATIONS = ("unverified", "community_confirmed", "authority_verified")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
