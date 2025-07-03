import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

const KakaoMapApi = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_APP_KEY}&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current;
        // -- 현재 위치의 위도 경도를 받아 옵니다 -- 
        const centerPosition = new window.kakao.maps.LatLng(33.450701, 126.570667);
        const options = {
          center: centerPosition,
          level: 3,
        };
        const map = new window.kakao.maps.Map(container, options);

        // -- 지도에 현재 위치를 마커로 표시합니다 -- 
        const marker = new window.kakao.maps.Marker({
          position: centerPosition,
        });
        marker.setMap(map);
      });
    };

    document.head.appendChild(script);
  }, []);

  return (
    <div>
      <div ref={mapRef} style={{ width: '500px', height: '400px' }} ></div>
    </div>
    
  )
};

export default KakaoMapApi;