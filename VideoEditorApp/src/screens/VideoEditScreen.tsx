// React-Native-Video와 Android Compiler간 충돌 => Node_modules
// https://github.com/r0b0t3d/react-native-video/blob/master/android/src/main/java/com/brentvatne/common/react/VideoEventEmitter.kt
// 참고하여 해결하기

// Android FFmpeg 오류
// https://medium.com/@nooruddinlakhani/resolved-ffmpegkit-retirement-issue-in-react-native-a-complete-guide-0f54b113b390
// 참고하여 해결하기

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from 'react';
import styled from 'styled-components/native';
import {
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
  TextInput,
  TouchableOpacity,
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
import {
  useSafeAreaInsets,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  Rewind,
  AlignStartVertical,
  AlignEndVertical,
  SlidersHorizontal,
} from 'lucide-react-native';

import Timeline, { TimelineHandles } from '../components/Editor/Timeline';
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
import BottomSheet from '../components/Common/BottomSheet';

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
  const [globalEndTime, setGlobalEndTime] = useState(0);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [timelineHeight, setTimelineHeight] = useState(100); // 타임라인의 동적 높이
  const [isSheetVisible, setSheetVisible] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrimmerState | null>(null);
  const [isSettingsButtonVisible, setSettingsButtonVisible] = useState(false);
  const [isTimelineReady, setIsTimelineReady] = useState(false);

  // [수정] 재생 요청 상태 관리 리팩토링
  const [seekAndPlayRequest, setSeekAndPlayRequest] = useState<number | null>(
    null,
  );
  const [playRequest, setPlayRequest] = useState<boolean>(false);

  const previewSlotRefs = useRef<
    Record<string, VideoPreviewSlotHandles | null>
  >({}); // 각 비디오 프리뷰 컴포넌트의 ref 모음 (seek 등 직접 조작용)
  const timelineRef = useRef<TimelineHandles>(null);
  const [seekTrigger, setSeekTrigger] = useState(0); // [추가] seek useEffect를 수동으로 트리거하기 위한 상태
  // [수정] boolean 상태 대신 재생을 요청한 시간(숫자) 또는 null을 저장
  const [playbackRequestTime, setPlaybackRequestTime] = useState<number | null>(
    null,
  );
  const seekCompleteCallback = useRef<(() => void) | null>(null);
  const isDraggingHandleRef = useRef(false);

  const startPointThreshold = 1; // 나중에 동적으로 변경될 수 있는 시작점 임계값
  const endPointThreshold = trimmers[0]?.duration ?? Infinity;

  // =================================================================================
  // 6. 핵심 로직: 비디오 처리 및 업로드
  // =================================================================================

  // '콜라주 생성 및 업로드' 버튼 클릭 시 실행되는 메인 함수
  const handleProcessAndUpload = useCallback(() => {
    startVideoProcessing(trimmers, serverVideos);
  }, [startVideoProcessing, trimmers, serverVideos]);

  // =================================================================================
  // 4. useEffects (상태 변경에 따른 부가 효과 처리)
  // =================================================================================

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleProcessAndUpload}
          disabled={isProcessing || uploading}
          style={{ marginRight: 15 }}
        >
          <Text
            style={{
              color: isProcessing || uploading ? '#888' : '#FFFFFF',
              fontSize: 16,
            }}
          >
            {isProcessing
              ? '생성 중...'
              : uploading
              ? '업로드 중...'
              : '업로드'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleProcessAndUpload, isProcessing, uploading]);

  // [추가 -> 수정] 타임라인 위치 변경 핸들러 (useCallback으로 최적화)
  const handleTimelinePositionChange = useCallback((time: number) => {
    setTimelinePosition(time);
  }, []);

  // 타임라인 재생 헤드 위치가 바뀌면, 각 비디오의 재생 위치(seek)를 동기화
  useEffect(() => {
    // [수정] 재생이 요청된 동안에는 이 로직이 실행되지 않도록 하여 경합 조건을 방지
    if (!isGloballyPlaying && playbackRequestTime === null) {
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
  }, [timelinePosition, isGloballyPlaying, seekTrigger, playbackRequestTime]); // [수정] 의존성 추가

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

  useEffect(() => {
    // 모든 비디오의 duration이 로드되었는지 확인
    const allLoaded =
      trimmers.length > 0 && trimmers.every(t => t.duration > 0);
    if (allLoaded) {
      setIsTimelineReady(true);
    }
  }, [trimmers]);

  useEffect(() => {
    // 초기 globalEndTime을 첫 비디오의 길이로 설정 (한 번만 실행)
    if (
      trimmers.length > 0 &&
      trimmers[0].duration > 0 &&
      globalEndTime === 0
    ) {
      const initialEndTime = trimmers[0].duration;
      console.log(
        `[VideoEditScreen] Initializing globalEndTime to: ${initialEndTime}`,
      );
      setGlobalEndTime(initialEndTime);
    }
  }, [trimmers, globalEndTime]);

  // =================================================================================

  // Trimmer 정보(시작/끝 시간 등)가 변경될 때마다 전역 시작/끝 시간 다시 계산

  // =================================================================================
  // trimmers 이용 잘하기
  const recalculateGlobalBoundaries = useCallback(() => {
    if (
      trimmers.length === 0 ||
      trimmers.some(t => t.duration === 0) ||
      isDraggingHandleRef.current // 핸들 드래그 중에는 실행하지 않음
    ) {
      // setGlobalStartTime(0);
      // setGlobalEndTime(0);
      return;
    }

    const trackStartTimes = trimmers.map(t => t.timelinePosition);
    const trackEndTimes = trimmers.map(
      t => t.timelinePosition + (t.endTime - t.startTime),
    );

    let maxStart = Math.max(...trackStartTimes);
    let minEnd = Math.min(...trackEndTimes);

    // [추가] 계산된 값에 임계값 적용
    maxStart = Math.max(startPointThreshold, maxStart); // 시작점은 임계값보다 작을 수 없음
    minEnd = Math.min(endPointThreshold, minEnd); // 끝점은 임계값을 넘을 수 없음

    console.log('[VideoEditScreen] recalculateGlobalBoundaries. New values:', {
      maxStart,
      minEnd,
    });
    // [수정] 계산된 시작점이 현재 시작점보다 앞서는 경우, 수동 설정을 존중하여 덮어쓰지 않음
    if (maxStart > globalStartTime) {
      setGlobalStartTime(maxStart);
    }
    setGlobalEndTime(minEnd < maxStart ? maxStart : minEnd);
  }, [trimmers, globalStartTime, endPointThreshold]);

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

  const handlePlaybackUpdate = useCallback(
    (id: string, newState: Partial<PlaybackState>) => {
      setPlaybackStates(prev => ({
        ...prev,
        [id]: { ...(prev[id] ?? {}), ...newState },
      }));
    },
    [],
  );

  // 비디오 로딩 완료 시 (onLoad), 비디오 길이(duration) 상태 업데이트
  const handleVideoLoad = (id: string, data: OnLoadData) => {
    handleTrimmerUpdate(id, {
      duration: data.duration,
      startTime: 0,
      endTime: data.duration,
    });
    handlePlaybackUpdate(id, { currentTime: 0 });
  };

  // 비디오 재생 중 주기적으로 호출 (onProgress)
  const handleProgress = (id: string, data: OnProgressData) => {
    // [수정] 전역 재생 중일 때만 상태를 업데이트하여 무한 루프를 방지합니다.
    if (isGloballyPlaying) {
      const trimmer = trimmers.find(t => t.id === id);
      if (!trimmer) return;

      // 비디오의 실제 재생 시간(currentTime)을 타임라인의 절대 위치로 변환
      const timeSinceClipStart = data.currentTime - trimmer.startTime;
      const currentTimelinePosition =
        trimmer.timelinePosition + timeSinceClipStart;

      // 플레이헤드가 임계점을 넘지 않도록 위치를 제한
      const finalPosition = Math.min(
        currentTimelinePosition,
        endPointThreshold,
      );

      handlePlaybackUpdate(id, { currentTime: data.currentTime });
      setTimelinePosition(finalPosition);

      const epsilon = 0.05; // 50ms
      // 실제 정지해야 할 지점 (사용자 설정 끝점과 비디오 최대 길이 중 더 빠른 지점)
      const stopThreshold = Math.min(globalEndTime, endPointThreshold);

      // 정지 지점에 도달했는지 확인
      if (stopThreshold > 0 && finalPosition >= stopThreshold - epsilon) {
        handleGlobalPause();
        setIsGloballyPlaying(false);
        // 플레이헤드를 정확히 정지 지점에 맞춤
        setTimelinePosition(stopThreshold);
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
  const handleGlobalPause = useCallback(() => {
    trimmers.forEach(t => handlePlaybackUpdate(t.id, { isPaused: true }));
  }, [trimmers, handlePlaybackUpdate]);

  // 전역 재생/일시정지 버튼 토글
  const handleToggleGlobalPlay = () => {
    if (isGloballyPlaying) {
      setIsGloballyPlaying(false);
      setSeekAndPlayRequest(null); // 대기중인 seek 요청 취소
      setPlayRequest(false); // 대기중인 재생 요청 취소
      trimmers.forEach(trimmer => {
        handlePlaybackUpdate(trimmer.id, { isPaused: true });
      });
    } else {
      const isOutside =
        timelinePosition < globalStartTime || timelinePosition >= globalEndTime;

      if (isOutside) {
        // 이동 후 재생: 1단계(seek)만 트리거
        setSeekAndPlayRequest(globalStartTime);
      } else {
        // 즉시 재생: 2단계(재생)만 트리거
        setPlayRequest(true);
      }
    }
  };

  // [수정] 재생 요청이 들어오면 비디오를 재생하는 useEffect
  useEffect(() => {
    if (seekAndPlayRequest !== null) {
      const videoId = trimmers[0]?.id;
      if (videoId && previewSlotRefs.current[videoId]) {
        // seek가 완료된 후 실행할 콜백 설정
        seekCompleteCallback.current = () => {
          setTimelinePosition(seekAndPlayRequest);
          setPlayRequest(true); // 2단계(재생) 트리거
          seekCompleteCallback.current = null;
        };
        // seek 실행
        previewSlotRefs.current[videoId]?.seek(seekAndPlayRequest);
      }
    } else {
      // 재생 요청이 취소되면 콜백도 취소
      seekCompleteCallback.current = null;
    }
  }, [seekAndPlayRequest, trimmers]);

  // [수정] 2단계: 재생 요청 처리
  useEffect(() => {
    if (!playRequest) return;
    setIsGloballyPlaying(true);
    trimmers.forEach(trimmer => {
      handlePlaybackUpdate(trimmer.id, { isPaused: false });
    });
    setPlayRequest(false);
  }, [playRequest, trimmers, handlePlaybackUpdate]);

  const handleDragStateChange = (isDragging: boolean) => {
    isDraggingHandleRef.current = isDragging;
    // 드래그가 끝났을 때만 경계를 다시 계산 -> 이 로직을 제거합니다.
    // 수동 조작이 최종 값을 결정해야 합니다.
    // if (!isDragging) {
    //   recalculateGlobalBoundaries();
    // }
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
    timelineRef.current?.scrollToTime(globalStartTime);
  };

  const handleGlobalSeekToEnd = () => {
    trimmers.forEach(t => {
      if (previewSlotRefs.current[t.id]) {
        previewSlotRefs.current[t.id]?.seek(globalEndTime);
        handlePlaybackUpdate(t.id, {
          currentTime: globalEndTime,
          isPaused: true,
        });
      }
    });
    setTimelinePosition(globalEndTime);
    setIsGloballyPlaying(false);
    timelineRef.current?.scrollToTime(globalEndTime);
  };

  const handleGlobalStartTimeUpdate = (newTime: number) => {
    console.log(
      '[VideoEditScreen] handleGlobalStartTimeUpdate new time:',
      newTime,
    );
    setGlobalStartTime(newTime);
    // if (trimmers.length === 1) {
    //   handleTrimmerUpdate(trimmers[0].id, { startTime: newTime });
    // }
  };

  const handleGlobalEndTimeUpdate = (newTime: number) => {
    console.log(
      '[VideoEditScreen] handleGlobalEndTimeUpdate new time:',
      newTime,
    );
    setGlobalEndTime(newTime);
    // if (trimmers.length === 1) {
    //   handleTrimmerUpdate(trimmers[0].id, { endTime: newTime });
    // }
  };

  const handleTrackSelectionChange = (trackId: string | null) => {
    // [수정] 트랙 선택이 해제될 때 경계를 재계산
    if (trackId === null) {
      recalculateGlobalBoundaries();
    }

    if (trackId && previewState === 'collapsed') {
      const track = trimmers.find(t => t.id === trackId);
      if (track) {
        setSelectedTrack(track);
        setSettingsButtonVisible(true);
      }
    } else {
      setSelectedTrack(null);
      setSettingsButtonVisible(false);
      setSheetVisible(false); // 트랙 선택 해제 시 시트도 닫기
    }
  };

  const handleTrackPositionChange = (trackId: string, newPosition: number) => {
    handleTrimmerUpdate(trackId, { timelinePosition: newPosition });
  };

  // 자식(VideoPreviewSlot)의 ref를 부모(이 컴포넌트)의 ref 객체에 저장
  const setPreviewSlotRef = (
    id: string,
    ref: VideoPreviewSlotHandles | null,
  ) => {
    previewSlotRefs.current[id] = ref;
  };

  // =================================================================================
  // 7. 렌더링 (JSX)
  // =================================================================================

  const handlePositionChange = (time: number) => {
    setTimelinePosition(time);
  };

  const onSeekComplete = () => {
    if (seekCompleteCallback.current) {
      seekCompleteCallback.current();
    }
  };

  return (
    <ScreenContainer edges={['bottom']}>
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
          onSeekComplete={onSeekComplete}
          isCollapsed={previewState === 'collapsed'}
          previewState={previewState}
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
        {/* 고정 컨트롤 영역 (시간 + 타임라인) */}
        <View style={{ marginTop: previewState === 'collapsed' ? 0 : 60 }}>
          {/* 현재 타임라인 시간 표시 */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginVertical: 10,
            }}
          >
            <Text
              style={{ color: '#aaa', fontSize: 16, paddingHorizontal: 15 }}
            >
              {formatTime(globalStartTime)}
            </Text>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {formatTime(timelinePosition - globalStartTime)}
            </Text>
            <Text
              style={{ color: '#aaa', fontSize: 16, paddingHorizontal: 15 }}
            >
              {formatTime(globalEndTime)}
            </Text>
          </View>

          {/* 타임라인 컴포넌트 */}
          <View style={{ height: timelineHeight, minHeight: 100 }}>
            {isTimelineReady ? (
              <Timeline
                ref={timelineRef}
                trimmers={trimmers}
                globalStartTime={globalStartTime}
                globalEndTime={globalEndTime}
                startPointThreshold={startPointThreshold}
                endPointThreshold={endPointThreshold}
                currentTime={timelinePosition}
                isGloballyPlaying={isGloballyPlaying}
                onPositionChange={handlePositionChange}
                onHeightChange={setTimelineHeight}
                onGlobalStartTimeChange={handleGlobalStartTimeUpdate}
                onGlobalEndTimeChange={handleGlobalEndTimeUpdate}
                onTrackPositionChange={handleTrackPositionChange}
                onTrackSelectionChange={handleTrackSelectionChange}
                onDragStateChange={handleDragStateChange}
                onTrackDragEnd={() => {
                  /* 트랙 드래그가 끝났을 떄 */
                }}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white' }}>타임라인 로딩 중...</Text>
              </View>
            )}
          </View>
        </View>

        {/* 이 아래에 스크롤이 필요한 다른 컨트롤들을 추가할 수 있습니다. */}
        {/* <ControlsScrollView></ControlsScrollView> */}

        {/* 전역 컨트롤 버튼들 */}
        <Animated.View
          style={{
            position: 'absolute',
            top: controlsTopAnim,
            left: 0,
            right: 0,
            zIndex: 10,
          }}
        >
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <GlobalControls
              isGloballyPlaying={isGloballyPlaying}
              onToggleGlobalPlay={handleToggleGlobalPlay}
              onGlobalSeekToStart={handleGlobalSeekToStart}
              onGlobalSeekToEnd={handleGlobalSeekToEnd}
              style={
                previewState === 'collapsed'
                  ? {
                      backgroundColor: '#000',
                      borderRadius: 50,
                      shadowColor: '#fff',
                      shadowOffset: {
                        width: 0,
                        height: 0,
                      },
                      shadowOpacity: 0.5,
                      shadowRadius: 3.84,
                      elevation: 5,
                    }
                  : {}
              }
            />
            {isSettingsButtonVisible && (
              <TouchableOpacity
                onPress={() => setSheetVisible(true)}
                style={{
                  backgroundColor: '#000',
                  borderRadius: 50,
                  shadowColor: '#fff',
                  shadowOffset: {
                    width: 0,
                    height: 0,
                  },
                  shadowOpacity: 0.5,
                  shadowRadius: 3.84,
                  elevation: 5,
                  position: 'absolute',
                  right: 16,
                  padding: 20,
                }}
              >
                <SlidersHorizontal color="white" size={20} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
        {previewState === 'max' && (
          <View
            style={{
              position: 'absolute',
              top: 60, // GlobalControls의 대략적인 높이 아래부터 시작
              bottom: -insets.bottom, // 안전 영역을 무시하고 화면 끝까지 확장
              left: 0,
              right: 0,
              backgroundColor: '#000000',
              zIndex: 5, // 컨트롤(10)보다는 낮고, 다른 요소보다는 높게
            }}
          />
        )}
      </ControlsWrapper>
      <BottomSheet
        visible={isSheetVisible}
        onClose={() => setSheetVisible(false)}
      >
        {selectedTrack && (
          <VideoControlSet
            key={selectedTrack.id}
            title={'비디오 컨트롤'}
            videoDuration={selectedTrack.duration}
            initialStartTime={selectedTrack.startTime}
            initialEndTime={selectedTrack.endTime}
            initialVolume={selectedTrack.volume}
            initialEqualizer={selectedTrack.equalizer}
            currentTime={playbackStates[selectedTrack.id]?.currentTime ?? 0}
            onUpdate={newState =>
              handleTrimmerUpdate(selectedTrack.id, newState)
            }
            onSeek={time => handleSeek(selectedTrack.id, time)}
          />
        )}
      </BottomSheet>
    </ScreenContainer>
  );
};

export default VideoEditScreen;
