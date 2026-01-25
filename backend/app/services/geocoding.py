import requests
import logging
from ..config import get_settings

logger = logging.getLogger(__name__)

def get_address_from_coords(lat: float, lon: float) -> str:
    """
    Reverse Geocoding using Google Maps API.
    동(Dong) -> 구(Gu) -> 시(City/Province) 순으로 주소를 추출합니다.
    """
    settings = get_settings()
    api_key = settings.google_cloud_api_key
    
    if not api_key:
        logger.warning("GOOGLE_CLOUD_API_KEY is not set. Skipping geocoding.")
        return ""

    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lon}&key={api_key}&language=ko"
    
    try:
        logger.info(f"Requesting reverse geocoding for {lat}, {lon}")
        response = requests.get(url)
        data = response.json()
        
        status = data.get("status")
        if status != "OK":
            logger.error(f"Geocoding API error status: {status}. Error Message: {data.get('error_message', 'No message')}")
            return ""

        if not data.get("results"):
            logger.warning("No results found for these coordinates.")
            return ""

        # 주소 구성 요소 분석
        address_components = data["results"][0]["address_components"]
        
        dong = ""
        gu = ""
        city = ""

        for comp in address_components:
            types = comp["types"]
            if "sublocality_level_2" in types:
                dong = comp["long_name"]
            elif "sublocality_level_1" in types:
                gu = comp["long_name"]
            elif "locality" in types:
                city = comp["long_name"]
            elif "administrative_area_level_1" in types and not city:
                city = comp["long_name"]

        result = dong or gu or city
        logger.info(f"Successfully resolved address: {result}")
        return result

    except Exception as e:
        logger.error(f"Error in reverse geocoding: {e}", exc_info=True)
        return ""
