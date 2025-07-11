// src/pages/user/UserPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import ProfileContentTabs from '@/components/organisms/ProfileContentTabs';
import SearchOverlay from '@/components/organisms/SearchOverlay'; // 1. SearchOverlay 컴포넌트 import

// 컴포넌트 import
import MyPageLayout from '@/components/layout/UserPageLayout';
import Avatar from '@/components/atoms/avatar/Avatar';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import SecondaryButton from '@/components/atoms/button/SecondaryButton';
import Modal from '@/components/molecules/modal/Modal';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'react-hot-toast';

// 타입 정의
interface UserProfile {
  id: string;
  username: string;
  email: string;
  profileUrl: string | null;
  intro: string | null;
  createdAt: string;
}

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false); 

  const { user: currentUser, actions: { logout } } = useAuthStore();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [thumbnails, setThumbnails] = useState<{ id: string; thumbnailUrl: string }[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isVinylModalOpen, setIsVinylModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accessToken = localStorage.getItem('accessToken');

  const openVinylModal = () => setIsVinylModalOpen(true);
  const closeVinylModal = () => setIsVinylModalOpen(false);

  const handleSelectVideoFromGallery = () => {
      if (!accessToken) {
          toast.error('로그인이 필요합니다.');
          return;
      }
      window.ReactNativeWebView?.postMessage(
          JSON.stringify({
              type: 'CREATE_VIDEO_FROM_GALLERY',
              payload: { token: accessToken },
          })
      );
      toast.success('앱에서 갤러리를 확인해주세요!');
      closeVinylModal();
  };

  useEffect(() => {
    if (!id) {
      setError('사용자 ID가 없습니다.');
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [userResponse, thumbnailsResponse] = await Promise.all([
          axiosInstance.get<UserProfile>(`api/users/${id}`),
          axiosInstance.get<string[]>(`api/videos/thumbnails?id=${id}`),
        ]);
        setUser(userResponse.data);
        const formattedThumbnails = thumbnailsResponse.data.map((url, index) => ({
          id: `thumb-${index}`, // 임시로 고유 ID 생성
          thumbnailUrl: url,
        }));
        setThumbnails(formattedThumbnails); 
      } catch (err) {
        setError('사용자 정보를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleSendDm = async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.post('/chat/dm', { partnerId: user.id });
      navigate(`/chat/${response.data.id}`);
    } catch (err) {
      alert('DM을 시작할 수 없습니다.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleEditProfile = () => {
    toast('프로필 수정 기능은 준비 중입니다.');
    setIsSettingsModalOpen(false);
  };

  const isMyProfile = currentUser?.id === user?.id;

  if (loading || error) {
    return (
      <MyPageLayout>
        <div className='flex h-full items-center justify-center'>
          <p className='text-headline'>{loading ? '프로필을 불러오는 중...' : `에러: ${error}`}</p>
        </div>
      </MyPageLayout>
    );
  }

  return (
    <MyPageLayout 
    onSettingsClick={() => setIsSettingsModalOpen(true)}
    onSearchClick={() => setIsSearchOverlayOpen(true)}
    >
      <div className="p-4 pt-12">
        {user ? (
          <div className="flex flex-col items-center">
            {/* 프로필 카드 */}
            <div className="relative w-full rounded-card bg-brand-default p-6 pt-12 text-center">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                <Avatar 
                  src={user.profileUrl || `https://placehold.co/128x128/e9ecef/495057?text=${user.username.charAt(0)}`}
                  alt={`${user.username}의 프로필 사진`}
                  size={64} // 프로필 사진 크기 조정

                />
              </div>
              <h2 className="text-title font-bold">{user.username}</h2>
              <p className="text-body text-brand-gray">@{user.id}</p>
              <p className="mt-4 min-h-[4.5rem] text-body text-brand-text-secondary">
                {user.intro || "자기소개가 없습니다."}
              </p>
              <p className="text-footnote text-brand-disabled">
                가입일: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* 버튼 섹션 */}
            <div className="mt-6 w-full max-w-xs">
              {isMyProfile ? (
                <SecondaryButton onClick={handleEditProfile}>프로필 수정</SecondaryButton>
              ) : (
                <PrimaryButton onClick={handleSendDm}>DM 보내기</PrimaryButton>
              )}
            </div>

            {/* 썸네일 섹션 */}
            {thumbnails.length > 0 && (
              <div className="mt-8 w-full">
                <ProfileContentTabs 
                  shorts={thumbnails} // '바이닐' 탭에 표시할 데이터
                  usedProducts={[]}   // '중고거래' 탭에 표시할 데이터 (API 연동 필요)
                  posts={[]}          // '작성글' 탭에 표시할 데이터 (API 연동 필요)
                  onVinylCreateClick={openVinylModal}
                />
              </div>
            )}
          </div>
          ) : (
            <p>사용자 정보를 찾을 수 없습니다.</p>
          )}
        </div>

      {/* 설정 모달 */}
      <Modal isOpen={isVinylModalOpen} onClose={closeVinylModal} title="새로운 Vinyl 만들기">
        <div className="mt-4 flex flex-col gap-3">
            <p className="text-body text-brand-text-secondary mb-2">새로운 비디오를 만들기 위한 소스를 선택해주세요.</p>
            <PrimaryButton onClick={handleSelectVideoFromGallery}>갤러리에서 선택</PrimaryButton>
            <PrimaryButton onClick={() => toast('📹 촬영하기 기능은 앱에서 실행해 주세요.')}>촬영하기</PrimaryButton>
            <SecondaryButton onClick={closeVinylModal}>닫기</SecondaryButton>
        </div>
      </Modal>

      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="설정">
        <div className="mt-4 flex flex-col gap-3">
          <PrimaryButton onClick={handleEditProfile}>프로필 수정</PrimaryButton>
          <SecondaryButton onClick={handleLogout} className="!text-red-500 hover:!bg-red-50">로그아웃</SecondaryButton>
        </div>
      </Modal>

      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
      />
    </MyPageLayout>
  );
};

export default UserPage;