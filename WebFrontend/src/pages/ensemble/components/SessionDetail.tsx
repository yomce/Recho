import React, { useEffect, useMemo, useState } from "react";
import type {
  ApplicationEnsemble,
  RecruitEnsemble,
  SessionEnsemble,
} from "../types";
import axiosInstance from "@/services/axiosInstance";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";

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
  const [, setError] = useState<string | null>(null);
  const [isIn, setIsIn] = useState(false);
  const [application, setApplication] = useState<ApplicationEnsemble | null>(
    null
  );

  // 1. 현재 세션에 지원한 유저들의 이름 목록을 계산합니다.
  // applicationEnsembleList나 item.sessionId가 변경될 때만 다시 계산됩니다.
  const applierUsernames = useMemo(() => {
    return (applicationEnsembleList || []).filter(
      (app) => app.sessionEnsemble.sessionId === item.sessionId
    ).map((app) => app.id); // user 객체 안의 username을 추출
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
    const selfApplication = Array.isArray(applicationEnsembleList)
      ? applicationEnsembleList.find((app) => app.id === user?.id)
      : undefined;

    setIsIn(!!selfApplication);
    setApplication(selfApplication || null);
  }, [applicationEnsembleList, user]);

  return (
    <div className="w-full mt-[16px]">
      <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
        {/* 제목 줄 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-caption text-brand-gray">{item.instrument}</span>
          </div>
          <div className="flex flex-col items-end justify-end">
            <span className="text-footnote text-gray-500">
              {nowRecruitCount}/{item.recruitCount}
            </span>
            <p className="text-sm text-gray-500">
              (현재 {nowRecruitCount}명 지원)
            </p>
          </div>
        </div>
        <div className="mt-2 border-t border-brand-frame" />

        {/* 유저 목록 */}
        <div className="flex items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-2">
            {applierUsernames.map((userId) => (
              <div key={userId} className="flex flex-col items-center">
                <img
                  src="https://placehold.co/32x32"
                  alt={`user-${userId}`}
                  className="w-12 h-12 rounded-full border border-white"
                />
                <p className="text-footnote text-gray-500 mt-1">{userId}</p>
              </div>
            ))}
          </div>

          {/* 버튼 렌더링 */}
          {user?.id !== ensemble.user.id && (
            <div className="max-w-[60px] whitespace-nowrap overflow-hidden">
              {isApplied ? (
                isIn ? (

                  <PrimaryButton
                    onClick={handleCancel}
                    style={{ fontSize: 12 }}
                  >
                    지원 취소
                  </PrimaryButton>
                ) : null
              ) : (
                <PrimaryButton
                  onClick={handleApply}
                  style={{ fontSize: 12 }}
                >
                  지원하기
                </PrimaryButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
