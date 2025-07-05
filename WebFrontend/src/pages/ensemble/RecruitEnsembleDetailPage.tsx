// src/pages/RecruitEnsembleDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/services/axiosInstance';
import axios from 'axios';
import type { SessionEnsemble, RecruitEnsemble, ApplicationEnsemble } from './types';
import { SessionDetail } from './components/SessionDetail';

// 목록 페이지에서 사용했던 타입과 텍스트 매핑 객체를 가져옵니다.
// 별도 types 파일로 분리하여 관리하는 것이 좋습니다.


const RecruitEnsembleDetailPage: React.FC = () => {
  const { user } = useAuthStore();
  // URL 파라미터에서 게시글 ID를 가져옵니다.
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sessionList, setSessionList] = useState<SessionEnsemble[] | null>(null);
  const [ensemble, setEnsemble] = useState<RecruitEnsemble | null>(null);
  const [applicationList, setApplicationList] = useState<ApplicationEnsemble[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  // 현재 로그인한 사용자가 게시글 작성자인지 확인하는 변수
  const isOwner = ensemble && user && ensemble.userId === user.userId;

  useEffect(() => {
    if (!id) {
      setError('잘못된 게시글 ID입니다.');
      setLoading(false);
      return;
    }

    const fetchEnsembleDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        // API 엔드포인트를 합주단원 모집 공고 상세 조회로 변경
        const response = await axiosInstance.get<RecruitEnsemble>(`ensembles/${id}`);

        setSessionList(response.data.sessionEnsemble)
        setEnsemble(response.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('해당 모집 공고를 찾을 수 없습니다.');
        } else {
          setError('공고 정보를 불러오는 데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEnsembleDetail();
  }, [id]);

  useEffect(() => {
    const fetchSessionDetail = async () => {
      try {
        if (ensemble) {
          const response = await axiosInstance.get<ApplicationEnsemble[]>(`application/${ensemble.postId}`)
          setApplicationList(response.data);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('지원자 정보를 찾을 수 없습니다.');
        } else {
          setError('지원자 정보를 불러오는 데 실패했습니다.');
        }
      }
    }

    fetchSessionDetail();
  }, [ensemble])

  useEffect(() => {
    if (applicationList) {
      setIsApplied(applicationList.some((app) => app.userId === user?.userId));
    } else {
      setIsApplied(false);
    }
  }, [applicationList, user])

  const handleEdit = () => {
    navigate(`/ensembles/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('정말로 이 모집 공고를 삭제하시겠습니까?')) {
      try {
        await axiosInstance.delete(`ensembles/${id}`);
        alert('모집 공고가 성공적으로 삭제되었습니다.');
        navigate('/ensembles'); // 목록 페이지로 이동
      } catch (err) {
        setError('공고 삭제 중 오류가 발생했습니다.');
      }
    }
  };
  
  // 로딩 및 에러 UI 렌더링 함수
  const renderStatusMessage = (message: string, isError: boolean = false) => (
    <div className="flex justify-center items-center h-screen">
      {isError ? (
        <p className="text-red-600 font-semibold">{message}</p>
      ) : (
        <div className="w-9 h-9 border-4 border-gray-200 border-l-blue-500 rounded-full animate-spin"></div>
      )}
    </div>
  );

  if (loading) return renderStatusMessage('로딩 중...');
  if (error) return renderStatusMessage(error, true);
  if (!ensemble) return renderStatusMessage('모집 공고 정보가 없습니다.', true);

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 bg-white rounded-lg shadow-lg text-slate-800">
      {/* --- 헤더 섹션 --- */}
      <header className="pb-4 mb-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{ensemble.title}</h1>
          <span className={`py-1 px-3 rounded-full text-sm font-semibold ${ensemble.recruitStatus}`}>
            {ensemble.recruitStatus}
          </span>
        </div>
        <div className="text-sm text-gray-500 mt-2 flex justify-between">
          <span>작성자: {ensemble.userId}</span>
          <span>등록일: {new Date(ensemble.createdAt).toLocaleDateString()} (조회수: {ensemble.viewCount})</span>
        </div>
      </header>

      {/* --- 정보 섹션 --- */}
      <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mb-8 p-4 bg-gray-50 rounded-md">
        <p><strong>지역 ID:</strong> {ensemble.locationId}</p>
        <p><strong>요구 실력:</strong> {ensemble.skillLevel}</p>
        <p><strong>모집 인원:</strong> {ensemble.totalRecruitCnt}명</p>
        <p className="md:col-span-2"><strong>연주 일자:</strong> {new Date(ensemble.eventDate).toLocaleDateString()}</p>
      </div>

      {/* --- 내용(본문) 섹션 --- */}
      <div className="mt-4">
        <h2 className="text-lg font-bold border-b-2 border-gray-100 pb-2 mb-4">상세 내용</h2>
        <pre className="whitespace-pre-wrap break-words text-base leading-relaxed text-gray-800 bg-gray-50 p-6 rounded-md min-h-[200px]">
          {ensemble.content}
        </pre>
      </div>

      {applicationList && sessionList?.map((item, index) => {
        const matchingApplication = applicationList.filter(
          (app) => app.sessionEnsemble.sessionId === item.sessionId
        );

        return (
          <SessionDetail
            key={index}
            item={item}
            ensemble={ensemble}
            applicationEnsembleList={matchingApplication}
            isApplied={isApplied}
          />
        )}
      )}

      {/* --- 버튼 섹션 --- */}
      <div className="mt-8 pt-6 flex justify-between items-center border-t border-gray-200">
        <Link
          to="/ensembles" // 목록 페이지 경로
          className="py-2 px-5 border border-gray-400 rounded-md font-semibold bg-white text-gray-700 no-underline transition-all hover:bg-gray-50 hover:text-black"
        >
          목록으로
        </Link>
        
        {/* 작성자일 경우에만 수정/삭제 버튼 표시 */}
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="py-2 px-5 rounded-md font-semibold text-white bg-blue-500 cursor-pointer transition-colors hover:bg-blue-700"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="py-2 px-5 rounded-md font-semibold text-white bg-red-600 cursor-pointer transition-colors hover:bg-red-700"
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruitEnsembleDetailPage;