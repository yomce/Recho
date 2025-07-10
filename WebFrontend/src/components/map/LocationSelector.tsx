import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import { useLocationStore } from '@/components/map/store/useLocationStore';
import LocationSearch from '@/components/map/LocationSearch';

interface LocationSelectorProps {
  locationId?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ locationId }) => {
  const { pathname } = useLocation()
  const location = useLocationStore((state) => state.location);
  const resetLocation = useLocationStore((state) => state.resetLocation);
  const [addressName, setAddressName] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // -- 생성 페이지일 경우: location 전역 상태 초기화 --
  useEffect(() => {
    if (pathname.includes('/create')) {
      resetLocation();
    }
  }, [pathname, resetLocation]);

  // -- 수정 페이지에서 locationId로 주소 정보 요청 (전역 상태가 없을 경우만) -- 
  useEffect(() => {
    const fetchLocation = async () => {
      if (locationId && !location) {
        try {
          const response = await axiosInstance.get(`locations/${locationId}`);
          setAddressName(response.data.address);
        } catch (err) {
          console.error('지역 정보 조회 실패:', err);
        }
      }
    };
    fetchLocation();
  }, [locationId, location]);

  // 우선순위: 전역 상태 > 서버에서 불러온 값 (불필요한 API 요청 방지)
  const effectiveAddress =
    (location && typeof location === 'object' ? location.address : undefined) ||
    addressName;

  if (effectiveAddress && !showSearch) {
    return (
      <div className="w-full flex flex-row items-center gap-2">
        <div className="border border-gray-300 rounded-md bg-white flex-1 shrink-0 flex-row justify-center py-3 px-4">
          <span className="text-caption">
            {effectiveAddress}
          </span>
        </div>
        <button
          onClick={() => {
            resetLocation();
            setShowSearch(true);
          }}
          className="inline-block bg-brand-primary text-white text-caption-bold rounded-md hover:opacity-70 transition py-3 px-4"
        >
          다른 장소 선택
        </button>
      </div>
    );
  }

  return <LocationSearch />;
};

export default LocationSelector;
