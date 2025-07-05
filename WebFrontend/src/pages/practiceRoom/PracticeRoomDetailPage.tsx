import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import { type PracticeRoom } from '@/types/practiceRoom';
import { useAuthStore } from '@/stores/authStore';
import { PracticeRoomDetail } from '@/components/layout/pages/practiceRoom/PracticeRoomDetailForm';
import useViewCounter from '@/hooks/useViewCounter';

const PracticeRoomDetailPage: React.FC = () => 
{
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [post, setPost] = useState<PracticeRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = Boolean(post && user && post.userId === user.userId);

  useViewCounter({ type: 'practice-room' });

  useEffect (() => {
    if(!id){
      setError('게시글을 찾을 수 없습니다');
      return;
    }
    const fetchPostDetail = async () => {
      setError(null);

      try{
        const response = await axiosInstance.get<PracticeRoom>(
          `practice-room/${id}`
        );
        setPost(response.data);
      } catch (err: any) {
        console.error('Failed to fetch post detail');
        if (err?.response?.status === 404) {
          setError('해당 ID의 합주실 등록글을 찾을 수 없습니다');
        } else {
          setError('게시글을 불러오는 데 실패했습니다');
        }
      }}
      fetchPostDetail();
    }, [id]);

    // 에러 발생 시 표시할 UI
    if (error) {
      return <div className="detail-container error-message">{error}</div>;
    }

    // 상품 데이터가 없을 경우 (로딩이 끝났지만 product가 null일 때)
    if (!post) {
      return <div className="detail-container">상품 정보가 없습니다.</div>;
    }

    // 수정 버튼 핸들러
    const handleEdit = () => {
      navigate(`/practice-room/edit/${id}`);
    }

    // 삭제 버튼 핸들러
    const handleDelete = async () => {
      if (window.confirm('게시글을 삭제하시겠습니까?')){
        try{
          await axiosInstance.delete(`practice-room/${id}`);
          alert('게시글이 성공적으로 삭제되었습니다');
          navigate('/practice-room');
        }catch(err){
          console.error('Failed to delete post:', err);
          alert('게시글 삭제에 실패했습니다.');
        }
      }
    }

    return (
      <PracticeRoomDetail
        post={post}
        isOwner={isOwner}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    )
}

export default PracticeRoomDetailPage;