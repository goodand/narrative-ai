import requests
from ..config import get_settings

def get_address_from_coords(lat: float, lon: float) -> str:
    """
    Reverse Geocoding using Google Maps API.
    동(Dong) -> 구(Gu) -> 시(City/Province) 순으로 주소를 추출합니다.
    """
    settings = get_settings()
    api_key = settings.google_cloud_api_key
    
    if not api_key:
        print("Warning: GOOGLE_CLOUD_API_KEY is not set.")
        return ""

    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lon}&key={api_key}&language=ko"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if data["status"] != "OK":
            print(f"Geocoding API error: {data['status']}")
            return ""

        # 주소 구성 요소 분석
        # Google API는 결과를 여러 개 반환하는데, 가장 상세한 첫 번째 결과를 사용합니다.
        address_components = data["results"][0]["address_components"]
        
        dong = ""
        gu = ""
        city = ""

        for comp in address_components:
            types = comp["types"]
            # sublocality_level_2 가 보통 '동'
            if "sublocality_level_2" in types:
                dong = comp["long_name"]
            # sublocality_level_1 이 보통 '구'
            elif "sublocality_level_1" in types:
                gu = comp["long_name"]
            # locality 가 보통 '시'
            elif "locality" in types:
                city = comp["long_name"]
            # administrative_area_level_1 이 '도' 또는 '특별시/광역시'
            elif "administrative_area_level_1" in types and not city:
                city = comp["long_name"]

        # 동 -> 구 -> 시 순서로 반환 (fallback)
        result = dong or gu or city
        return result

    except Exception as e:
        print(f"Error in reverse geocoding: {e}")
        return ""
