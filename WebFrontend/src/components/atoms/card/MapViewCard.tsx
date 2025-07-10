import React from "react";
import { useNavigate } from "react-router-dom";
import KakaoMapApi from "@/components/map/KakaoMapComponent";

interface MapPreviewCardProps {
  lat: number;
  lng: number;
}

const MapPreviewCard: React.FC<MapPreviewCardProps> = ({ lat, lng }) => {
  const navigate = useNavigate();

  const handleMapView = () => {
    navigate(`/map-view?lat=${lat}&lng=${lng}`);
  };

  return (
    <div className="relative py-[16px] w-full ">
      <KakaoMapApi
        lat={lat}
        lng={lng}
        style={{ height: "120px", borderRadius: "10px" }}
        className="w-full"
      />

      <button
        onClick={handleMapView}
        className="absolute bottom-[24px] right-2 bg-white/80 text-[12px] text-gray-800 px-3 py-1 rounded-[6px] shadow hover:bg-white flex items-center z-10"
      >
        지도 보기
      </button>
    </div>
  );
};

export default MapPreviewCard;
