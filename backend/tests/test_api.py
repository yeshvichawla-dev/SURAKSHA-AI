import io
import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["UPLOAD_DIR"] = f"{_tmp}/uploads"
os.environ["ADMIN_TOKEN"] = "test-token"
os.environ["GOOGLE_ROUTES_API_KEY"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
FORM = {"category": "pothole", "description": "Large pothole in left lane", "lat": "28.61", "lng": "77.21", "severity": "high"}
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"


def test_create_validate_and_list():
    bad = client.post("/api/hazards", data={**FORM, "description": "short"})
    assert bad.status_code == 422
    r = client.post("/api/hazards", data=FORM, files={"photo": ("a.png", io.BytesIO(PNG), "image/png")})
    assert r.status_code == 201
    h = r.json()["hazard"]
    assert h["id"].startswith("SR-") and h["verification"] == "unverified" and h["photo_url"]
    assert any(x["id"] == h["id"] for x in client.get("/api/hazards").json())


def test_duplicate_detection_is_flagged():
    first = client.post("/api/hazards", data={**FORM, "lat": "19.0", "lng": "72.8"}).json()["hazard"]
    second = client.post("/api/hazards", data={**FORM, "lat": "19.00010", "lng": "72.80010"}).json()
    assert first["id"] in [d["id"] for d in second["possible_duplicates"]]


def test_rejects_fake_image():
    r = client.post("/api/hazards", data=FORM, files={"photo": ("a.png", io.BytesIO(b"not an image"), "image/png")})
    assert r.status_code == 422


def test_confirm_and_flag():
    hid = client.post("/api/hazards", data={**FORM, "lat": "12.9", "lng": "77.5"}).json()["hazard"]["id"]
    for _ in range(3):
        h = client.post(f"/api/hazards/{hid}/confirm").json()
    assert h["confirmations"] == 3 and h["verification"] == "community_confirmed"
    for _ in range(3):
        h = client.post(f"/api/hazards/{hid}/flag-resolved").json()
    assert h["status"] == "under_review"


def test_admin_requires_token_and_updates():
    assert client.get("/api/admin/stats").status_code == 401
    hdr = {"X-Admin-Token": "test-token"}
    stats = client.get("/api/admin/stats", headers=hdr).json()
    assert stats["total"] >= 1
    hid = client.get("/api/hazards").json()[0]["id"]
    r = client.patch(f"/api/admin/hazards/{hid}", json={"status": "resolved"}, headers=hdr)
    assert r.json()["status"] == "resolved"


def test_routes_unconfigured_and_ai_unavailable():
    assert client.post("/api/routes", json={"origin": {"lat": 1, "lng": 1}, "destination": {"lat": 2, "lng": 2}}).status_code == 503
    r = client.post("/api/ai/analyze-image", files={"photo": ("a.png", io.BytesIO(PNG), "image/png")})
    assert r.json()["available"] is False
