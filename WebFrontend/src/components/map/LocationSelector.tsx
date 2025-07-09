import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import { useLocationStore } from '@/components/map/store/useLocationStore';
import LocationSearch from '@/components/map/LocationSearch';

// 공통 입력 필드 스타일
const inputStyles = "w-full py-3 px-4 text-base border border-gray-400 rounded-md box-border transition-all duration-200 text-gray-800 bg-gray-50 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/50";

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
      <div className={inputStyles}>
        <div>
          <strong>선택된 지역:</strong> {effectiveAddress}
        </div>
        <button
          className="mt-2 px-4 py-2 bg-brand-blue text-white rounded"
          onClick={() => {
            resetLocation();
            setShowSearch(true);
          }}
        >
          다른 장소 선택
        </button>
      </div>
    );
  }

  return <LocationSearch />;
};

export default LocationSelector;
