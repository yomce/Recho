import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { type PracticeRoomForm, type Location, type CreatePracticeRoomPayload, type PracticeRoom } from '@/types/practiceRoom';

const mockLocations: Location[] = [
  { locationId: '1001', regionLevel1: '경기도', regionLevel2: '용인시' },
  { locationId: '1002', regionLevel1: '경기도', regionLevel2: '수원시' },
  { locationId: '2001', regionLevel1: '서울특별시', regionLevel2: '강남구' },
];

const UpdatePracticeRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<PracticeRoomForm>({
    title: '',
    description: '',
    locationId: mockLocations[0].locationId,
    image: [],
  })

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -- 기존 게시글 데이터 불러오기 -- 
  useEffect(() => {
    const fetchPostDetail = async () => {
      setLoading(true);

      try {
        const response = await axios.get<PracticeRoom>(`http://localhost:3000/practice-room/${id}`);
        const post = response.data;

        setForm({
          title: post.title,
          description: post.description,
          locationId: post.location.locationId,
          image: post.imageUrl ? [] : [],
        })
      } catch (err: any) {
        console.error('Failed to fetch post for update:', err);
        setError('게시글을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false);
      }
    };
    fetchPostDetail();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, 
  ) => {
    const {name, value} = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try{
      const payload: CreatePracticeRoomPayload = {
        title: form.title,
        description: form.description,
        locationId: form.locationId,
      };
      await axios.patch(`http://localhost:3000/practice-room/${id}`, payload,);
      alert('게시글이 성공적으로 수정되었습니다!');
      navigate(`/practice-room/${id}`)
    }catch (err:any){
      console.error('Failed to update post:', err);
      if (err.response?.data?.message) {
        const messages = Array.isArray(err.response.data.message)
        ? err.response.data.message.join('\n')
        : err.response.data.message;
        setError(messages);
      }else {
        setError(err.message || '게시글 수정 중 오류가 발생했습니다.');
      }
    }finally{
      setLoading(false);
    }
  };

  // 로딩 중이거나 에러 발생 시 UI
  if (loading) return <div className="message-container"><div className="spinner"></div></div>;
  if (error) return <div className="message-container error-message">{error}</div>;

  return (
    <div className='app-container'>
      <div className='centered-card-container'>
        <div className="w-full max-w-md bg-brand-default rounded-[20px] shadow-md p-8">
          <h2 className='text-title mb-8 text-center'>합주실 수정</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor='title' className="text-subheadline">제목</label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                required
                className="border border-brand-frame rounded-[10px] px-4 py-2 text-body focus:outline-brand-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor='description' className="text-subheadline">본문</label>
              <textarea 
                id="description" 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows={8} 
                required
                className="border border-brand-frame rounded-[10px] px-4 py-2 text-body focus:outline-brand-primary resize-none"
              />
            </div>

            {/* 위치 선택 드롭다운 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="locationId" className="text-subheadline">지역</label>
              <select
                id="locationId"
                name="locationId"
                value={form.locationId}
                onChange={handleChange}
                className="border border-brand-frame rounded-[10px] px-4 py-2 text-body focus:outline-brand-primary"
              >
                {mockLocations.map((loc) => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {loc.regionLevel1} {loc.regionLevel2}
                  </option>
                ))}
              </select>
            </div>

            {/* 사진 선택 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="image" className="text-subheadline">사진</label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                multiple
                onChange={e => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    setForm(prev => ({
                      ...prev,
                      image: Array.from(files),
                    }));
                  }
                }}
                className="border border-brand-frame rounded-[10px] px-4 py-2 text-body focus:outline-brand-primary"
              />
              {/* 미리보기 썸네일 */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {form.image.length > 0 &&
                  form.image.map((file, idx) => (
                    <img
                      key={idx}
                      src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                      alt={`preview-${idx}`}
                      className="w-20 h-20 object-cover rounded-[10px] border"
                    />
                  ))}
              </div>
            </div>

            {/* 수정 버튼 */}
            <button
              type="submit"
              className="bg-brand-primary mt-4 w-full text-brand-text-inverse py-3 rounded-[10px]"
              disabled={loading}
            >
              {loading ? '수정 중...' : '수정하기'}
            </button>

            {/* 에러 메시지 */}
            {error && (
              <div className="button-brand-gray mt-2"><p className="text-brand-error-text text-center">{error}</p></div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default UpdatePracticeRoomPage;