// React-Native-Video와 Android Compiler간 충돌 => Node_modules
// https://github.com/r0b0t3d/react-native-video/blob/master/android/src/main/java/com/brentvatne/common/react/VideoEventEmitter.kt
// 참고하여 해결하기

// Android FFmpeg 오류
// https://medium.com/@nooruddinlakhani/resolved-ffmpegkit-retirement-issue-in-react-native-a-complete-guide-0f54b113b390
// 참고하여 해결하기

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components/native';
import {
  SafeAreaView,
  Alert,
  Platform,
  TextStyle,
  ScrollView,
  View,
  LayoutChangeEvent,
  UIManager,
  PanResponder,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import { OnLoadData, OnProgressData } from 'react-native-video';
import { RouteProp, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  Rewind,
  AlignStartVertical,
  AlignEndVertical,
} from 'lucide-react-native';

import Timeline from '../components/Editor/Timeline';
import VideoPreviewSlot, {
  VideoPreviewSlotHandles,
} from '../components/Editor/VideoPreviewSlot';
import VideoControlSet from '../components/Editor/VideoControlSet';
import { generateCollageFilterComplex } from '../utils/ffmpegFilters';
import {
  TrimmerState,
  EQBand,
  EditData,
  MediaItem,
  RootStackParamList,
  Video as ServerVideo,
  formatTime,
  PlaybackState,
} from '../types';
import CommonButton from '../components/Common/CommonButton';
import SectionHeader from '../components/Common/SectionHeader';
import axiosInstance from '../api/axiosInstance';
import PreviewPanel from '../components/Editor/PreviewPanel';

// LayoutAnimation을 Android에서 활성화
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DRAGGER_HEIGHT = 16;

// JWT 페이로드 타입 정의
interface CustomJwtPayload {
  id: string;
}

// [수정] 타입을 로컬로 재정의하여 파일 동기화 문제 우회
type LocalVideoEditParams = {
  videos?: MediaItem[];
  parentVideoId?: string;
  total_slots?: number;
  sourceVideos?: ServerVideo[];
};

// =================================================================================
// 1. 타입 정의, 상수 및 헬퍼 함수
// =================================================================================

// 기본 EQ 밴드 설정: 이퀄라이저의 초기값
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

// =================================================================================
// 2. 스타일 컴포넌트 (UI)
// =================================================================================

// Styled Components 정의
const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: #000000;
`;

// 하단 컨트롤(타임라인, 버튼 등) 영역 전체 래퍼
const ControlsWrapper = styled.View`
  flex: 1;
  background-color: #000000; /* 배경색 추가 */
`;

// 전역 액션 버튼 (재생, 정지 등)
const GlobalActionButton = styled(CommonButton)`
  padding-vertical: 10px;
  padding-horizontal: 12px;
  border-radius: 8px;
  margin-bottom: 0; /* CommonButton의 기본 마진 오버라이드 */
  flex: 1; /* 공간을 균등하게 분배 */
  margin-horizontal: 5px; /* 버튼 간 작은 간격 */
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

// 프리뷰와 컨트롤 영역 사이의 높이 조절 드래거
const Dragger = styled.View`
  width: 100%;
  height: 20px;
  background-color: #000000;
  justify-content: center;
  align-items: center;
  cursor: row-resize;
`;

const DragHandle = styled.View`
  width: 100px;
  height: 5px;
  background-color: #ffffff;
  border-radius: 2.5px;
`;

// 컨트롤 영역 내 스크롤 가능한 뷰
const ControlsScrollView = styled.ScrollView`
  flex: 1;
`;

// 전역 재생/정지 버튼들을 담는 컨테이너
const GlobalActionsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  background-color: #000000;
  max-width: 200px;
  align-self: center;
  align-items: center; /* 아이콘 정렬을 위해 추가 */
`;

// 아이콘 버튼 (현재 사용되지 않음)
const IconButton = styled.TouchableOpacity`
  padding: 10px;
`;

// 전역 버튼 텍스트 (현재 사용되지 않음)
const GlobalButtonText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
`;

const CreateCollageSection = styled.View`
  margin: 15px;
  padding-bottom: 40px; /* Make space for button */
`;

const CreateCollageButton = styled(CommonButton)`
  background-color: #27ae60;
`;

// =================================================================================
// 3. 메인 컴포넌트 및 상태 관리
// =================================================================================
const VideoEditScreen: React.FC<{
  route: RouteProp<{ VideoEdit: LocalVideoEditParams }, 'VideoEdit'>;
}> = ({ route }) => {
  // --- 3.1. Hooks 및 라우트 파라미터 ---
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets(); // 디바이스 노치/하단바 영역 계산
  const {
    videos: localVideos = [], // 로컬에서 촬영/선택된 비디오
    total_slots = 1, // 총 비디오 슬롯 개수
    sourceVideos: serverVideos = [], // 부모 비디오 정보 (서버에서 옴)
  } = route.params ?? {};

  // --- 3.2. 화면 레이아웃 관련 상태 ---
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  const minControlHeight = 120; // 컨트롤 영역의 최소 높이

  // 프리뷰 영역의 최대/최소 높이 계산
  const maxPreviewHeight =
    screenHeight -
    insets.top -
    insets.bottom -
    minControlHeight -
    DRAGGER_HEIGHT;
  const minPreviewHeight = screenWidth * (3 / 4);

  const [previewHeight, setPreviewHeight] = useState(maxPreviewHeight); // 프리뷰 영역의 현재 높이 (드래그로 조절)
  const dragStartHeight = useRef(0); // 드래그 시작 시점의 높이
  const heightRef = useRef(previewHeight); // stale state 문제를 피하기 위한 ref

  // --- 3.3. 비디오 편집 및 재생 상태 ---
  // previewHeight 상태가 변경될 때마다 ref의 값도 동기화
  useEffect(() => {
    heightRef.current = previewHeight;
  }, [previewHeight]);

  // 드래그하여 프리뷰 높이를 조절하는 PanResponder 설정
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // stale state인 previewHeight 대신, 항상 최신 값을 가지는 ref를 사용
        dragStartHeight.current = heightRef.current;
      },
      onPanResponderMove: (e, gestureState) => {
        const newHeight = dragStartHeight.current + gestureState.dy;

        // 높이 제한 적용
        const clampedHeight = Math.max(
          minPreviewHeight,
          Math.min(newHeight, maxPreviewHeight),
        );

        setPreviewHeight(clampedHeight);
      },
      onPanResponderRelease: () => {
        // 필요 시 여기에 스냅 로직 추가 가능
      },
    }),
  ).current;

  const [trimmers, setTrimmers] = useState<TrimmerState[]>([]); // 각 비디오의 편집 정보(자르기, 볼륨 등) 배열
  const [playbackStates, setPlaybackStates] = useState<
    Record<string, PlaybackState>
  >({}); // 각 비디오의 재생 상태 (현재 시간, 정지 여부)
  const [isProcessing, setIsProcessing] = useState(false); // FFmpeg 처리 중 여부
  const [uploading, setUploading] = useState(false); // S3 업로드 중 여부
  const [previewScale, setPreviewScale] = useState(1); // 가상 캔버스의 스케일 값
  const [isGloballyPlaying, setIsGloballyPlaying] = useState(false); // 전체 동시 재생 여부
  const [globalStartTime, setGlobalStartTime] = useState(0); // 모든 비디오가 동시에 재생될 수 있는 시작 시간
  const [globalEndTime, setGlobalEndTime] = useState(0); // 모든 비디오가 동시에 재생될 수 있는 끝 시간
  const [timelinePosition, setTimelinePosition] = useState(0); // 타임라인의 현재 재생 헤드 위치
  const [timelineHeight, setTimelineHeight] = useState(100); // 타임라인의 동적 높이
  const previewSlotRefs = useRef<
    Record<string, VideoPreviewSlotHandles | null>
  >({}); // 각 비디오 프리뷰 컴포넌트의 ref 모음 (seek 등 직접 조작용)
  const [seekTrigger, setSeekTrigger] = useState(0); // [추가] seek useEffect를 수동으로 트리거하기 위한 상태

  // =================================================================================
  // 4. useEffects (상태 변경에 따른 부가 효과 처리)
  // =================================================================================

  // [추가 -> 수정] 타임라인 위치 변경 핸들러 (useCallback으로 최적화)
  const handleTimelinePositionChange = useCallback((time: number) => {
    setTimelinePosition(time);
  }, []);

  // 타임라인 재생 헤드 위치가 바뀌면, 각 비디오의 재생 위치(seek)를 동기화
  useEffect(() => {
    if (!isGloballyPlaying) {
      trimmers.forEach(trimmer => {
        const ref = previewSlotRefs.current[trimmer.id];
        if (ref && trimmer.sourceVideo) {
          const clipDuration = trimmer.endTime - trimmer.startTime;
          const trackStartTime = trimmer.timelinePosition;
          const trackEndTime = trackStartTime + clipDuration;

          let seekTime;

          if (timelinePosition < trackStartTime) {
            // 재생 헤드가 클립 시작점보다 앞에 있으면, 클립의 시작 부분으로 이동
            seekTime = trimmer.startTime;
          } else if (timelinePosition > trackEndTime) {
            // 재생 헤드가 클립 끝 지점보다 뒤에 있으면, 클립의 끝 부분으로 이동
            seekTime = trimmer.endTime;
          } else {
            // 재생 헤드가 클립 내에 있으면, 올바른 상대 시간 계산
            const timeIntoClip = timelinePosition - trackStartTime;
            seekTime = trimmer.startTime + timeIntoClip;
          }

          if (ref && isFinite(seekTime)) {
            ref.seek(seekTime);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelinePosition, isGloballyPlaying, seekTrigger]); // [수정] seekTrigger 의존성 추가

  // 컴포넌트 마운트 시, 전달받은 비디오 정보로 Trimmer 초기 상태 설정
  useEffect(() => {
    const finalVideos = localVideos || [];
    const numSlots = finalVideos.length > 0 ? finalVideos.length : total_slots;

    const initialTrimmers = Array.from({ length: numSlots }, (_, i) => {
      const video = finalVideos[i] || null;
      const id = `trimmer${i + 1}`;
      return {
        id,
        sourceVideo: video,
        duration: 0, // Initially 0, will be updated on load
        startTime: 0,
        endTime: 0, // Initially 0, will be updated on load
        timelinePosition: 0,
        isPlaying: false,
        isMuted: false,
        volume: 1,
        equalizer: defaultEQBands,
        aspectRatio: 'original',
        originalAspectRatioValue: '1.777',
      };
    });
    setTrimmers(initialTrimmers);

    const initialPlaybackStates: Record<
      string,
      { currentTime: number; isPaused: boolean }
    > = {};
    initialTrimmers.forEach(t => {
      initialPlaybackStates[t.id] = { currentTime: 0, isPaused: true };
    });
    setPlaybackStates(initialPlaybackStates);
  }, [localVideos, total_slots]);

  // Trimmer 정보(시작/끝 시간 등)가 변경될 때마다 전역 시작/끝 시간 다시 계산
  useEffect(() => {
    if (trimmers.length > 0 && trimmers.every(t => t.duration > 0)) {
      // timelinePosition을 기준으로 실제 트랙의 시작 시간 계산
      const trackStartTimes = trimmers.map(t => t.timelinePosition);
      // timelinePosition과 클립의 실제 길이를 더해 실제 트랙의 종료 시간 계산
      const trackEndTimes = trimmers.map(
        t => t.timelinePosition + (t.endTime - t.startTime),
      );

      const maxStart = Math.max(...trackStartTimes);
      const minEnd = Math.min(...trackEndTimes);

      setGlobalStartTime(maxStart);
      setGlobalEndTime(minEnd < maxStart ? maxStart : minEnd);
    } else {
      setGlobalStartTime(0);
      setGlobalEndTime(0);
    }
  }, [trimmers]);

  // =================================================================================
  // 5. 핸들러 함수 (이벤트 처리)
  // =================================================================================

  // 프리뷰 영역의 레이아웃이 변경될 때 가상 캔버스의 스케일 계산
  const handlePreviewLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      const scale = Math.min(
        width / 540, // VIRTUAL_WIDTH
        height / 960, // VIRTUAL_HEIGHT
      );
      setPreviewScale(scale);
    }
  };

  // 자식 컴포넌트(VideoControlSet)에서 Trimmer 상태가 변경되었을 때 호출됨
  const handleTrimmerUpdate = (
    id: string,
    newState: Partial<Omit<TrimmerState, 'id'>>,
  ) => {
    setTrimmers(prev =>
      prev.map(trimmer =>
        trimmer.id === id ? { ...trimmer, ...newState } : trimmer,
      ),
    );
    setSeekTrigger(c => c + 1); // [추가] 비디오 위치 조정을 수동으로 트리거
  };

  // 개별 비디오의 재생 상태(현재 시간, 일시정지) 업데이트
  const handlePlaybackUpdate = (
    id: string,
    newState: Partial<PlaybackState>,
  ) => {
    setPlaybackStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...newState },
    }));
  };

  // 비디오 로딩 완료 시 (onLoad), 비디오 길이(duration) 상태 업데이트
  const handleVideoLoad = (id: string, data: OnLoadData) => {
    handleTrimmerUpdate(id, {
      duration: data.duration,
      endTime: data.duration,
    });
    handlePlaybackUpdate(id, { currentTime: 0 });
  };

  // 비디오 재생 중 주기적으로 호출 (onProgress)
  const handleProgress = (id: string, data: OnProgressData) => {
    // [수정] 전역 재생 중일 때만 상태를 업데이트하여 무한 루프를 방지합니다.
    if (isGloballyPlaying) {
      // 특정 비디오의 현재 시간을 항상 업데이트합니다.
      handlePlaybackUpdate(id, { currentTime: data.currentTime });

      // 타임라인 위치를 결정하는 첫 번째 비디오의 진행 정보일 때만 정지 로직을 실행합니다.
      if (trimmers.length > 0 && id === trimmers[0].id) {
        // 부동소수점 오차를 고려하여 아주 작은 허용치(epsilon)를 두고 비교합니다.
        const epsilon = 0.05; // 50ms
        if (
          globalEndTime > 0 &&
          data.currentTime >= globalEndTime - epsilon // endTime 직전에 멈추도록 조건 변경
        ) {
          handleGlobalPause(); // 모든 비디오를 일시 정지시킵니다.
          setIsGloballyPlaying(false); // 재생/일시정지 버튼 상태를 업데이트합니다.
        }
      }
    }
  };

  // 개별 비디오 재생/일시정지/정지/탐색 핸들러
  const handlePlay = (id: string) =>
    handlePlaybackUpdate(id, { isPaused: false });
  const handlePause = (id: string) =>
    handlePlaybackUpdate(id, { isPaused: true });
  const handleStop = (id: string) => {
    const trimmer = trimmers.find(t => t.id === id);
    if (trimmer) {
      previewSlotRefs.current[id]?.seek(trimmer.startTime);
      handlePlaybackUpdate(id, {
        isPaused: true,
        currentTime: trimmer.startTime,
      });
    }
  };

  const handleSeek = (id: string, time: number) => {
    previewSlotRefs.current[id]?.seek(time);
    handlePlaybackUpdate(id, { currentTime: time });
  };

  // --- 5.3. 전역 컨트롤 핸들러 ---
  // 모든 비디오 동시 재생 (현재는 사용되지 않고 handleToggleGlobalPlay로 통합됨)
  const handleGlobalPlay = () => {
    trimmers.forEach(t => handlePlaybackUpdate(t.id, { isPaused: false }));
  };

  // 모든 비디오 동시 일시정지
  const handleGlobalPause = () => {
    trimmers.forEach(t => handlePlaybackUpdate(t.id, { isPaused: true }));
  };

  // 전역 재생/일시정지 버튼 토글
  const handleToggleGlobalPlay = () => {
    const shouldPlay = !isGloballyPlaying;

    if (shouldPlay) {
      // 재생 시작 시, 모든 비디오를 globalStartTime으로 직접 이동
      trimmers.forEach(t => {
        if (previewSlotRefs.current[t.id]) {
          previewSlotRefs.current[t.id]?.seek(globalStartTime);
          handlePlaybackUpdate(t.id, {
            currentTime: globalStartTime,
            isPaused: false, // 즉시 재생할 것이므로 false
          });
        }
      });
      // 타임라인 위치도 동기화합니다.
      setTimelinePosition(globalStartTime);
    } else {
      // 정지 시에는 모든 비디오를 단순히 일시정지시킵니다.
      handleGlobalPause();
    }
    // 최종적으로 재생 상태를 업데이트합니다.
    setIsGloballyPlaying(shouldPlay);
  };

  // 모든 비디오를 동시 재생 시작점으로 이동
  const handleGlobalSeekToStart = () => {
    // [수정] 이 함수는 이제 '처음으로' 버튼을 눌렀을 때만 사용되며,
    // 항상 비디오를 멈추고 globalStartTime으로 이동시킵니다.
    trimmers.forEach(t => {
      if (previewSlotRefs.current[t.id]) {
        previewSlotRefs.current[t.id]?.seek(globalStartTime);
        handlePlaybackUpdate(t.id, {
          currentTime: globalStartTime,
          isPaused: true,
        });
      }
    });
    // 타임라인 위치도 동기화합니다.
    setTimelinePosition(globalStartTime);
    setIsGloballyPlaying(false);
  };

  // 자식(VideoPreviewSlot)의 ref를 부모(이 컴포넌트)의 ref 객체에 저장
  const setPreviewSlotRef = (
    id: string,
    ref: VideoPreviewSlotHandles | null,
  ) => {
    previewSlotRefs.current[id] = ref;
  };

  // =================================================================================
  // 6. 핵심 로직: 비디오 처리 및 업로드
  // =================================================================================

  // '콜라주 생성 및 업로드' 버튼 클릭 시 실행되는 메인 함수
  const processVideoForUpload = async () => {
    setIsProcessing(true);

    try {
      console.log('[VideoEditScreen] Starting collage creation...');
      // 편집할 비디오가 하나 이상 있는지 확인합니다.
      const activeTrimmers = trimmers.filter(t => t.sourceVideo);
      if (activeTrimmers.length === 0) {
        Alert.alert('오류', '편집할 비디오가 없습니다.');
        setIsProcessing(false); // 처리 중 상태를 해제해야 합니다.
        return;
      }

      // 6.1. FFmpeg 필터 및 명령어 생성
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

      const collageOutputPath = `${
        RNFS.DocumentDirectoryPath
      }/collage_${Date.now()}.mp4`;
      const hasAudio = activeTrimmers.some(t => t.volume > 0);
      const mapCommand = hasAudio ? '-map "[v]" -map "[a]"' : '-map "[v]"';

      const encoder =
        Platform.OS === 'ios' ? 'h264_videotoolbox' : 'h264_mediacodec';

      const command = `${inputCommands} -filter_complex "${filterComplexString}" ${mapCommand} -c:v ${encoder} -c:a aac -b:a 192k -movflags +faststart "${collageOutputPath}"`;

      console.log('[VideoEditScreen] Executing FFmpeg command:', command);

      // 6.2. FFmpeg 실행: 콜라주 비디오 생성
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        Alert.alert('성공', '비디오 콜라주가 성공적으로 생성되었습니다.');
        console.log(
          `[VideoEditScreen] Collage video saved to: ${collageOutputPath}`,
        );

        // --- 6.3. FFmpeg 실행: 썸네일 추출 ---
        console.log('[VideoEditScreen] Starting thumbnail extraction...');
        const thumbnailOutputPath = `${
          RNFS.DocumentDirectoryPath
        }/thumbnail_${Date.now()}.jpg`;
        const thumbnailCommand = `-i "${collageOutputPath}" -ss 00:00:01.000 -vframes 1 -q:v 2 "${thumbnailOutputPath}"`;

        const thumbnailSession = await FFmpegKit.execute(thumbnailCommand);
        const thumbnailReturnCode = await thumbnailSession.getReturnCode();

        if (ReturnCode.isSuccess(thumbnailReturnCode)) {
          Alert.alert('성공', '썸네일도 성공적으로 생성되었습니다.');
          console.log(
            `[VideoEditScreen] Thumbnail saved to: ${thumbnailOutputPath}`,
          );

          // --- 6.4. FFmpeg 실행: 마지막 소스 비디오 최적화 ---
          console.log(
            '[VideoEditScreen] Starting source video optimization...',
          );
          const lastVideo =
            activeTrimmers[activeTrimmers.length - 1].sourceVideo;
          if (lastVideo) {
            const optimizedSourceOutputPath = `${
              RNFS.DocumentDirectoryPath
            }/optimized_source_${Date.now()}.mp4`;
            const optimizedSourceCommand = `-i "${cleanUri(
              lastVideo.uri,
            )}" -c:v ${encoder} -vf "scale=540:-2" -c:a aac -b:a 128k -y "${optimizedSourceOutputPath}"`;

            const optimizedSession = await FFmpegKit.execute(
              optimizedSourceCommand,
            );
            const optimizedReturnCode = await optimizedSession.getReturnCode();

            if (ReturnCode.isSuccess(optimizedReturnCode)) {
              Alert.alert(
                '성공',
                '소스 비디오 최적화도 완료되었습니다. 모든 준비가 끝났습니다!',
              );
              console.log(
                `[VideoEditScreen] Optimized source video saved to: ${optimizedSourceOutputPath}`,
              );

              // --- (나중에 변환) 확인용으로 생성된 파일들을 갤러리에 저장 ---
              try {
                console.log(
                  '[VideoEditScreen] Saving generated files to device gallery for verification...',
                );
                await CameraRoll.save(`file://${collageOutputPath}`, {
                  type: 'video',
                });
                await CameraRoll.save(`file://${thumbnailOutputPath}`, {
                  type: 'photo',
                });
                await CameraRoll.save(`file://${optimizedSourceOutputPath}`, {
                  type: 'video',
                });
                Alert.alert(
                  '저장 완료',
                  '생성된 파일들이 갤러리에 저장되었습니다.',
                );
                console.log(
                  '[VideoEditScreen] All files saved to device gallery.',
                );
              } catch (saveError) {
                console.error(
                  '[VideoEditScreen] Failed to save files to device:',
                  saveError,
                );
                Alert.alert(
                  '저장 실패',
                  '파일을 갤러리에 저장하는 중 오류가 발생했습니다.',
                );
              }
              // --- 확인용 로직 종료 ---

              // --- 6.5. 백엔드 통신: Presigned URL 요청 ---
              try {
                console.log(
                  '[VideoEditScreen] Requesting presigned URLs for 3 files...',
                );

                // JWT 토큰에서 사용자 ID 추출
                const token = await AsyncStorage.getItem('accessToken');
                if (!token) {
                  throw new Error('로그인 토큰을 찾을 수 없습니다.');
                }
                const decodedToken = jwtDecode<CustomJwtPayload>(token);
                const userId = decodedToken.id;

                // 업로드할 파일 정보 준비 (3개 파일 모두 요청)
                const filesToUpload = [
                  {
                    purpose: 'RESULT_VIDEO',
                    fileType: 'video/mp4',
                    localPath: collageOutputPath,
                  },
                  {
                    purpose: 'THUMBNAIL',
                    fileType: 'image/jpeg',
                    localPath: thumbnailOutputPath,
                  },
                  {
                    purpose: 'SOURCE_VIDEO',
                    fileType: 'video/mp4',
                    localPath: optimizedSourceOutputPath,
                  },
                ];

                // 백엔드에 Presigned URL 일괄 요청 (3개 파일)
                const presignedUrlResponse = await axiosInstance.post(
                  '/video-insert/upload-urls',
                  {
                    purposes: filesToUpload.map(f => ({
                      purpose: f.purpose,
                      fileType: f.fileType,
                    })),
                  },
                );

                console.log(
                  '[VideoEditScreen] Full response:',
                  presignedUrlResponse.data,
                );
                const responseData = presignedUrlResponse.data;

                // 응답 구조를 자세히 로깅
                console.log(
                  '[VideoEditScreen] Response keys:',
                  Object.keys(responseData),
                );
                console.log(
                  '[VideoEditScreen] RESULT_VIDEO exists:',
                  !!responseData.RESULT_VIDEO,
                );
                console.log(
                  '[VideoEditScreen] THUMBNAIL exists:',
                  !!responseData.THUMBNAIL,
                );
                console.log(
                  '[VideoEditScreen] SOURCE_VIDEO exists:',
                  !!responseData.SOURCE_VIDEO,
                );

                // 백엔드 응답 구조 확인 및 매핑
                if (
                  !responseData.RESULT_VIDEO ||
                  !responseData.THUMBNAIL ||
                  !responseData.SOURCE_VIDEO
                ) {
                  console.error('[VideoEditScreen] Missing URLs in response:', {
                    hasResultVideo: !!responseData.RESULT_VIDEO,
                    hasThumbnail: !!responseData.THUMBNAIL,
                    hasSourceVideo: !!responseData.SOURCE_VIDEO,
                    actualKeys: Object.keys(responseData),
                  });
                  throw new Error(
                    '백엔드에서 필요한 URL을 모두 받지 못했습니다.',
                  );
                }

                // 올바른 응답 구조에 맞춰 매핑
                const urlMappings = [
                  {
                    purpose: 'RESULT_VIDEO',
                    presignedUrl: responseData.RESULT_VIDEO.url,
                    s3Key: responseData.RESULT_VIDEO.key,
                    localPath: collageOutputPath,
                    fileType: 'video/mp4',
                  },
                  {
                    purpose: 'THUMBNAIL',
                    presignedUrl: responseData.THUMBNAIL.url,
                    s3Key: responseData.THUMBNAIL.key,
                    localPath: thumbnailOutputPath,
                    fileType: 'image/jpeg',
                  },
                  {
                    purpose: 'SOURCE_VIDEO',
                    presignedUrl: responseData.SOURCE_VIDEO.url,
                    s3Key: responseData.SOURCE_VIDEO.key,
                    localPath: optimizedSourceOutputPath,
                    fileType: 'video/mp4',
                  },
                ];

                console.log(
                  '[VideoEditScreen] Mapped URLs for upload:',
                  urlMappings,
                );

                Alert.alert('성공', 'S3 업로드 URL을 성공적으로 받아왔습니다.');

                // --- 6.6. S3에 병렬 업로드 ---
                console.log(
                  '[VideoEditScreen] Starting parallel upload to S3...',
                );
                setUploading(true);

                const uploadPromises = urlMappings.map(
                  (urlData: {
                    presignedUrl: string;
                    purpose: string;
                    s3Key: string;
                    localPath: string;
                    fileType: string;
                  }) => {
                    console.log(
                      `[VideoEditScreen] Uploading ${urlData.purpose} from ${urlData.localPath}...`,
                    );
                    return uploadFile(urlData.presignedUrl, {
                      uri: urlData.localPath,
                      type: urlData.fileType,
                    });
                  },
                );

                await Promise.all(uploadPromises);
                console.log(
                  '[VideoEditScreen] All files uploaded successfully to S3!',
                );
                Alert.alert(
                  '업로드 완료',
                  '모든 파일이 S3에 성공적으로 업로드되었습니다.',
                );
                setUploading(false);
                // --- 병렬 업로드 종료 ---

                // --- 6.7. DB에 메타데이터 저장 ---
                console.log(
                  '[VideoEditScreen] Saving video metadata to database...',
                );

                const directParent =
                  serverVideos.length > 0
                    ? serverVideos[serverVideos.length - 1]
                    : null;
                const parent_video_id = directParent ? directParent.id : null;
                const depth = directParent ? directParent.depth + 1 : 1;

                const s3Keys: Record<string, string> = {};
                urlMappings.forEach(mapping => {
                  s3Keys[mapping.purpose] = mapping.s3Key;
                });

                await axiosInstance.post('/video-insert/complete', {
                  user_id: userId,
                  results_video_key: s3Keys['RESULT_VIDEO'],
                  source_video_key: s3Keys['SOURCE_VIDEO'],
                  thumbnail_key: s3Keys['THUMBNAIL'],
                  parent_video_id,
                  depth,
                });

                console.log(
                  '[VideoEditScreen] Video metadata saved successfully!',
                );
                Alert.alert(
                  '완료',
                  '모든 작업이 완료되었습니다. 비디오가 성공적으로 저장되었습니다.',
                );

                // 성공적으로 완료되었으므로 이전 화면으로 이동
                navigation.popToTop();
                // --- DB 저장 종료 ---
              } catch (urlError: any) {
                console.error(
                  '[VideoEditScreen] Failed to get presigned URLs:',
                  urlError,
                );
                Alert.alert(
                  '오류',
                  `업로드 URL 요청 중 오류가 발생했습니다: ${urlError.message}`,
                );
                setUploading(false);
              }
              // --- Presigned URL 요청 종료 ---
            } else {
              const optimizedLogs = await optimizedSession.getLogsAsString();
              console.error(
                '[VideoEditScreen] Source optimization failed. Logs:',
                optimizedLogs,
              );
              Alert.alert('오류', '소스 비디오 최적화 중 오류가 발생했습니다.');
            }
          } else {
            Alert.alert('오류', '최적화할 원본 비디오를 찾지 못했습니다.');
          }
          // --- 소스 비디오 최적화 로직 종료 ---
        } else {
          const thumbnailLogs = await thumbnailSession.getLogsAsString();
          console.error(
            '[VideoEditScreen] Thumbnail extraction failed. Logs:',
            thumbnailLogs,
          );
          Alert.alert('오류', '썸네일 추출 중 오류가 발생했습니다.');
        }
        // --- 썸네일 추출 로직 종료 ---
      } else {
        const logs = await session.getLogsAsString();
        console.error('[VideoEditScreen] FFmpeg process failed. Logs:', logs);
        Alert.alert('오류', 'FFmpeg 처리 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('[VideoEditScreen] Error during video processing:', error);
      Alert.alert(
        '오류',
        `비디오 처리 중 오류가 발생했습니다: ${error.message}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Presigned URL을 받아와서 업로드하는 함수 (현재는 processVideoForUpload에 통합되어 사용되지 않는 것으로 보임)
  const getPresignedUrlAndUpload = async (video: {
    uri: string;
    name: string;
    type: string;
  }) => {
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found.');
      }
      const decodedToken = jwtDecode<CustomJwtPayload>(token);
      const userId = decodedToken.id;

      // 서버의 실제 엔드포인트인 'upload-urls'로 경로를 수정
      const response = await axiosInstance.post('/video-insert/upload-urls', {
        filename: video.name,
        filetype: video.type,
      });

      const { presignedUrl, s3Key } = response.data;
      await uploadFile(presignedUrl, video);

      const parent_video_id =
        serverVideos.length > 0 ? serverVideos[0].id : null;
      const depth = serverVideos.length > 0 ? serverVideos[0].depth + 1 : 1;

      await axiosInstance.post('/video-insert/video-info', {
        title: '새로운 콜라주 비디오',
        description: 'FFmpeg로 생성됨',
        s3_key: s3Key,
        user_id: userId,
        parent_video_id,
        depth,
        total_slots: trimmers.length,
      });

      Alert.alert('성공', '비디오가 성공적으로 업로드되었습니다.');
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('오류', '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // Presigned URL을 사용해 S3에 실제 파일을 업로드하는 함수
  const uploadFile = async (
    url: string,
    file: { uri: string; type: string },
  ) => {
    try {
      const fileUri = file.uri.startsWith('file://')
        ? file.uri
        : `file://${file.uri}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: {
          uri: fileUri,
          type: file.type,
          name: 'upload',
        } as any,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      console.log('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // =================================================================================
  // 7. 렌더링 (JSX)
  // =================================================================================
  return (
    <ScreenContainer>
      {/* 7.1. 비디오 미리보기 영역 */}
      <Animated.View style={{ height: previewHeight }}>
        <PreviewPanel
          trimmers={trimmers}
          playbackStates={playbackStates}
          previewScale={previewScale}
          onLayout={handlePreviewLayout}
          setPreviewSlotRef={setPreviewSlotRef}
          onVideoLoad={handleVideoLoad}
          onProgress={handleProgress}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
        />
      </Animated.View>

      {/* 7.2. 높이 조절 드래거 */}
      <Dragger {...panResponder.panHandlers}>
        <DragHandle />
      </Dragger>

      {/* 7.3. 하단 컨트롤 영역 */}
      <ControlsWrapper>
        {/* 전역 컨트롤 버튼 (처음으로, 재생/정지, 끝으로) */}
        <GlobalActionsContainer>
          <GlobalActionButton
            backgroundColor={'#000000'}
            onPress={handleGlobalSeekToStart}
          >
            <AlignStartVertical color="#ffffff" size={18} />
          </GlobalActionButton>
          {isGloballyPlaying ? (
            <GlobalActionButton
              backgroundColor={'#000000'}
              onPress={handleToggleGlobalPlay}
            >
              <Pause color="#ffffff" size={18} />
            </GlobalActionButton>
          ) : (
            <GlobalActionButton
              backgroundColor={'#000000'}
              onPress={handleToggleGlobalPlay}
            >
              <Play color="#ffffff" size={18} />
            </GlobalActionButton>
          )}
          {/* 나중에 수정 */}
          <GlobalActionButton
            backgroundColor={'#000000'}
            onPress={handleGlobalSeekToStart}
          >
            <AlignEndVertical color="#ffffff" size={18} />
          </GlobalActionButton>
        </GlobalActionsContainer>

        {/* 현재 타임라인 시간 표시 */}
        <Text
          style={{
            color: 'white',
            textAlign: 'center',
            fontSize: 16,
            marginVertical: 10,
          }}
        >
          {formatTime(timelinePosition)}
        </Text>

        <View style={{ flex: 1 }}>
          {/* 타임라인 컴포넌트 */}
          <View style={{ height: timelineHeight, minHeight: 100 }}>
            <Timeline
              trimmers={trimmers}
              globalStartTime={globalStartTime}
              globalEndTime={globalEndTime}
              currentTime={
                playbackStates[trimmers[0]?.id]?.currentTime ?? timelinePosition
              }
              onPositionChange={handleTimelinePositionChange}
              onTrimmerUpdate={handleTrimmerUpdate}
              onHeightChange={setTimelineHeight} // [추가] 높이 변경 콜백 전달
              isPlaying={isGloballyPlaying} // [추가]
            />
          </View>

          {/* 각 비디오별 컨트롤러 (스크롤) */}
          <ControlsScrollView showsVerticalScrollIndicator={false}>
            {trimmers.map((trimmer, index) => (
              <VideoControlSet
                key={trimmer.id}
                title={`비디오 ${index + 1} 컨트롤`}
                videoDuration={trimmer.duration}
                initialStartTime={trimmer.startTime}
                initialEndTime={trimmer.endTime}
                initialVolume={trimmer.volume}
                initialEqualizer={trimmer.equalizer}
                currentTime={playbackStates[trimmer.id]?.currentTime ?? 0}
                onUpdate={newState => handleTrimmerUpdate(trimmer.id, newState)}
                onSeek={time => handleSeek(trimmer.id, time)}
              />
            ))}
            {/* 최종 생성/업로드 버튼 */}
            <CreateCollageSection>
              <CreateCollageButton
                backgroundColor={'#333333'}
                onPress={processVideoForUpload}
                disabled={isProcessing || uploading}
              >
                {isProcessing
                  ? '콜라주 생성 중...'
                  : uploading
                  ? '업로드 중...'
                  : '콜라주 생성 및 업로드'}
              </CreateCollageButton>
            </CreateCollageSection>
          </ControlsScrollView>
        </View>
      </ControlsWrapper>
    </ScreenContainer>
  );
};

export default VideoEditScreen;
