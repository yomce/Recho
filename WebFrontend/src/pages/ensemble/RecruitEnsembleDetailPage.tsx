// src/pages/RecruitEnsembleDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/services/axiosInstance';
import axios from 'axios';
import type { RecruitEnsemble, ApplicationEnsemble } from './types';
import useViewCounter from '@/hooks/useViewCounter';
import RecruitEnsembleDetail from '@/components/layout/pages/ensemble/EnsembleDetail';

// 목록 페이지에서 사용했던 타입과 텍스트 매핑 객체를 가져옵니다.
// 별도 types 파일로 분리하여 관리하는 것이 좋습니다.


const RecruitEnsembleDetailPage: React.FC = () => {
  const { user } = useAuthStore();
  // URL 파라미터에서 게시글 ID를 가져옵니다.
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ensemble, setEnsemble] = useState<RecruitEnsemble | null>(null);
  const [applicationList, setApplicationList] = useState<ApplicationEnsemble[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  // 현재 로그인한 사용자가 게시글 작성자인지 확인하는 변수
  const isOwner = Boolean(ensemble && user && ensemble.user.id === user.id);

  if(id){
    useViewCounter({ type: 'ensembles', id });
  }

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
          console.log('data--');
          console.log(ensemble);
          console.log(response.data);
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
      setIsApplied(applicationList.some((app) => app.id === user?.id));
    } else {
      setIsApplied(false);
    }
  }, [applicationList, user])

  const handleEdit = () => {
    navigate(`/ensembles/edit/${id}`);
  };

  const handleComplete = async () => {
    if (window.confirm('정말로 이 멤버와 합주하시겠습니까?\n 공고가 종료되면 되돌릴 수 없습니다.')) {
      try {
        await axiosInstance.patch(`ensembles/${id}/complete`);
        alert('모집 공고가 성공적으로 종료되었습니다.');
        navigate(`/ensembles/${id}`); // 목록 페이지로 이동
      } catch (err) {
        setError('공고 종료 중 오류가 발생했습니다.');
      }
    }
  }

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
    <RecruitEnsembleDetail
      post={ensemble}
      isOwner={isOwner}
      onEdit={handleEdit}
      onComplete={handleComplete}
      onDelete={handleDelete}
      applicationEnsembleList={applicationList || []}
      isApplied={isApplied}
    />
  );
};

export default RecruitEnsembleDetailPage;