// React-Native-Video와 Android Compiler간 충돌 => Node_modules
// https://github.com/r0b0t3d/react-native-video/blob/master/android/src/main/java/com/brentvatne/common/react/VideoEventEmitter.kt
// 참고하여 해결하기

// Android FFmpeg 오류
// https://medium.com/@nooruddinlakhani/resolved-ffmpegkit-retirement-issue-in-react-native-a-complete-guide-0f54b113b390
// 참고하여 해결하기

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components/native';
import { SafeAreaView, Alert, Platform, TextStyle } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import Video, { OnLoadData } from 'react-native-video';
import { RouteProp, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

import SingleVideoEditor from '../components/SingleVideoEditor';
import { generateCollageFilterComplex } from '../utils/ffmpegFilters';
import {
  TrimmerState,
  SingleEditorHandles,
  EQBand,
  EditData,
  MediaItem,
  RootStackParamList,
} from '../types';
import CommonButton from '../components/Common/CommonButton';
import SectionHeader from '../components/Common/SectionHeader';
import axiosInstance from '../api/axiosInstance';

// JWT 페이로드 타입 정의
interface CustomJwtPayload {
  userId: string;
}

// [수정] 타입을 로컬로 재정의하여 파일 동기화 문제 우회
type LocalVideoEditParams = {
  videos?: MediaItem[];
  parentVideoId?: string;
  total_slots?: number;
};

// 기본 EQ 밴드 설정
const defaultEQBands: EQBand[] = [
  { id: 'band1', frequency: 60, gain: 0 },
  { id: 'band2', frequency: 250, gain: 0 },
  { id: 'band3', frequency: 1000, gain: 0 },
  { id: 'band4', frequency: 4000, gain: 0 },
  { id: 'band5', frequency: 12000, gain: 0 },
];

// [추가] URI를 FFmpeg가 인식 가능한 순수 파일 경로로 변환하는 헬퍼 함수
const cleanUri = (uri: string): string => {
  if (!uri) return '';
  let path = uri;
  // URL 인코딩된 문자(예: %20 -> 공백)를 디코딩
  path = decodeURIComponent(path);
  // 'file://' 접두사 제거
  if (path.startsWith('file://')) {
    path = path.substring(7);
  }
  return path;
};

// Styled Components 정의 (이전과 동일)
const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: #2c3e50;
`;

const ContentScrollView = styled.ScrollView`
  padding-bottom: 50px;
`;

const GlobalActionsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-horizontal: 15px;
  margin-bottom: 20px;
  background-color: #34495e;
  padding: 10px;
  border-radius: 10px;
`;

const GlobalActionButton = styled(CommonButton)`
  background-color: #3498db;
  padding-vertical: 10px;
  padding-horizontal: 12px;
  border-radius: 8px;
  margin-bottom: 0; /* CommonButton의 기본 마진 오버라이드 */
  flex: 1; /* 공간을 균등하게 분배 */
  margin-horizontal: 5px; /* 버튼 간 작은 간격 */
`;

const GlobalButtonText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
`;

const CreateCollageSection = styled.View`
  margin-horizontal: 15px;
  margin-top: 20px;
  margin-bottom: 40px;
`;

const CreateCollageButton = styled(CommonButton)`
  background-color: #27ae60; /* 녹색으로 콜라주 생성 버튼 강조 */
`;

const VideoEditScreen: React.FC<{
  route: RouteProp<{ VideoEdit: LocalVideoEditParams }, 'VideoEdit'>;
}> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { videos = [], total_slots = 1 } = route.params ?? {};
  const [trimmers, setTrimmers] = useState<TrimmerState[]>([]);
  const editorRefs = useRef<Record<string, SingleEditorHandles | null>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const initialTrimmers = Array.from({ length: total_slots }, (_, i) => {
      const video = videos[i] || null;
      return {
        id: `trimmer${i + 1}`,
        sourceVideo: video,
        startTime: 0,
        endTime: 0,
        duration: 0,
        equalizer: JSON.parse(JSON.stringify(defaultEQBands)),
        volume: 1,
        aspectRatio: 'original',
        originalAspectRatioValue: '1.777',
      };
    });
    console.log(
      '[VideoEditScreen] Trimmer slots initialized:',
      initialTrimmers.map(t => ({ id: t.id, hasVideo: !!t.sourceVideo })),
    );
    setTrimmers(initialTrimmers);
  }, [videos, total_slots]);

  const handleTrimmerUpdate = (
    id: string,
    newState: Partial<Omit<TrimmerState, 'id'>>,
  ) => {
    console.log(`[VideoEditScreen] '${id}' state update received:`, newState);
    setTrimmers(prevTrimmers =>
      prevTrimmers.map(trimmer =>
        trimmer.id === id ? { ...trimmer, ...newState } : trimmer,
      ),
    );
  };

  const handleVideoLoad = (
    id: string,
    data: OnLoadData,
    aspectRatio: string,
  ) => {
    console.log(
      `[VideoEditScreen] Video '${id}' loaded. DURATION: ${data.duration}, AR: ${aspectRatio}`,
    );
    handleTrimmerUpdate(id, {
      duration: data.duration,
      endTime: data.duration,
      originalAspectRatioValue: aspectRatio,
    });
  };

  const handleGlobalPlay = () => {
    console.log('[VideoEditScreen] Global Play button clicked');
    Object.values(editorRefs.current).forEach(ref => ref?.playVideo());
  };

  const handleGlobalPause = () => {
    console.log('[VideoEditScreen] Global Pause button clicked');
    Object.values(editorRefs.current).forEach(ref => ref?.pauseVideo());
  };

  const handleGlobalSeekToStart = () => {
    console.log('[VideoEditScreen] Global Seek to Start button clicked');
    Object.values(editorRefs.current).forEach(ref => ref?.seekToStart());
  };

  const processVideoForUpload = async () => {
    const activeTrimmers = trimmers.filter(
      t => t.sourceVideo && t.duration > 0,
    );
    if (activeTrimmers.length === 0) {
      Alert.alert('오류', '업로드할 비디오를 선택해주세요.');
      return;
    }

    console.log(
      '[VideoEditScreen] Starting video processing for upload (SKIPPING FFMPEG)...',
    );
    setIsProcessing(true);

    try {
      // --- FFmpeg 처리 로직 임시 비활성화 (나중에 복구해야 할 코드) ---
      /*
      console.log('[VideoEditScreen] Starting collage creation...');
      const editData: EditData = {
        trimmers: activeTrimmers.map(t => ({
          startTime: t.startTime,
          endTime: t.endTime,
          volume: t.volume,
          aspectRatio:
            t.aspectRatio === 'original' && t.originalAspectRatioValue
              ? t.originalAspectRatioValue
              : t.aspectRatio,
          equalizer: t.equalizer.map(({ frequency, gain }) => ({
            frequency,
            gain,
          })),
        })),
      };

      const filterComplexArray = generateCollageFilterComplex(editData);
      const filterComplexString = filterComplexArray.join('; ');

      const inputVideos = activeTrimmers.map(t => t.sourceVideo!);
      const inputCommands = inputVideos
        .map(v => `-i "${cleanUri(v.uri)}"`)
        .join(' ');

      const outputPath_original = `${
        RNFS.DocumentDirectoryPath
      }/collage_${Date.now()}.mp4`;
      const hasAudio = activeTrimmers.some(t => t.volume > 0);
      const audioMapCommand = hasAudio ? '-map "[a]"' : '';

      const encoder =
        Platform.OS === 'ios'
          ? '-c:v h264_videotoolbox -b:v 2M'
          : '-c:v h264_mediacodec';

      const command = `${inputCommands} -filter_complex "${filterComplexString}" -map "[v]" ${audioMapCommand} ${encoder} -preset fast -crf 28 -shortest "${outputPath_original}"`;
      
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (!ReturnCode.isSuccess(returnCode)) {
        const errorLogs = await session.getLogsAsString();
        Alert.alert(
          '오류',
          '비디오 처리 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.',
        );
        console.error(
          '[VideoEditScreen] FFmpeg execution failed! Detailed logs:',
          errorLogs,
        );
        setIsProcessing(false);
        return; // FFmpeg 실패 시 함수 종료
      }
      
      // FFmpeg 성공 시의 outputPath를 업로드에 사용해야 함
      // const resultUriToUpload = outputPath_original;
      */

      // FFmpeg를 건너뛰고 원본 비디오를 직접 업로드/처리하는 로직
      const getPresignedUrlAndUpload = async (video: any) => {
        if (!video) {
          Alert.alert('오류', '업로드할 비디오가 선택되지 않았습니다.');
          return;
        }
        try {
          setUploading(true);

          // 1. Presigned URL 요청
          const urlsResponse = await axiosInstance.post(
            '/video-insert/upload-urls',
            {
              fileType: video.type,
            },
          );
          const { videoUrl, thumbnailUrl, videoKey, thumbnailKey } =
            urlsResponse.data;

          // 2. S3로 파일 업로드 (fetch 사용)
          console.log('Uploading original video to S3 using fetch...');
          const uploadFile = async (url: string, file: any) => {
            const response = await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': file.type },
              body: file,
            });
            if (!response.ok) {
              const responseText = await response.text();
              throw new Error(
                `S3 Upload Failed: ${response.status} ${responseText}`,
              );
            }
            return response;
          };

          // 비디오와 (임시)썸네일을 병렬로 업로드
          await Promise.all([
            uploadFile(videoUrl, video),
            uploadFile(thumbnailUrl, video),
          ]);
          console.log('S3 Upload successful for video and thumbnail.');

          // 3. 메타데이터 저장
          console.log('Saving video metadata to DB...');

          // --- 유저 ID 가져오기 ---
          const token = await AsyncStorage.getItem('accessToken');
          if (!token) {
            Alert.alert(
              '오류',
              '로그인 정보가 없습니다. 업로드를 진행할 수 없습니다.',
            );
            return;
          }
          const decodedToken = jwtDecode<CustomJwtPayload>(token);
          const userId = decodedToken.userId;
          if (!userId) {
            Alert.alert(
              '오류',
              '사용자 ID를 확인할 수 없습니다. 다시 로그인해주세요.',
            );
            return;
          }
          // --- 유저 ID 가져오기 끝 ---

          await axiosInstance.post('/video-insert/complete', {
            user_id: userId,
            results_video_key: videoKey,
            source_video_key: videoKey,
            thumbnail_key: thumbnailKey,
            parent_video_id: null,
            depth: 1,
          });
          console.log('Metadata saved.');

          Alert.alert('성공', '비디오가 성공적으로 업로드되었습니다.');

          // 업로드 성공 후 WebScreen으로 돌아가면서 스택 초기화
          navigation.reset({
            index: 0,
            routes: [{ name: 'Web' }],
          });
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          Alert.alert('오류', '업로드 중 오류가 발생했습니다.');
        } finally {
          setUploading(false);
        }
      };

      // --- 테스트용 임시 로직: 원본 비디오를 바로 사용 ---
      const firstVideo = activeTrimmers[0].sourceVideo;
      const firstTrimmer = activeTrimmers[0];
      if (firstVideo) {
        // 비디오 업로드 및 메타데이터 저장
        await getPresignedUrlAndUpload({
          ...firstVideo,
          uri: cleanUri(firstVideo.uri),
          duration: firstTrimmer.duration, // 영상 길이 전달
        });
      }
    } catch (error) {
      console.error('[VideoEditScreen] Upload process failed:', error);
      Alert.alert('오류', '업로드 과정에서 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScreenContainer>
      <ContentScrollView contentInsetAdjustmentBehavior="automatic">
        {trimmers.map(trimmerState => (
          <SingleVideoEditor
            key={trimmerState.id}
            ref={el => {
              editorRefs.current[trimmerState.id] = el;
            }}
            trimmerState={trimmerState}
            onUpdate={handleTrimmerUpdate}
            onVideoLoad={handleVideoLoad}
          />
        ))}

        {/* 전역 재생 컨트롤러 */}
        <GlobalActionsContainer>
          <GlobalActionButton onPress={handleGlobalSeekToStart}>
            <GlobalButtonText>위치 초기화</GlobalButtonText>
          </GlobalActionButton>
          <GlobalActionButton onPress={handleGlobalPlay}>
            <GlobalButtonText>동시 재생</GlobalButtonText>
          </GlobalActionButton>
          <GlobalActionButton onPress={handleGlobalPause}>
            <GlobalButtonText>동시 정지</GlobalButtonText>
          </GlobalActionButton>
        </GlobalActionsContainer>

        <CreateCollageSection>
          <CreateCollageButton
            onPress={processVideoForUpload}
            isLoading={isProcessing}
            disabled={isProcessing}
          >
            <GlobalButtonText>편집 완료 및 업로드</GlobalButtonText>
          </CreateCollageButton>
        </CreateCollageSection>
      </ContentScrollView>
    </ScreenContainer>
  );
};

export default VideoEditScreen;
