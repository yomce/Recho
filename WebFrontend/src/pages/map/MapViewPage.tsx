import { useSearchParams } from "react-router-dom";
import KakaoMapApi from "@/components/map/KakaoMapComponent";
import PostLayout from "@/components/layout/PostLayout";

const MapViewPage = () => {
  const [searchParams] = useSearchParams();
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  return (
    <PostLayout>
      <div className="w-full h-screen">
        <KakaoMapApi
          lat={lat}
          lng={lng}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </PostLayout>
  );
};

export default MapViewPage;
