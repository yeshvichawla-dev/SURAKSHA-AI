"""Optional Gemini vision integration for road-hazard photo assistance.

Requires GEMINI_API_KEY in backend/.env. The model output is advisory only;
users/admins must verify reports. No severity or hazard is auto-confirmed.
"""
import base64
import json
from typing import Any, Dict
import httpx
from .. import config

PROMPT = """Inspect this road photo for visible road-safety hazards. Return ONLY valid JSON with keys: hazard_detected (boolean), category (one of pothole, damaged_road, waterlogging, accident, road_blockage, construction, traffic_obstruction, other, unknown), severity_suggestion (low, medium, high, critical, unknown), confidence (number 0 to 1), explanation (short string). Do not infer location, cause, or facts not visible. If uncertain, use unknown and low confidence. This is advisory, not an official assessment."""

async def analyze_image(image_bytes: bytes, content_type: str = "image/jpeg") -> Dict[str, Any]:
    if not config.GEMINI_API_KEY:
        return {"available": False, "status": "not_configured", "message": "Add GEMINI_API_KEY to backend/.env to enable optional AI photo assistance.", "predictions": []}
    if not image_bytes or len(image_bytes) > 5 * 1024 * 1024:
        return {"available": False, "status": "invalid_image", "message": "Image is empty or exceeds 5 MB.", "predictions": []}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{config.GEMINI_MODEL}:generateContent?key={config.GEMINI_API_KEY}"
    payload = {"contents": [{"parts": [{"text": PROMPT}, {"inline_data": {"mime_type": content_type, "data": base64.b64encode(image_bytes).decode("ascii")}}]}], "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}}
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        body = response.json()
        raw = body["candidates"][0]["content"]["parts"][0]["text"]
        result = json.loads(raw)
        return {"available": True, "status": "analysis_complete", "message": "AI suggestion generated. Verify it before submitting or acting on the report.", "predictions": [result]}
    except (httpx.HTTPError, KeyError, IndexError, ValueError, json.JSONDecodeError) as exc:
        return {"available": False, "status": "analysis_error", "message": f"AI service could not analyse this image: {type(exc).__name__}. You can still submit the report manually.", "predictions": []}
