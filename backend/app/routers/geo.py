"""
Geocoding Router
좌표 기반 주소 변환 API
"""

import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from ..services.geocoding import get_address_from_coords

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["geo"])

class GeoRequest(BaseModel):
    lat: float
    lon: float

class GeoResponse(BaseModel):
    address: str

@router.post("/geocode", response_model=GeoResponse)
async def geocode_coords(request: Request, body: GeoRequest):
    """위도, 경도 좌표를 주소로 변환합니다."""
    try:
        client = request.app.state.http_client
        address = await get_address_from_coords(client, body.lat, body.lon)
        return GeoResponse(address=address or "알 수 없는 위치")
    except Exception as e:
        logger.error(f"Geocoding API error: {e}")
        raise HTTPException(status_code=500, detail="주소 변환 중 오류가 발생했습니다.")
