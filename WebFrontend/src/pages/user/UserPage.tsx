// src/pages/user/UserPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChatStore } from '../../stores/chatStore';
import axiosInstance from "../../services/axiosInstance";
import ProfileContentTabs from "@/components/organisms/ProfileContentTabs";
import type { ContentDataType } from "@/components/organisms/ProfileContentTabs";
import SearchOverlay from "@/components/organisms/SearchOverlay";

// 컴포넌트 import
import MyPageLayout from "@/components/layout/UserPageLayout";
import Avatar from "@/components/atoms/avatar/Avatar";
import { DEFAULT_IMAGES } from "@/constants/images";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import SecondaryButton from "@/components/atoms/button/SecondaryButton";
import Modal from "@/components/molecules/modal/Modal";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "react-hot-toast";
import axios, { AxiosError } from "axios"; // AxiosError 타입 import
import type { Video } from '@/types/video';
import type { PaginatedUsedProductResponse } from '@/types/product';
import type { Post } from '@/types/post';


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
  const { totalUnreadCount } = useChatStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

  const {
    user: currentUser,
    actions: { logout },
  } = useAuthStore();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [thumbnails, setThumbnails] = useState<ContentDataType[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isVinylModalOpen, setIsVinylModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accessToken = localStorage.getItem("accessToken");

  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserInfo, setNewUserInfo] = useState("");
  const [userImage, setUserImage] = useState("");
  const [newProfileImageFile, setNewProfileImageFile] = useState<File | null>(null);

  const [usedProducts, setUsedProducts] = useState<ContentDataType[]>([]);
  const [posts, setPosts] = useState<ContentDataType[]>([]);

  const openVinylModal = () => setIsVinylModalOpen(true);
  const closeVinylModal = () => setIsVinylModalOpen(false);

  const handleSelectVideoFromGallery = () => {
    if (!accessToken) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "CREATE_VIDEO_FROM_GALLERY",
        payload: { token: accessToken },
      })
    );
    toast.success("앱에서 갤러리를 확인해주세요!");
    closeVinylModal();
  };

  useEffect(() => {
    if (!id) {
      setError("사용자 ID가 없습니다.");
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [userResponse, videosResponse, usedProductResponse, postResponse] = await Promise.all([
          axiosInstance.get<UserProfile>(`users/${id}`),
          axiosInstance.get<Video[]>(`videos/user/${id}`),
          axiosInstance.get<PaginatedUsedProductResponse>(`used-products/user/${id}`),
          axiosInstance.get<Post[]>(`posts/user/${id}`)
        ]);
        setUser(userResponse.data);
        const formattedThumbnails = videosResponse.data.map((video, index) => ({
            id: `thumb-${index}`,
            linkId: video.id,
            thumbnailUrl: video.thumbnail_url
          })
        );

        setUsedProducts(
          usedProductResponse.data.data.map((item) => ({
            id: String(item.productId),
            linkId: String(item.productId),
            thumbnailUrl: Array.isArray(item.imageUrl)
              ? item.imageUrl[0] ?? 'https://placehold.co/300x300?text=No+Image'
              : item.imageUrl ?? 'https://placehold.co/300x300?text=No+Image',
            title: String(item.title),
          }))
        );

        setPosts(
          postResponse.data.map((post) => ({
            id: String(post.postId),
            linkId: String(post.postId),
            thumbnailUrl: post.thumbnailUrl ?? 'https://placehold.co/300x300?text=No+Image',
            title: post.title,
          }))
        );

        let profileImgUrlResponse;
        if (userResponse.data.profileUrl) {
          const encodedImgUrlResponse = encodeURIComponent(userResponse.data.profileUrl)
          profileImgUrlResponse = await axiosInstance.get<string>(`images/download/${encodedImgUrlResponse}`)
          setUserImage(profileImgUrlResponse.data);
        }

        setThumbnails(formattedThumbnails);
        setError(null); // 다른 유저 페이지 로딩 성공 시 에러 상태 초기화
      } catch (err) {
        const axiosError = err as AxiosError;
        // [수정됨] 404 에러 처리
        if (axiosError.response && axiosError.response.status === 404) {
          toast.error("존재하지 않는 유저입니다.");
          // 로그인된 사용자의 페이지로 이동
          if (currentUser?.id) {
            navigate(`/users/${currentUser.id}`, { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        } else {
          // 그 외 다른 에러 처리
          setError("사용자 정보를 가져오는 중 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, currentUser, navigate]);

  const handleSendDm = async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.post("/chat/dm", {
        partnerId: user.id,
      });
      navigate(`/chat/${response.data.id}`);
    } catch (err) {
      alert("DM을 시작할 수 없습니다.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleEditProfile = () => {
    if (user) {
      setIsEditing(true);
      setNewUsername(user.username);
      setNewUserInfo(user.intro || ""); // null일 경우 빈 문자열로 초기화
      setNewProfileImageFile(null); // 새 파일 상태를 초기화
      setIsSettingsModalOpen(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setNewProfileImageFile(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!newUsername.trim()) {
      toast.error("닉네임을 입력해주세요.");
      return;
    }

    try {
      // 1. 닉네임 중복 검사 API를 먼저 호출합니다.
      //    (성공적으로 응답하면 사용 가능하다는 의미)
      await axiosInstance.post("/users/check-my-username", {
        username: newUsername,
      });

      let profileUrlKey = user?.profileUrl; // 기존 URL 키를 기본값으로 설정

      // 2. 새로운 프로필 파일이 선택된 경우, S3 업로드 로직 실행
      if (newProfileImageFile) {
        // a. presigned URL 요청
        const presignedResponse = await axiosInstance.post('/images/upload-urls', {
          refIn: 'USERS',
          fileType: newProfileImageFile.type,
        });

        const { url, key } = presignedResponse.data['USERS-original'];
        
        await axios.put(url, newProfileImageFile, {
          headers: {
            'Content-Type': newProfileImageFile.type,
          },
        });
        
        profileUrlKey = key; // 성공적으로 업로드된 S3 key로 URL 업데이트
      }

      // 2. 중복 검사를 통과하면 실제 프로필 업데이트 API를 호출합니다.
      await axiosInstance.patch<UserProfile>("/users/me", {
        username: newUsername,
        intro: newUserInfo,
        profileUrl: profileUrlKey
      });

      const response = await axiosInstance.get<UserProfile>(`users/${id}`)

      setUser(response.data);
      setIsEditing(false);
      toast.success("프로필이 성공적으로 수정되었습니다.");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      // 닉네임 중복으로 인한 409 Conflict 에러 처리
      if (error.response && error.response.status === 409) {
        toast.error(
          error.response.data.message || "이미 사용 중인 닉네임입니다."
        );
      } else {
        // 그 외 다른 에러 (네트워크 문제, 서버 에러 등)
        toast.error("프로필 수정에 실패했습니다.");
        console.error(err);
      }
    }
  };

  const isMyProfile = currentUser?.id === user?.id;

  if (loading || error) {
    return (
      <MyPageLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-headline">
            {loading ? "프로필을 불러오는 중..." : `에러: ${error}`}
          </p>
        </div>
      </MyPageLayout>
    );
  }

  return (
    <MyPageLayout
      totalUnreadCount={totalUnreadCount}
      onSettingsClick={() => setIsSettingsModalOpen(true)}
      onSearchClick={() => setIsSearchOverlayOpen(true)}
    >
      <div className="p-4 pt-12">
        {user ? (
          <div className="flex flex-col items-center">
            {/* 프로필 카드 */}
            <div className="relative w-full rounded-card bg-brand-default p-6 pt-12 text-center">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                {isMyProfile && isEditing ? (
                  <label htmlFor="profile-upload-input">
                    <Avatar
                      src={newProfileImageFile ? URL.createObjectURL(newProfileImageFile) : userImage || DEFAULT_IMAGES.PROFILE}
                      alt={`${user.username}의 프로필 사진`}
                      size={64}
                    />
                    <input
                      id="profile-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <Avatar
                    src={userImage|| DEFAULT_IMAGES.PROFILE}
                    alt={`${user.username}의 프로필 사진`}
                    size={64}
                  />
                )}
              </div>

              {isMyProfile && isEditing ? (
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-md border border-brand-primary bg-white p-2 text-center text-title font-bold text-gray-800"
                  autoFocus
                />
              ) : (
                <h2 className="text-title font-bold">{user.username}</h2>
              )}

              <p className="text-body text-brand-gray">@{user.id}</p>

              {isMyProfile && isEditing ? (
                <input
                  type="text"
                  value={newUserInfo}
                  onChange={(e) => setNewUserInfo(e.target.value)}
                  className="w-full rounded-md border border-brand-primary bg-white p-2 text-center font-bold text-gray-800"
                  autoFocus
                />
              ) : (
                <p className="mt-4 min-h-[4.5rem] text-body text-brand-text-secondary">{user.intro || "자기소개가 없습니다."}</p>
              )}
              <p className="text-footnote text-brand-disabled">
                가입일: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* 버튼 섹션 */}
            <div className="mt-6 w-full max-w-xs">
              {isMyProfile ? (
                isEditing ? (
                  <div className="flex w-full gap-3">
                    <PrimaryButton
                      onClick={handleSaveProfile}
                      className="flex-1"
                    >
                      저장
                    </PrimaryButton>
                    <SecondaryButton
                      onClick={handleCancelEdit}
                      className="flex-1"
                    >
                      취소
                    </SecondaryButton>
                  </div>
                ) : (
                  <SecondaryButton
                    onClick={handleEditProfile}
                    className="w-full"
                  >
                    프로필 수정
                  </SecondaryButton>
                )
              ) : (
                <PrimaryButton onClick={handleSendDm}>DM 보내기</PrimaryButton>
              )}
            </div>

            {/* 썸네일 섹션 ( 게시글 존재 유무와 관계 없이 렌더링 합니다. )*/}
            <div className="mt-8 w-full">
              <ProfileContentTabs
                shorts={thumbnails}
                usedProducts={usedProducts}
                posts={posts}
                onVinylCreateClick={openVinylModal}
              />
            </div>
            
          </div>
        ) : (
          <p>사용자 정보를 찾을 수 없습니다.</p>
        )}
      </div>

      <Modal
        isOpen={isVinylModalOpen}
        onClose={closeVinylModal}
        title="새로운 Vinyl 만들기"
      >
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-body text-brand-text-secondary mb-2">
            새로운 비디오를 만들기 위한 소스를 선택해주세요.
          </p>
          <PrimaryButton onClick={handleSelectVideoFromGallery}>
            갤러리에서 선택
          </PrimaryButton>
          <PrimaryButton
            onClick={() => toast("📹 촬영하기 기능은 앱에서 실행해 주세요.")}
          >
            촬영하기
          </PrimaryButton>
          <SecondaryButton onClick={closeVinylModal}>닫기</SecondaryButton>
        </div>
      </Modal>

      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="설정"
      >
        <div className="mt-4 flex flex-col gap-3">
          <PrimaryButton onClick={handleEditProfile}>프로필 수정</PrimaryButton>
          <SecondaryButton
            onClick={handleLogout}
            className="!text-red-500 hover:!bg-red-50"
          >
            로그아웃
          </SecondaryButton>
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