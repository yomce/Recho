import { useConfigStore } from '@/stores/useConfigStore';
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapApiProps {
  lat: number;
  lng: number;
}

const KakaoMapApi = ({ lng, lat }: KakaoMapApiProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const kakaoMapAppKey = useConfigStore((state) => state.config?.kakaoMapAppKey);

  useEffect(() => {
    const renderMap = () => {
      const container = mapRef.current;
      if(!container) {
        console.error('지도를 렌더링할 컨테이너가 없습니다.');
        return;
      }

      const center = new window.kakao.maps.LatLng(lng, lat);
      const options = {
        center,
        level: 3,
      };

      const map = new window.kakao.maps.Map(container, options);
      const marker = new window.kakao.maps.Marker({ position: center });

      marker.setMap(map);
    };
    // -- 이미 kakao maps가 로드된 경우 재로드 하지 않음
    if(window.kakao && window.kakao.maps){
      window.kakao.maps.load(renderMap);
      return;
    }
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapAppKey}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(renderMap);
    document.head.appendChild(script);

  }, [lng, lat]);

  return (
    <div>
      <div ref={mapRef} style={{ width: '500px', height: '400px' }} ></div>
    </div>
  )
};

export default KakaoMapApi;