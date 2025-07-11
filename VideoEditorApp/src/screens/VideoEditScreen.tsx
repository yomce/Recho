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
  Easing,
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
import GlobalControls from '../components/Editor/GlobalControls';
import { useVideoProcessor } from '../hooks/useVideoProcessor';

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

  // 비디오 처리 로직을 커스텀 훅으로 분리
  const { isProcessing, uploading, startVideoProcessing } = useVideoProcessor();

  // --- 3.2. 화면 레이아웃 관련 상태 ---
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  const minControlHeight = 120; // 컨트롤 영역의 최소 높이
  const collapsedPreviewHeight = 60; // [추가] 접혔을 때의 높이

  // 프리뷰 영역의 최대/최소 높이 계산
  const maxPreviewHeight =
    screenHeight -
    insets.top -
    insets.bottom -
    minControlHeight -
    DRAGGER_HEIGHT;
  const minPreviewHeight = screenWidth * (3 / 4);

  // 애니메이션을 위해 Animated.Value 사용
  const previewHeightAnim = useRef(
    new Animated.Value(maxPreviewHeight),
  ).current;
  const dragStartHeight = useRef(0); // 드래그 시작 시점의 높이
  const heightRef = useRef(maxPreviewHeight); // stale state 문제를 피하기 위한 ref

  // [추가] 프리뷰의 현재 상태 (max, min, collapsed)
  const [previewState, setPreviewState] = useState<'max' | 'min' | 'collapsed'>(
    'max',
  );
  const [controlsWrapperHeight, setControlsWrapperHeight] = useState(0);
  const controlsTopAnim = useRef(new Animated.Value(0)).current;

  // --- 3.3. 비디오 편집 및 재생 상태 ---
  // previewHeight 상태가 변경될 때마다 ref의 값도 동기화
  useEffect(() => {
    // 애니메이션 값의 변경을 heightRef에 동기화
    const listenerId = previewHeightAnim.addListener(({ value }) => {
      heightRef.current = value;
    });
    return () => {
      previewHeightAnim.removeListener(listenerId);
    };
  }, [previewHeightAnim]);

  // [추가] previewState가 바뀌면 GlobalControls의 위치를 애니메이션 처리
  useEffect(() => {
    // 아직 컨테이너 높이가 계산되지 않았으면 실행하지 않음
    if (controlsWrapperHeight === 0) return;

    // 컨트롤의 대략적인 높이와 하단 여백
    const controlsHeight = 54;
    const bottomMargin = 16;
    let targetTop = 0; // 기본 위치는 상단

    // '접힘' 상태일 때만 목표 위치를 하단으로 변경
    if (previewState === 'collapsed') {
      targetTop = controlsWrapperHeight - controlsHeight - bottomMargin;
    }

    Animated.timing(controlsTopAnim, {
      toValue: targetTop,
      duration: 250,
      useNativeDriver: false, // top 속성은 네이티브 드라이버 지원 안함
      easing: Easing.bezier(0.4, 0, 0.2, 1), // 부드러운 움직임
    }).start();
  }, [previewState, controlsWrapperHeight, controlsTopAnim]);

  // 드래그하여 프리뷰 높이를 조절하는 PanResponder 설정
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gestureState) => {
        // 새 드래그 시작 시 진행중인 애니메이션 정지
        previewHeightAnim.stopAnimation();
        // 드래그 시작 시점의 높이를 기록
        dragStartHeight.current = heightRef.current;
      },
      onPanResponderMove: (e, gestureState) => {
        // 실시간으로 드래그에 따라 높이 변경 (애니메이션 없음)
        const newHeight = dragStartHeight.current + gestureState.dy;
        const clampedHeight = Math.max(
          collapsedPreviewHeight, // 가장 작은 높이로 제한
          Math.min(newHeight, maxPreviewHeight),
        );
        previewHeightAnim.setValue(clampedHeight); // 직접 값 설정
      },
      onPanResponderRelease: (e, gestureState) => {
        const finalHeight = heightRef.current; // 손을 뗀 최종 높이

        const snapPoints = [
          { state: 'collapsed', height: collapsedPreviewHeight },
          { state: 'min', height: minPreviewHeight },
          { state: 'max', height: maxPreviewHeight },
        ];

        // 최종 높이에서 가장 가까운 스냅 포인트를 찾음
        const closestSnapPoint = snapPoints.reduce((prev, curr) => {
          const prevDist = Math.abs(prev.height - finalHeight);
          const currDist = Math.abs(curr.height - finalHeight);
          return currDist < prevDist ? curr : prev;
        });

        const targetHeight = closestSnapPoint.height;
        const targetState = closestSnapPoint.state as
          | 'max'
          | 'min'
          | 'collapsed';

        // Animated.timing을 사용하여 부드러운 애니메이션 적용
        Animated.timing(previewHeightAnim, {
          toValue: targetHeight,
          duration: 150, // 애니메이션 지속 시간 (밀리초)
          useNativeDriver: false, // height 속성은 네이티브 드라이버 지원 안함
        }).start(({ finished }) => {
          // 애니메이션이 끝나면 상태 업데이트
          if (finished) {
            // 레이아웃 변경에 애니메이션 적용
            // LayoutAnimation.configureNext(
            //   LayoutAnimation.Presets.easeInEaseOut,
            // );
            setPreviewState(targetState);
          }
        });
      },
    }),
  ).current;

  const [trimmers, setTrimmers] = useState<TrimmerState[]>([]); // 각 비디오의 편집 정보(자르기, 볼륨 등) 배열
  const [playbackStates, setPlaybackStates] = useState<
    Record<string, PlaybackState>
  >({}); // 각 비디오의 재생 상태 (현재 시간, 정지 여부)
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
  const handleProcessAndUpload = () => {
    startVideoProcessing(trimmers, serverVideos);
  };

  // =================================================================================
  // 7. 렌더링 (JSX)
  // =================================================================================
  return (
    <ScreenContainer>
      {/* 7.1. 비디오 미리보기 영역 */}
      <Animated.View style={{ height: previewHeightAnim }}>
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
          isCollapsed={previewState === 'collapsed'}
        />
      </Animated.View>

      {/* 7.2. 높이 조절 드래거 */}
      <Dragger {...panResponder.panHandlers}>
        <DragHandle />
      </Dragger>

      {/* 7.3. 하단 컨트롤 영역 */}
      <ControlsWrapper
        onLayout={e => setControlsWrapperHeight(e.nativeEvent.layout.height)}
      >
        {/* 시간 및 스크롤 가능한 컨트롤 영역 */}
        <View
          style={{ flex: 1, marginTop: previewState === 'collapsed' ? 0 : 60 }}
        >
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
                  playbackStates[trimmers[0]?.id]?.currentTime ??
                  timelinePosition
                }
                onPositionChange={handleTimelinePositionChange}
                onTrimmerUpdate={handleTrimmerUpdate}
                onHeightChange={setTimelineHeight} // [추가] 높이 변경 콜백 전달
                isPlaying={isGloballyPlaying} // [추가]
              />
            </View>

            {/* 각 비디오별 컨트롤러 (스크롤) */}
            <ControlsScrollView
              showsVerticalScrollIndicator={false}
              style={{
                paddingBottom: previewState === 'collapsed' ? 60 : 0,
              }}
            >
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
                  onUpdate={newState =>
                    handleTrimmerUpdate(trimmer.id, newState)
                  }
                  onSeek={time => handleSeek(trimmer.id, time)}
                />
              ))}
              {/* 최종 생성/업로드 버튼 */}
              <CreateCollageSection>
                <CreateCollageButton
                  backgroundColor={'#333333'}
                  onPress={handleProcessAndUpload}
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
        </View>

        {/* GlobalControls를 오버레이로 렌더링 */}
        <Animated.View
          style={{
            position: 'absolute',
            top: controlsTopAnim,
            left: 0,
            right: 0,
            zIndex: 10,
          }}
        >
          <GlobalControls
            isGloballyPlaying={isGloballyPlaying}
            onToggleGlobalPlay={handleToggleGlobalPlay}
            onGlobalSeekToStart={handleGlobalSeekToStart}
            style={
              previewState === 'collapsed'
                ? {
                    /* [수정] 접힘 상태일 때 적용할 커스텀 스타일 */
                    alignSelf: 'center',
                    width: '50%',
                    maxWidth: '100%',
                    paddingHorizontal: 10,
                    backgroundColor: '#333333',
                    borderRadius: 50,
                    paddingVertical: 5,
                  }
                : {
                    /* [추가] 기본 상태일 때의 스타일 */
                    alignSelf: 'center',
                    maxWidth: 200,
                  }
            }
          />
        </Animated.View>
      </ControlsWrapper>
    </ScreenContainer>
  );
};

export default VideoEditScreen;
