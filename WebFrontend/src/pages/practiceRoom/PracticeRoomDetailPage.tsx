import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { type PracticeRoom } from '@/types/practiceRoom';

const PracticeRoomDetailPage: React.FC = () => 
{
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<PracticeRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect (() => {
    if(!id){
      setError('게시글을 찾을 수 없습니다');
      setLoading(false);
      return;
    }
    const fetchPostDetail = async () => {
      setLoading(true);
      setError(null);

      try{
        const response = await axios.get<PracticeRoom>(
          `http://localhost:3000/practice-room/${id}`
        );
        setPost(response.data);
      }catch (err: any){
        console.error('Failed to fetch post detail');
        if(axios.isAxiosError(err) && err.response?.status === 404 ){
          setError('해당 ID의 합주실 등록글을 찾을 수 없습니다')
        }else{
          setError('게시글을 불러오는 데 실패했습니다')
        }
      } finally{
        setLoading(false);
      }}
      fetchPostDetail();
    }, [id]);

    // 로딩 중일 때 표시할 UI
    if (loading) {
      return <div className="detail-container"><div className="spinner"></div></div>;
    }

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
          await axios.delete(`http://localhost:3000/practice-room/${id}`);
          alert('게시글이 성공적으로 삭제되었습니다');
          navigate('/practice-room');
        }catch(err){
          console.error('Failed to delete post:', err);
          alert('게시글 삭제에 실패했습니다.');
        }
      }
    }

    return(
      <div className='centered-card-container'>
        <div className='bg-white rounded-[20px] shadow-lg p-8 w-full max-w-xl flex flex-col items-center'>
          <div className='w-full flex justify-center mb-6 relative'>
            <img
              className='rounded-[20px] object-cover w-full max-h-80'
              src={post.imageUrl || 'https://placehold.co/600x400'}
              alt={post.title}
            />
            <div className='absolute top-2 right-2 flex gap-2'>
              <button 
              onClick={handleDelete}
              className='bg-brand-error-text text-white text-footnote px-2 py-1 rounded shadow hover:bg-red-600 transition' style={{fontSize:'12px'}}>
                삭제
              </button>
              <button
              onClick={handleEdit} 
              className='bg-brand-primary text-white text-footnote px-2 py-1 rounded shadow hover:bg-purple-700 transition' 
              style={{fontSize:'12px'}}>
                수정
              </button>
            </div>
          </div>
          <div className='w-full mb-4'>
            <h2 className='text-title text-center'>{post.title}</h2>
          </div>
          <div className='w-full'>
            <label htmlFor='description' className='text-subheadline block mb-2'>본문</label>
            <pre className='text-body bg-brand-frame rounded-[10px] p-4 whitespace-pre-wrap'>{post.description}</pre>
          </div>
          <div className='w-full mb-4 flex gap-4 justify-center'>
            <button
              type="button"
              className='bg-brand-blue text-white text-button py-2 px-6 rounded-[10px] shadow hover:bg-blue-500 transition'
            >
              지도에서 보기
            </button>
            <button
              type="button"
              className='bg-brand-primary text-white text-button py-2 px-6 rounded-[10px] shadow hover:bg-purple-700 transition'
              onClick={() => navigate('/practice-room')}
            >
              뒤로가기
            </button>
          </div>
        </div>
      </div>
    )

}

export default PracticeRoomDetailPage;