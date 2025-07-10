import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import axiosInstance from "@/services/axiosInstance";

// 조회수 증가가 필요한 페이지에서 아래처럼 호출하세요.
// useViewCounter({ type: 'practice-room' }); // 연습실 상세 페이지용
export type ViewCountableType = 'practice-room' | 'used-products' | 'ensembles' ;

interface useViewCounterOptions {
  type: ViewCountableType;
  id: string | number;
}

const useViewCounter = ({ type, id }: useViewCounterOptions) => {
  // const location = useLocation();

  useEffect(() => {
    // const match = location.pathname.match(/\/[^/]+\/(\d+)/);
    // const id = match?.[1];

    if(!id) return;

    // local storage 기반으로 유저 1명에 대해 조회수 1 증가
    const storageKey = `${type}-${id}-viewed`;
    const hasViewed = localStorage.getItem(storageKey);

    if(hasViewed) return;

    console.log('[ViewCountController] HIT', type, id);
    console.log(`[ViewCounter] Sending view count request for ${type}/${id}`);

    axiosInstance
      .post(`/api/count-view/${type}/${id}`)
      .then(() => {
        localStorage.setItem(storageKey, 'true');
      })
      .catch(console.error);
  }, [id, type])
};

export default useViewCounter;