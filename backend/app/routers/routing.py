import httpx
from fastapi import APIRouter, HTTPException

from .. import config
from ..schemas import RouteRequest

router = APIRouter(prefix="/api", tags=["routing"])

ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
FIELD_MASK = (
    "routes.duration,routes.staticDuration,routes.distanceMeters,"
    "routes.polyline.encodedPolyline,routes.description,routes.routeLabels"
)


def _secs(value: str) -> int:
    return int(float(value.rstrip("s")))


@router.post("/routes")
async def compute_routes(req: RouteRequest):
    """Proxy to the Google Routes API so the server key never reaches the browser."""
    if not config.GOOGLE_ROUTES_API_KEY:
        raise HTTPException(503, "Routing is not configured. Set GOOGLE_ROUTES_API_KEY in backend/.env.")

    def wp(p):
        return {"location": {"latLng": {"latitude": p.lat, "longitude": p.lng}}}

    body = {
        "origin": wp(req.origin),
        "destination": wp(req.destination),
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
        "computeAlternativeRoutes": True,
        "languageCode": "en-US",
        "units": "METRIC",
    }
    headers = {"X-Goog-Api-Key": config.GOOGLE_ROUTES_API_KEY, "X-Goog-FieldMask": FIELD_MASK}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(ROUTES_URL, json=body, headers=headers)
    except httpx.HTTPError:
        raise HTTPException(502, "Could not reach the Google Routes API.")
    if r.status_code != 200:
        try:
            msg = r.json()["error"]["message"]
        except Exception:
            msg = f"HTTP {r.status_code}"
        raise HTTPException(502, f"Google Routes API error: {msg}")

    routes = []
    for rt in r.json().get("routes", []):
        routes.append({
            "duration_sec": _secs(rt["duration"]),
            "static_duration_sec": _secs(rt["staticDuration"]) if "staticDuration" in rt else None,
            "distance_m": rt.get("distanceMeters", 0),
            "description": rt.get("description"),
            "labels": rt.get("routeLabels", []),
            "encoded_polyline": rt["polyline"]["encodedPolyline"],
        })
    if not routes:
        raise HTTPException(404, "No driving route found between these points.")
    return {"routes": routes}
