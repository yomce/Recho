import React from 'react';

// 폼 상태와 동일한 데이터 구조를 사용합니다.
export interface SessionEnsembleData {
  instrument: string;
  recruitCount: string | number; // 숫자형도 받을 수 있도록 유연하게 설정
  nowRecruitCount?: number; // 현재 모집된 인원 (선택적)
}

interface SessionDetailProps {
  item: SessionEnsembleData;
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ item }) => {
  return (
    <div className="w-full p-4 mb-4 border rounded-xl shadow-sm bg-white">
      <div className="flex justify-between items-center">
        {/* 악기 이름 */}
        <p className="text-lg font-semibold text-gray-800">{item.instrument}</p>
        
        {/* 모집 인원 정보 */}
        <div className="text-right">
          <p className="text-md text-gray-700">
            <span className="font-medium">모집 인원:</span> {item.recruitCount}명
          </p>
          {/* 현재 모집된 인원이 있다면 함께 표시 */}
          {item.nowRecruitCount !== undefined && (
            <p className="text-sm text-gray-500">
              (현재 {item.nowRecruitCount}명)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};