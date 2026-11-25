from fastapi import APIRouter, File, HTTPException, UploadFile
from ..ai.classifier import analyze_image

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/analyze-image")
async def analyze(photo: UploadFile = File(...)):
    if photo.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Use a JPEG, PNG or WebP image.")
    data = await photo.read(5 * 1024 * 1024 + 1)
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be under 5 MB.")
    return await analyze_image(data, photo.content_type or "image/jpeg")
