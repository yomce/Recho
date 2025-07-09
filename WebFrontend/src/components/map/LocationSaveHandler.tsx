// LocationHandler.tsx
/**
 * 위치 정보를 DB에 저장하는 핸들러입니다.
 * Kakao Map 등에서 선택한 location 객체를 DB에 저장하고,
 * 생성된 locationId를 반환합니다.
 * 
 * 게시글 작성 등에서 위치 정보가 필요할 경우 아래처럼 사용하세요:
 * const locationId = await saveLocationToDB(location);
 */
import { type Location } from '@/components/map/store/useLocationStore';
import axiosInstance from '@/services/axiosInstance';

export const saveLocationToDB = async (location: Location): Promise<number> => {
  const res = await axiosInstance.post('/api/locations', {
    place_name: location.place_name,
    address: location.road_address_name,
    lat: parseFloat(location.x),
    lng: parseFloat(location.y),
    region_level1: location.region_level1,
    region_level2: location.region_level2,
    region_level3: location.region_level3,
  });

  return res.data.locationId;
};

