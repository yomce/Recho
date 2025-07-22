import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom"; // react-router-dom에서 useNavigate를 가져옵니다.
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import { useAuthStore } from "@/stores/authStore";
import VinylRightLayout from "@/components/layout/pages/vinyl/VinylRightLayout";
import ProfileWithName from "@/components/atoms/button/ProfileWithName";
import IconButton from "@/components/atoms/button/IconButton";
import { createCommentForVideo, deactivateVideo, getCommentsForVideo, toggleStringPostLike } from '@/api';
import { CONTENT_TYPE } from '@/types/likes';
import type { Video } from '@/types/video';
import CommentsModal from './CommentModal';
import type { Comment } from '@/types/comment';
import { useVinylStore } from '@/stores/vinylStore';

interface VinylContentsProps {
  currentVideo: Video;
  size: { width: number; height: number };
  isVisible: boolean; // 현재 화면에 보이는지 여부
  rotationAngle: number; // 회전 각도
  depth: number; // depth prop 추가
  onVideoReady?: () => void; // 비디오 로딩 완료 콜백
  onStartEnsemble: (videoId: string) => void; // prop 타입 정의 추가
  setVideos: (value: React.SetStateAction<Video[]>) => void
}

const VinylContents: React.FC<VinylContentsProps> = (props) => {
  const { currentIndex, setCurrentIndex } = useVinylStore();
  const currentUser = useAuthStore((state) => state.user);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controls = useAnimation();
  const navigate = useNavigate(); // useNavigate 훅을 사용하여 navigate 함수를 가져옵니다.
  const [prevRotationAngle, setPrevRotationAngle] = useState(
    props.rotationAngle
  );
  const [isPlaying, setIsPlaying] = useState(false); // 비디오 재생 상태 관리
  const [divHeight, setDivHeight] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [, setIsLoadingComments] = useState(false);

  const isCurrentUserVideoOwner = currentUser && props.currentVideo.user.id === currentUser.id;

  const fetchComments = async () => {
    if (!props.currentVideo.id) return;
    setIsLoadingComments(true);
    try {
      const fetchedComments = await getCommentsForVideo(props.currentVideo.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      alert('댓글을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  const handleOpenComments = () => {
    fetchComments(); // Fetch fresh comments every time the modal is opened
    setIsCommentsOpen(true);
  };

  const handleCloseComments = () => {
    setIsCommentsOpen(false);
  };
  
  const handleAddComment = async (content: string) => {
    if (!currentUser) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }
    try {
      await createCommentForVideo(props.currentVideo.id, content);
      
      // Update comment count in the main video list state
      props.setVideos(currentVideos =>
        currentVideos.map(v => 
          v.id === props.currentVideo.id
            ? { ...v, commentCount: (v.commentCount || 0) + 1 }
            : v
        )
      );

      // Refresh the comments list in the modal
      await fetchComments(); 
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw error; // Re-throw to be caught by the modal's handler
    }
  };

  useEffect(() => {
    const updateHeight = () => {
      const height = (props.size.width * 16) / 9;
      setDivHeight(height);
    };

    updateHeight(); // 초기값 설정
    window.addEventListener("resize", updateHeight); // 리사이즈 대응

    return () => window.removeEventListener("resize", updateHeight);
  }, [props.size.width]);

  const handleVideoCanPlay = () => {
    // 비디오가 재생 준비되면 재생 시도
    if (videoRef.current && props.isVisible) {
      videoRef.current.play().catch((error) => {
        console.log("자동 재생 실패. 사용자의 상호작용이 필요합니다.", error);
      });
      setIsPlaying(true); // 재생 시작 시 상태 업데이트
    }
    // 부모 컴포넌트에게 로딩 완료 알림 (필요한 경우)
    if (props.onVideoReady) {
      props.onVideoReady();
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch((error) => {
          console.log("재생 실패:", error);
        });
        setIsPlaying(true);
      }
    }
  };

  const handleShare = async (videoId: string) => {
    if (!videoId) return;

    const shareData = {
      title: "VINYL에서 멋진 합주를 발견했어요!",
      text: "이 비디오를 함께 감상해보세요.",
      // 현재 웹사이트 주소와 비디오 ID를 조합해 전체 URL을 만듭니다.
      url: `${window.location.origin}/vinyl/${videoId}`,
    };

    // 1. React Native WebView 환경인지 확인
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "share", // RN에서 메시지를 식별할 타입
          payload: shareData,
        })
      );
      return;
    }

    // 2. 브라우저가 Web Share API를 지원하는지 확인
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        // 성공 로그 (필요시 사용)
        // console.log("콘텐츠가 성공적으로 공유되었습니다.");
      } catch (error) {
        console.error("공유 중 오류가 발생했습니다:", error);
      }
      return;
    }

    // 3. 위 방법들을 사용할 수 없을 때 클립보드에 복사 (폴백)
    try {
      await navigator.clipboard.writeText(shareData.url);
      alert("비디오 링크가 클립보드에 복사되었습니다!");
    } catch (error) {
      console.error("클립보드 복사에 실패했습니다:", error);
      alert("링크 복사에 실패했습니다. 수동으로 복사해주세요.");
    }
  };

  const handleToggleLike = async (videoId: string) => {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    try {
        await toggleStringPostLike(CONTENT_TYPE.VINYL, videoId);
        props.setVideos(currentVideos => 
        currentVideos.map(v => {
          if (v.id === videoId) {
              const iLikedIt = !v.userLiked;
              
              const currentLikes = v.likeCount || 0; // p.likeCount가 없으면 0을 사용
              const newLikeCount = iLikedIt ? currentLikes + 1 : Math.max(0, currentLikes - 1); // 0 밑으로 내려가지 않도록 방지

              return { ...v, userLiked: iLikedIt, likeCount: newLikeCount };
          }
          return v;
        })
    );
    } catch (error) {
        alert('오류가 발생했습니다.');
    }
  };

    const handleDeactivateVideo = async () => {
    if (!currentUser || !isCurrentUserVideoOwner) {
      alert('비디오를 비활성화할 권한이 없습니다.');
      return;
    }

    if (window.confirm('정말로 이 비디오를 비활성화하시겠습니까? 다른 영상에 사용된 비디오는 지워지지 않습니다.')) {
      try {
        await deactivateVideo(props.currentVideo.id);
        alert('비디오가 성공적으로 비활성화되었습니다.');
        // 비디오 비활성화 후, 해당 비디오를 리스트에서 제거하거나 상태 업데이트
        props.setVideos(currentVideos =>
          currentVideos.filter(v => v.id !== props.currentVideo.id)
        );
        // 비디오 리스트가 변경되었으므로, 적절한 페이지로 이동 (예: 홈 또는 내 비디오 목록)
        setCurrentIndex(currentIndex - 1);
        // navigate(-1);
      } catch (error: any) {
        console.error("Failed to deactivate video:", error);
        // 에러 메시지 표시 (백엔드에서 상세 에러 메시지가 온다면 활용)
        const errorMessage = error.response?.data?.message || '비디오 비활성화에 실패했습니다.';
        alert(errorMessage);
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = true;
      if (props.isVisible) {
        // 화면에 보일 때 비디오 로드를 시작 (재생은 onCanPlay에서)
        videoRef.current.load();
        // isPlaying 상태를 true로 초기화하여 다음 렌더링 시 재생되도록 준비
        setIsPlaying(true);
      } else {
        // 보이지 않으면 일시정지하고 시간 리셋
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false); // 일시정지 시 상태 업데이트
      }
    }
  }, [props.isVisible]);

  useEffect(() => {
    // Start rotation animation first
    const rotationPromise = controls.start({
      rotate: props.rotationAngle,
      transition: { duration: 1.0, ease: "easeInOut" },
    });

    // When the item is centered (rotation becomes 0)
    if (props.rotationAngle === 0 && prevRotationAngle !== 0) {
      // After rotation finishes, trigger the "pop" animation
      rotationPromise.then(() => {
        controls.start({
          scale: [1, 0.95, 1], // Keyframes for the pop effect
          transition: { duration: 0.3 },
        });
      });
    } else {
      // For non-centered items, ensure the scale is reset to 1
      controls.start({ scale: 1 });
    }

    if (props.rotationAngle !== prevRotationAngle) {
      setPrevRotationAngle(props.rotationAngle);
    }
  }, [props.rotationAngle, prevRotationAngle, controls]);

  return (
    <>
      <motion.div
        style={{
          position: "relative",
          transformOrigin: "50% 300%", // 회전 축을 하단으로 설정
          width: "100%",
          height: `${divHeight}px`,
        }}
        animate={controls}
      >
        {/* --- 뒤로가기 버튼 추가 --- */}
        <IconButton
          iconName="back"
          iconSize={24}
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            zIndex: 10,
            background: "rgba(0, 0, 0, 0.4)",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            paddingBottom: "4px", // 아이콘 수직 정렬을 위한 미세 조정
          }}
          aria-label="Go back"
        />

        {isCurrentUserVideoOwner && (
          <IconButton
            iconName="delete" // 적절한 아이콘 이름으로 변경 (예: 'ellipsis' 또는 'more-vertical', 'trash' 등)
            iconSize={24}
            onClick={handleDeactivateVideo}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px", // 오른쪽 위에 위치
              zIndex: 10,
              background: "rgba(0, 0, 0, 0.4)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              paddingBottom: "4px",
            }}
            aria-label="Deactivate Video"
          />
        )}

        <video
          ref={videoRef}
          src={props.currentVideo.videoUrl}
          width="100%"
          controls={false}
          playsInline
          crossOrigin="anonymous"
          style={{
            display: "block",
          }}
          onCanPlay={handleVideoCanPlay}
          onClick={handleVideoClick}
        />

        {/* --- 왼쪽 위 프로필 및 구독 버튼 추가 --- */}
        <div
          style={{
            position: "absolute",
            top: `${divHeight * 0.84}px`,
            left: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px", // 아이콘과 버튼 사이 간격
            zIndex: 10,
          }}
        >
          <ProfileWithName user={props.currentVideo.user} />
        </div>

        <VinylRightLayout
          video={props.currentVideo}
          divHeight={divHeight}
          onClickLike={() => handleToggleLike(props.currentVideo.id)}
          onClickShare={() => handleShare(props.currentVideo.id)}
          onClickComments={handleOpenComments}
        />

        {/* 버튼은 비디오 위에, 중앙에 위치 */}
        {!isPlaying && props.depth < 6 && (
          <PrimaryButton
            onClick={() => props.onStartEnsemble(props.currentVideo.id)}
            style={{
              width: "50%",
              position: "absolute",
              bottom: "8px",
              boxShadow: "0 0 5px 0 rgba(0, 0, 0, 0.3)",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10, // 다른 요소 위에 오도록 z-index 설정
            }}
          >
            합주하기
          </PrimaryButton>
        )}
      </motion.div>

      {/* --- Render the Comment Modal --- */}
      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={handleCloseComments}
        comments={comments}
        onAddComment={handleAddComment}
      />
    </>
  );
};

export default VinylContents;
