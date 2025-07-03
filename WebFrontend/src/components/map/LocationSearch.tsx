/** 
 * src/components/map/LocationSearch.tsx
 * 카카오 REST API를 활용해 장소를 검색하고, 선택된 장소의 좌표를 기반으로
 * 행정 구역 정보를 가져와 상태로 저장하는 컴포넌트입니다.
 * 
 * 사용 흐름:
 * 1. 사용자가 검색어를 입력 후 "검색" 버튼 클릭
 * 2. 카카오 키워드 검색 API 호출 → 장소 목록 표시
 * 3. 특정 장소 클릭 시 → 좌표 기반 역지오코딩 API 호출
 * 4. 지역 정보 파싱 후 전역 상태 (useLocationStore)에 저장
 * 
**/

import { useState } from 'react';
import axios from 'axios';
import { useLocationStore } from './store/useLocationStore';

export interface MapLocation {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;    // longitude
  y: string;    // latitude
}

const LocationSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MapLocation[]>([]);
  const setLocation = useLocationStore((state) => state.setLocation);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleSearch = async () => {
    try {
      //-- 검색 키워드 기반 지도 API 호출하여 장소를 검색하고 UI에 띄웁니다 --
      const res = await axios.get(
        `https://dapi.kakao.com/v2/local/search/keyword.json`,
        {
          params: { query },
          headers: {
            Authorization: `KakaoAK ${import.meta.env.VITE_KAKAO_MAP_REST_API_KEY}`,
          },
        }
      );
      setResults(res.data.documents);
    } catch (err:any) {
      console.error('검색 실패:', err);
    };

  };

  const handleSelect = async (location: MapLocation) => {
    try {
      //-- DB 저장을 위해 행정구역 별로 파싱된 정보를 위도/경도 기반으로 역지오코딩된 API 데이터를 불러옵니다 --
      const reverseRes = await axios.get(
        `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json`,
        {
          params: { x: location.x, y: location.y },
          headers: {
            Authorization: `KakaoAK ${import.meta.env.VITE_KAKAO_MAP_REST_API_KEY}`,
          },
        }
      );

      const region = reverseRes.data.documents[0];
      console.log('location.lat:', location.x, 'location.lng:', location.y);

      console.log('선택된 지역: ', region);
      setLocation({
        ...location,
        region_level1: region.region_1depth_name,
        region_level2: region.region_2depth_name,
        region_level3: region.region_3depth_name,
      });
    } catch (err) {
      console.error('역 지오코딩 실패:', err);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-[10px] p-2">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="장소를 검색하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border border-brand-frame rounded-[10px] px-4 py-2 text-body focus:outline-brand-primary"
        />
        <button
          onClick={handleSearch}
          className="bg-brand-blue text-white text-button px-4 py-2 rounded-[10px] hover:bg-blue-600 transition"
        >
          검색
        </button>
      </div>
      <ul className="space-y-2">
        {results.map((place, idx) => (
          <li
            key={idx}
            className={`p-3 border border-brand-frame rounded-[10px] cursor-pointer text-body hover:bg-brand-frame hover:text-brand-text-primary transition ${
              selectedIdx === idx ? 'bg-brand-blue text-white' : 'bg-white'
            }`}
            onClick={() => {
              handleSelect(place);
              setSelectedIdx(idx);
            }}
          >
            <strong className="text-subheadline">{place.place_name}</strong>
            <br />
            <span className="text-caption text-brand-gray">
              {place.road_address_name || place.address_name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )

};

export default LocationSearch;