import React, { useEffect, useMemo, useState } from "react";
import type {
  ApplicationEnsemble,
  RecruitEnsemble,
  SessionEnsemble,
} from "../types";
import axiosInstance from "@/services/axiosInstance";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

interface SessionDetailProps {
  item: SessionEnsemble;
  ensemble: RecruitEnsemble;
  applicationEnsembleList: ApplicationEnsemble[];
  isApplied: boolean;
}

export const SessionDetail: React.FC<SessionDetailProps> = ({
  item,
  ensemble,
  applicationEnsembleList,
  isApplied,
}) => {
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isIn, setIsIn] = useState(false);
  const [application, setApplication] = useState<ApplicationEnsemble | null>(
    null
  );

  // 1. 현재 세션에 지원한 유저들의 이름 목록을 계산합니다.
  // applicationEnsembleList나 item.sessionId가 변경될 때만 다시 계산됩니다.
  const applierUsernames = useMemo(() => {
    return applicationEnsembleList
      .filter((app) => app.sessionEnsemble.sessionId === item.sessionId)
      .map((app) => app.userId); // user 객체 안의 username을 추출
  }, [applicationEnsembleList, item.sessionId]);

  // 2. 위에서 계산한 목록의 길이를 통해 현재 지원자 수를 구합니다.
  const nowRecruitCount = applierUsernames.length;

  const handleApply = async () => {
    if (!user) {
      setError("인증 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      await axiosInstance.post(
        `application/${ensemble.postId}/${item.sessionId}`
      );
      alert("모집 공고에 지원했습니다!");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const messages = err.response?.data?.message;
        setError(
          Array.isArray(messages)
            ? messages.join("\n")
            : messages || err.message || "등록 중 오류가 발생했습니다."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("예상치 못한 오류가 발생했습니다.");
      }
    }
  };

  const handleCancel = async () => {
    if (!user) {
      setError("인증 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      await axiosInstance.delete(
        `application/${ensemble.postId}/${item.sessionId}/${application?.applicationId}`
      );
      alert("모집 공고 지원을 취소했습니다!");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const messages = err.response?.data?.message;
        setError(
          Array.isArray(messages)
            ? messages.join("\n")
            : messages || err.message || "등록 중 오류가 발생했습니다."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("예상치 못한 오류가 발생했습니다.");
      }
    }
  };

  useEffect(() => {
    const selfApplication = applicationEnsembleList.find(
      (app) => app.userId === user?.userId
    );

    setIsIn(!!selfApplication);
    setApplication(selfApplication || null);
  }, [applicationEnsembleList, isApplied, user]);

  return (
    <div className="w-full p-4 mb-4 border rounded-xl shadow-sm bg-white space-y-4">
      <div className="flex justify-between items-center">
        {/* 악기 이름 */}
        <p className="text-lg font-semibold text-gray-800">{item.instrument}</p>

        {/* 모집 인원 정보 */}
        <div className="text-right">
          <p className="text-md text-gray-700">
            <span className="font-medium">모집 인원:</span> {item.recruitCount}
            명
          </p>
          <p className="text-sm text-gray-500">
            (현재 {nowRecruitCount}명 지원)
          </p>
        </div>
      </div>

      {/* 3. 지원자 목록 표시 부분 */}
      {applierUsernames.length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700">현재 지원자:</p>
          <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-md">
            {applierUsernames.join(", ")}
          </p>
        </div>
      )}

      {/* --- 버튼 추가 부분 --- */}
      {user?.userId !== ensemble.userId ? (
        <div className="flex justify-end">
          {isApplied ? (
            isIn ? (
              <button
                onClick={handleCancel}
                className="px-4 py-2 font-semibold text-white bg-red-500 rounded-md shadow-sm hover:bg-red-600"
              >
                지원 취소
              </button>
            ) : null
          ) : (
            <button
              onClick={handleApply}
              className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-md shadow-sm hover:bg-blue-600"
            >
              지원하기
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};
