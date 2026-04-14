import httpx
import logging
from ..config import get_settings

logger = logging.getLogger(__name__)

async def get_address_from_coords(client: httpx.AsyncClient, lat: float, lon: float) -> str:
    """
    Reverse Geocoding using Google Maps API (Async).
    동(Dong) -> 구(Gu) -> 시(City/Province) 순으로 주소를 추출합니다.
    """
    settings = get_settings()
    api_key = settings.google_cloud_api_key
    
    if not api_key:
        logger.warning("--- [GEO-TRACE] GOOGLE_CLOUD_API_KEY is not set. Reverse geocoding skipped. ---")
        return ""

    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lon}&key={api_key}&language=ko"
    
    try:
        logger.info(f"--- [GEO-TRACE] Requesting reverse geocoding for {lat}, {lon} ---")
        response = await client.get(url)
        data = response.json()
        
        status = data.get("status")
        if status != "OK":
            logger.error(f"--- [GEO-TRACE] API error status: {status}. Message: {data.get('error_message', 'No message')} ---")
            return ""

        if not data.get("results"):
            logger.warning("No results found for these coordinates.")
            return ""

        # 주소 구성 요소 분석
        address_components = data["results"][0]["address_components"]
        
        dong = ""
        gu = ""
        city = ""
        neighborhood = ""

        for comp in address_components:
            types = comp["types"]
            # 동 (Dong) - 여러 레벨 및 neighborhood 확인
            if "sublocality_level_2" in types or "sublocality_level_3" in types:
                dong = comp["long_name"]
            elif "neighborhood" in types:
                neighborhood = comp["long_name"]
            # 구 (Gu)
            elif "sublocality_level_1" in types:
                gu = comp["long_name"]
            # 시 (City)
            elif "locality" in types:
                city = comp["long_name"]
            # 도/광역시 (Province/Admin Area)
            elif "administrative_area_level_1" in types and not city:
                city = comp["long_name"]

        # 우선순위: 동 -> 동네 -> 구 -> 시
        result = dong or neighborhood or gu or city
        logger.info(f"--- [GEO-TRACE] Successfully resolved address: {result} ---")
        return result

    except Exception as e:
        logger.error(f"Error in reverse geocoding: {e}", exc_info=True)
        return ""
