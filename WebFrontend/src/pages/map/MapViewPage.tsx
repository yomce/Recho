import { useSearchParams } from "react-router-dom";
import KakaoMapApi from "@/components/map/KakaoMapComponent";

const MapViewPage = () => {
  const [searchParams] = useSearchParams();
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  console.log(lat, lng);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">지도에서 위치 보기</h2>
      <KakaoMapApi lat={lat} lng={lng} />
    </div>
  );
};

export default MapViewPage;
