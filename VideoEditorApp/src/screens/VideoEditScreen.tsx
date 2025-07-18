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
  useMemo,
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
  StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
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
  Settings2,
  SlidersVertical,
  CirclePlay,
  CirclePause,
  ArrowBigLeftDashIcon,
  ArrowBigRightDashIcon,
  Upload,
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
import { extractWaveformData } from '../utils/waveformUtils';

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
  parentStartTime?: number;
  parentEndTime?: number;
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
    parentStartTime = 0, // 부모의 시작 시간 (기본값 0)
    parentEndTime, // 부모의 종료 시간 (기본값 undefined)
  } = route.params ?? {};

  // [추가] parentStartTime이 변경될 때마다 플레이 헤드와 전역 시작 시간을 업데이트
  useEffect(() => {
    if (parentStartTime > 0) {
      setGlobalStartTime(parentStartTime);
      setTimelinePosition(parentStartTime);
    }
  }, [parentStartTime, serverVideos]);

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
  const [globalStartTime, setGlobalStartTime] = useState(parentStartTime); // 모든 비디오가 동시에 재생될 수 있는 시작 시간
  const [globalEndTime, setGlobalEndTime] = useState(0);
  const [timelinePosition, setTimelinePosition] = useState(parentStartTime);
  const [timelineHeight, setTimelineHeight] = useState(100); // 타임라인의 동적 높이
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
  const [isVolumeMenuVisible, setIsVolumeMenuVisible] = useState(false);
  const [isSheetVisible, setSheetVisible] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrimmerState | null>(null);
  const [isSettingsButtonVisible, setSettingsButtonVisible] = useState(false);
  const [isTimelineReady, setIsTimelineReady] = useState(false);
  const [soloTrackId, setSoloTrackId] = useState<string | null>(null);
  const [preSoloMuteStates, setPreSoloMuteStates] = useState<
    Record<string, boolean>
  >({});

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
  const activeFfmpegSessionId = useRef<number | null>(null);

  // [수정] 부모의 편집 가능 영역을 받아와 threshold의 기본값으로 설정
  const startPointThreshold = parentStartTime;
  // [수정] 부모의 endTime과 새로 추가된 비디오의 길이 중 더 작은 값을 임계점으로 사용
  const endPointThreshold = Math.min(
    parentEndTime ?? Infinity,
    trimmers[0]?.duration ?? Infinity,
  );

  // [추가] 재생 성능 최적화를 위한 Ref. handleProgress의 의존성을 제거하기 위함.
  const trimmersRef = useRef(trimmers);
  const globalEndTimeRef = useRef(globalEndTime);
  const endPointThresholdRef = useRef(endPointThreshold);
  useEffect(() => {
    trimmersRef.current = trimmers;
    globalEndTimeRef.current = globalEndTime;
    endPointThresholdRef.current = endPointThreshold;
  }, [trimmers, globalEndTime, endPointThreshold]);

  // =================================================================================
  // 6. 핵심 로직: 비디오 처리 및 업로드
  // =================================================================================

  // '콜라주 생성 및 업로드' 버튼 클릭 시 실행되는 메인 함수
  const handleProcessAndUpload = useCallback(() => {
    // 모든 비디오 슬롯이 채워졌는지 확인
    const isAllSlotFilled = trimmers.every(trimmer => !!trimmer.sourceVideo);
    if (!isAllSlotFilled) {
      Alert.alert('오류', '모든 비디오 슬롯을 채워주세요.');
      return;
    }

    // 편집 완료 확인 알림 표시
    Alert.alert('편집 완료', '편집을 완료하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '완료',
        onPress: () => {
          // 마지막 트랙의 타임라인 포지션을 가져옵니다.
          const lastTrimmer =
            trimmers.length > 0 ? trimmers[trimmers.length - 1] : null;
          const timelinePosition = lastTrimmer
            ? lastTrimmer.timelinePosition
            : 0;

          // 부모 비디오 ID는 serverVideos에서 가져옵니다.
          const parentVideoId =
            serverVideos && serverVideos.length > 0
              ? serverVideos[serverVideos.length - 1].id
              : null;

          // 백그라운드에서 렌더링 및 업로드 시작
          startVideoProcessing(
            trimmers,
            serverVideos,
            parentVideoId,
            globalStartTime,
            globalEndTime,
            timelinePosition,
          );

          // 즉시 웹뷰로 이동
          navigation.navigate('Web', {});
        },
      },
    ]);
  }, [
    trimmers,
    serverVideos,
    startVideoProcessing,
    globalStartTime,
    globalEndTime,
    navigation,
  ]);

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
            {isProcessing ? (
              '생성 중...'
            ) : uploading ? (
              '업로드 중...'
            ) : (
              <Upload size={24} color="#FFFFFF" />
            )}
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
    // 1. 부모 비디오(serverVideos)를 TrimmerState 형식으로 변환합니다.
    // [수정] 중복된 비디오 ID가 전달될 경우를 대비하여 `id`를 기준으로 중복 제거
    const uniqueServerVideos = Array.from(
      new Map(serverVideos.map(item => [item.id, item])).values(),
    );

    const parentTrimmers: TrimmerState[] = uniqueServerVideos.map(video => ({
      id: video.id,
      sourceVideo: {
        id: video.id,
        uri: video.video_url, // ProcessingScreen에서 다운로드한 로컬 경로를 사용해야 함
        filename: video.source_video_key,
        type: 'video/mp4',
        size: 0, // 알 수 없으므로 0으로 설정
      },
      duration: video.endTime - video.startTime, // 부모 트랙의 실제 길이는 구간 길이
      startTime: video.startTime,
      endTime: video.endTime,
      timelinePosition: video.timelinePosition, // [수정] 원래 값 그대로 사용
      isPlaying: false,
      isMuted: false,
      volume: 1,
      equalizer: defaultEQBands,
      aspectRatio: 'original',
      originalAspectRatioValue: '1.777', // 이 값은 동적으로 설정 필요
    }));

    // [수정] localVideos에서 이미 부모 트랙으로 추가된 비디오를 제외합니다.
    const parentVideoIds = new Set(uniqueServerVideos.map(v => v.id));
    const newOnlyLocalVideos = localVideos.filter(
      video => !parentVideoIds.has(video.id),
    );

    // [추가] 직계 부모 비디오를 찾습니다 (depth가 가장 높은 비디오).
    const directParent =
      uniqueServerVideos.length > 0
        ? uniqueServerVideos.reduce((prev, current) =>
            prev.depth > current.depth ? prev : current,
          )
        : null;

    // [추가] 직계 부모가 있다면, 전역 시작/종료 시간을 부모의 시간으로 설정합니다.
    if (directParent) {
      setGlobalStartTime(directParent.startTime);
      setGlobalEndTime(directParent.endTime);
    }

    // 2. 새로 추가된 비디오(localVideos)를 TrimmerState 형식으로 변환합니다.
    const newTrimmers: TrimmerState[] = newOnlyLocalVideos.map((video, i) => ({
      id: `trimmer${uniqueServerVideos.length + i + 1}`,
      sourceVideo: video,
      duration: 0, // 로드 시 업데이트됨
      startTime: 0,
      endTime: 0, // 로드 시 업데이트됨
      // [수정] 새 비디오의 타임라인 위치를 직계 부모의 시작 시간으로 설정합니다.
      timelinePosition: directParent ? directParent.startTime : 0,
      isPlaying: false,
      isMuted: false,
      volume: 1,
      equalizer: defaultEQBands,
      aspectRatio: 'original',
      originalAspectRatioValue: '1.777',
    }));

    const allTrimmers = [...parentTrimmers, ...newTrimmers];

    setTrimmers(allTrimmers);

    const initialPlaybackStates: Record<
      string,
      { currentTime: number; isPaused: boolean }
    > = {};
    allTrimmers.forEach(t => {
      initialPlaybackStates[t.id] = { currentTime: 0, isPaused: true };
    });
    setPlaybackStates(initialPlaybackStates);
  }, [serverVideos, localVideos, route.params, parentStartTime]);

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
      setGlobalEndTime(initialEndTime);
    }
  }, [trimmers, globalEndTime]);

  // trimmers 배열의 핵심 값들이 변경될 때만 새로운 문자열을 생성합니다.
  const trimmerDependencies = useMemo(
    () =>
      trimmers
        .map(t => `${t.id}-${t.timelinePosition}-${t.startTime}-${t.endTime}`)
        .join(','),
    [trimmers],
  );

  // [추가] trimmers 상태가 변경될 때마다 전역 경계를 다시 계산합니다.
  // 이 로직은 모든 시나리오(부모 유무 포함)에서 동적 편집 영역을 보장합니다.
  useEffect(() => {
    // [수정] 연속적인 편집 중 불필요한 호출을 막기 위해 디바운스 적용
    const debounceTimer = setTimeout(() => {
      recalculateGlobalBoundaries();
    }, 150); // 150ms 동안 추가 변경이 없으면 실행

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmerDependencies]);

  // [수정] 파형 추출을 위한 의존성을 명시적으로 관리하여 불필요한 재실행을 방지합니다.
  const waveformDependencies = useMemo(
    () =>
      trimmers
        .map(t => `${t.id}-${t.sourceVideo?.uri}-${t.duration}-${!!t.waveform}`)
        .join(','),
    [trimmers],
  );

  // [추가] trimmers에 sourceVideo가 설정되면 파형 데이터를 추출합니다.
  useEffect(() => {
    // 여러 번의 빠른 상태 업데이트가 하나의 작업으로 이어지도록 debounce 효과를 줍니다.
    const timer = setTimeout(() => {
      const fetchWaveformsSequentially = async () => {
        // 파형 데이터가 없으면서, 비디오 소스와 duration이 있는 트랙만 필터링합니다.
        const trimmersToProcess = trimmers.filter(
          t => t.sourceVideo?.uri && t.duration > 0 && !t.waveform,
        );

        if (trimmersToProcess.length === 0) {
          return;
        }

        // 한 번에 하나씩 순차적으로 파형을 추출하여 성능 저하를 방지합니다.
        const newWaveforms: { id: string; waveform: number[] }[] = [];
        for (const trimmer of trimmersToProcess) {
          try {
            const waveform = await extractWaveformData(
              trimmer.sourceVideo!.uri,
              trimmer.duration,
              sessionId => {
                activeFfmpegSessionId.current = sessionId;
              },
            );

            if (waveform && waveform.length > 0) {
              newWaveforms.push({ id: trimmer.id, waveform });
            } else {
              // 파형 추출 실패 또는 빈 배열 반환 시 경고
              console.warn(
                `[Waveform] Failed to extract or received empty waveform for ${trimmer.id}.`,
              );
            }
          } catch (error) {
            // 오류 로깅
            console.error(
              `[Waveform] Error extracting waveform for ${trimmer.id}:`,
              error,
            );
          }
        }
        activeFfmpegSessionId.current = null;

        if (newWaveforms.length > 0) {
          setTrimmers(currentTrimmers => {
            const updatedTrimmers = [...currentTrimmers];
            newWaveforms.forEach(update => {
              const index = updatedTrimmers.findIndex(t => t.id === update.id);
              if (index !== -1) {
                updatedTrimmers[index] = {
                  ...updatedTrimmers[index],
                  waveform: update.waveform,
                };
              }
            });
            return updatedTrimmers;
          });
        }
      };

      fetchWaveformsSequentially();
    }, 200); // 안정성을 위해 지연 시간을 1초로 늘림

    return () => {
      clearTimeout(timer);
      if (activeFfmpegSessionId.current) {
        FFmpegKit.cancel(activeFfmpegSessionId.current);
        activeFfmpegSessionId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveformDependencies]);

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
    // [수정] trackEndTime 계산 시 timelinePosition이 음수인 경우를 고려
    const trackEndTimes = trimmers.map(t => {
      const clipDuration = t.endTime - t.startTime;
      const trackEndTime = t.timelinePosition + clipDuration;

      // timelinePosition이 음수인 경우, 실제 비디오의 끝점을 올바르게 계산
      if (t.timelinePosition < 0) {
        // 음수 timelinePosition을 보정하여 실제 끝점 계산
        return Math.max(trackEndTime, t.endTime);
      }

      return trackEndTime;
    });

    let maxStart = Math.max(...trackStartTimes);
    let minEnd = Math.min(...trackEndTimes);

    // [수정] 시작점 임계값 적용
    maxStart = Math.max(startPointThreshold, maxStart);

    // [수정] 엔드포인트 임계점을 스타트 포인트 임계점부터 가장 긴 트랙의 길이까지의 거리로 계산
    const longestTrackDuration = Math.max(
      ...trimmers.map(t => t.endTime - t.startTime),
    );
    const calculatedEndPointThreshold =
      startPointThreshold + longestTrackDuration;

    // 계산된 엔드포인트 임계점과 실제 트랙들의 끝점 중 더 작은 값 사용
    minEnd = Math.min(calculatedEndPointThreshold, minEnd);

    // 계산된 시작점이 현재 시작점보다 앞서는 경우, 수동 설정을 존중하여 덮어쓰지 않음
    if (maxStart > globalStartTime) {
      setGlobalStartTime(maxStart);
    }

    const newEndTime = minEnd < maxStart ? maxStart : minEnd;
    // 계산된 종료점이 현재 종료점보다 작은 경우에만 업데이트하여 수동 조작을 존중
    if (newEndTime < globalEndTime) {
      setGlobalEndTime(newEndTime);
    }
  }, [trimmers, globalStartTime, globalEndTime, startPointThreshold]);

  // =================================================================================
  // 5. 핸들러 함수 (이벤트 처리)
  // =================================================================================

  // 자식 컴포넌트(VideoPreviewSlot)의 ref를 부모(이 컴포넌트)의 ref 객체에 저장
  const setPreviewSlotRef = useCallback(
    (id: string, ref: VideoPreviewSlotHandles | null) => {
      previewSlotRefs.current[id] = ref;
    },
    [],
  );

  // 프리뷰 영역의 레이아웃이 변경될 때 가상 캔버스의 스케일 계산
  const handlePreviewLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      const scale = Math.min(
        width / 540, // VIRTUAL_WIDTH
        height / 960, // VIRTUAL_HEIGHT
      );
      setPreviewScale(scale);
    }
  }, []);

  // 자식 컴포넌트(VideoControlSet)에서 Trimmer 상태가 변경되었을 때 호출됨
  const handleTrimmerUpdate = useCallback(
    (id: string, newState: Partial<Omit<TrimmerState, 'id'>>) => {
      setTrimmers(prev =>
        prev.map(trimmer =>
          trimmer.id === id ? { ...trimmer, ...newState } : trimmer,
        ),
      );
      setSeekTrigger(c => c + 1); // [추가] 비디오 위치 조정을 수동으로 트리거
    },
    [],
  );

  const handlePlaybackUpdate = useCallback(
    (id: string, newState: Partial<PlaybackState>) => {
      setPlaybackStates(prev => ({
        ...prev,
        [id]: { ...(prev[id] ?? {}), ...newState },
      }));
    },
    [],
  );

  // 모든 비디오 동시 일시정지
  const handleGlobalPause = useCallback(() => {
    setIsGloballyPlaying(false);
    setTrimmers(prev =>
      prev.map(t => (t.isPlaying ? { ...t, isPlaying: false } : t)),
    );
    setPlaybackStates(prev => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach(key => {
        if (!newStates[key].isPaused) {
          newStates[key] = { ...newStates[key], isPaused: true };
        }
      });
      return newStates;
    });

    // 개별재생 중이면 뮤트 상태를 원래대로 복원
    if (soloTrackId) {
      setSoloTrackId(null);
      setTrimmers(prev =>
        prev.map(t => ({ ...t, isMuted: preSoloMuteStates[t.id] ?? false })),
      );
    }
  }, [soloTrackId, preSoloMuteStates]);

  // 모든 비디오를 동시 재생 시작점으로 이동
  const handleGlobalSeekToStart = useCallback(() => {
    handleGlobalPause();
    trimmers.forEach(t => {
      if (previewSlotRefs.current[t.id]) {
        const clipDuration = t.endTime - t.startTime;
        const trackStartTime = t.timelinePosition;
        const trackEndTime = trackStartTime + clipDuration;

        let seekTime;
        if (globalStartTime < trackStartTime) {
          seekTime = t.startTime;
        } else if (globalStartTime > trackEndTime) {
          seekTime = t.endTime;
        } else {
          const timeIntoClip = globalStartTime - trackStartTime;
          seekTime = t.startTime + timeIntoClip;
        }

        previewSlotRefs.current[t.id]?.seek(seekTime);
        handlePlaybackUpdate(t.id, {
          currentTime: seekTime,
          isPaused: true,
        });
      }
    });
    setTimelinePosition(globalStartTime);
    timelineRef.current?.scrollToTime(globalStartTime);
  }, [trimmers, globalStartTime, handleGlobalPause, handlePlaybackUpdate]);

  // 전역 재생/일시정지 버튼 토글
  const handleToggleGlobalPlay = useCallback(() => {
    if (isGloballyPlaying) {
      handleGlobalPause();
      setSeekAndPlayRequest(null);
      setPlayRequest(false);
    } else {
      const isOutside =
        timelinePosition < globalStartTime || timelinePosition >= globalEndTime;

      if (isOutside) {
        // 엔드포인트에 있으면 시작점으로 이동 후 재생
        handleGlobalSeekToStart();
        setPlayRequest(true);
      } else {
        // 현재 위치에서 재생
        setPlayRequest(true);
      }
    }
  }, [
    isGloballyPlaying,
    handleGlobalPause,
    timelinePosition,
    globalStartTime,
    globalEndTime,
    handleGlobalSeekToStart,
  ]);

  // 비디오 재생 중 주기적으로 호출 (onProgress)
  const handleProgress = useCallback(
    (id: string, data: OnProgressData) => {
      // isGloballyPlaying은 최신 상태를 반영해야 하므로 의존성 배열에 남겨둡니다.
      if (!isGloballyPlaying) {
        return;
      }

      // 상태 대신 ref를 사용하여 최신 값을 참조합니다.
      const currentTrimmers = trimmersRef.current;
      if (currentTrimmers.length === 0 || id !== currentTrimmers[0].id) {
        return;
      }

      const trimmer = currentTrimmers[0];
      const timeSinceClipStart = data.currentTime - trimmer.startTime;
      const currentTimelinePosition =
        trimmer.timelinePosition + timeSinceClipStart;

      // 음수 값 처리
      if (currentTimelinePosition < 0) {
        return;
      }

      // 엔드포인트 임계값 계산
      const stopThreshold = Math.min(
        globalEndTimeRef.current,
        endPointThresholdRef.current,
      );

      // 더 정확한 엔드포인트 감지 (epsilon을 0.01로 줄임)
      const epsilon = 0.01;

      // 엔드포인트에 도달했는지 확인
      if (
        stopThreshold > 0 &&
        currentTimelinePosition >= stopThreshold - epsilon
      ) {
        console.log('[handleProgress] 엔드포인트 도달 - 정지 실행');

        // 정확히 엔드포인트 위치로 멈춤
        setTimelinePosition(stopThreshold);
        handleGlobalPause();
      } else {
        setTimelinePosition(currentTimelinePosition);
      }
    },
    // 의존성 배열에서 trimmers, globalEndTime, endPointThreshold 제거하여 함수를 안정화
    [isGloballyPlaying, handleGlobalPause],
  );

  // 비디오 로딩 완료 시 (onLoad), 비디오 길이(duration) 상태 업데이트
  const handleVideoLoad = useCallback(
    (id: string, data: OnLoadData) => {
      handleTrimmerUpdate(id, {
        duration: data.duration,
        startTime: 0,
        endTime: data.duration,
      });
      handlePlaybackUpdate(id, { currentTime: 0, isPaused: true });
    },
    [handleTrimmerUpdate, handlePlaybackUpdate],
  );

  // 개별 비디오 재생/일시정지/정지/탐색 핸들러
  const handlePlay = useCallback(
    (id: string) => {
      handlePlaybackUpdate(id, { isPaused: false });
      setTrimmers(prev =>
        prev.map(t => (t.id === id ? { ...t, isPlaying: true } : t)),
      );
    },
    [handlePlaybackUpdate],
  );

  const handlePause = useCallback(
    (id: string) => {
      handlePlaybackUpdate(id, { isPaused: true });
      setTrimmers(prev =>
        prev.map(t => (t.id === id ? { ...t, isPlaying: false } : t)),
      );
    },
    [handlePlaybackUpdate],
  );

  const handleStop = useCallback(
    (id: string) => {
      const trimmer = trimmersRef.current.find(t => t.id === id);
      if (trimmer) {
        previewSlotRefs.current[id]?.seek(trimmer.startTime);
        handlePlaybackUpdate(id, {
          isPaused: true,
          currentTime: trimmer.startTime,
        });
      }
    },
    [handlePlaybackUpdate],
  );

  const handleSeek = useCallback(
    (id: string, time: number) => {
      previewSlotRefs.current[id]?.seek(time);
      handlePlaybackUpdate(id, { currentTime: time });
    },
    [handlePlaybackUpdate],
  );

  const handleDragStateChange = useCallback((isDragging: boolean) => {
    isDraggingHandleRef.current = isDragging;
  }, []);

  // 모든 비디오를 동시 재생 시작점으로 이동
  const handleGlobalSeekToEnd = useCallback(() => {
    handleGlobalPause();
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
    timelineRef.current?.scrollToTime(globalEndTime);
  }, [trimmers, globalEndTime, handleGlobalPause, handlePlaybackUpdate]);

  const handleTrackPositionChange = useCallback(
    (trackId: string, newPosition: number) => {
      handleTrimmerUpdate(trackId, { timelinePosition: newPosition });
    },
    [handleTrimmerUpdate],
  );

  const handleTrackSelectionChange = useCallback(
    (trackId: string | null) => {
      if (trackId === null) {
        recalculateGlobalBoundaries();
      }
      const track = trimmers.find(t => t.id === trackId);
      if (trackId && previewState === 'collapsed' && track) {
        setSelectedTrack(track);
        setSettingsButtonVisible(true);
      } else {
        setSelectedTrack(null);
        setSettingsButtonVisible(false);
        setSheetVisible(false);
        setIsActionMenuVisible(false);
      }
    },
    [trimmers, previewState, recalculateGlobalBoundaries],
  );

  // --- [추가] 액션 메뉴 핸들러 ---
  const handleAlignTrackLeft = useCallback(() => {
    if (!selectedTrack) return;
    if (
      timelinePosition >= globalStartTime &&
      timelinePosition <= globalEndTime
    ) {
      const offset = timelinePosition - globalStartTime;
      const newPosition = selectedTrack.timelinePosition - offset;
      handleTrimmerUpdate(selectedTrack.id, { timelinePosition: newPosition });
      setTimelinePosition(globalStartTime);
      timelineRef.current?.scrollToTime(globalStartTime);
    } else {
      Alert.alert('알림', '플레이헤드를 재생 영역 내에 위치시켜 주세요.');
    }
  }, [
    selectedTrack,
    timelinePosition,
    globalStartTime,
    globalEndTime,
    handleTrimmerUpdate,
  ]);

  const handleMoveTrackLeft = useCallback(() => {
    if (!selectedTrack) return;
    const newPosition = selectedTrack.timelinePosition - 0.033;
    handleTrimmerUpdate(selectedTrack.id, { timelinePosition: newPosition });
  }, [selectedTrack, handleTrimmerUpdate]);

  const handleToggleIndividualPlay = useCallback(() => {
    if (!selectedTrack) return;

    if (soloTrackId === selectedTrack.id) {
      setSoloTrackId(null);
      setTrimmers(prev =>
        prev.map(t => ({ ...t, isMuted: preSoloMuteStates[t.id] ?? false })),
      );
      if (isGloballyPlaying) {
        handleGlobalPause();
      }
    } else if (soloTrackId === null && isGloballyPlaying) {
      handleGlobalPause();
    } else {
      // 1단계: 음소거 상태 저장 및 적용
      const currentMuteStates: Record<string, boolean> = {};
      trimmers.forEach(t => {
        currentMuteStates[t.id] = t.isMuted;
      });
      setPreSoloMuteStates(currentMuteStates);
      setSoloTrackId(selectedTrack.id);
      setTrimmers(prev =>
        prev.map(t => ({ ...t, isMuted: t.id !== selectedTrack.id })),
      );

      // 2단계: 음소거 적용 후 재생 시작 (setTimeout으로 지연)
      setTimeout(() => {
        if (!isGloballyPlaying) {
          handleToggleGlobalPlay();
        }
      }, 100);
    }
  }, [
    selectedTrack,
    soloTrackId,
    trimmers,
    isGloballyPlaying,
    preSoloMuteStates,
    handleGlobalPause,
    handleToggleGlobalPlay,
  ]);

  const handleMoveTrackRight = useCallback(() => {
    if (!selectedTrack) return;

    if (
      timelinePosition >= globalStartTime &&
      timelinePosition <= globalEndTime
    ) {
      const offset = globalEndTime - timelinePosition;
      const newPosition = selectedTrack.timelinePosition + offset;
      handleTrimmerUpdate(selectedTrack.id, { timelinePosition: newPosition });
      setTimelinePosition(globalEndTime);
      timelineRef.current?.scrollToTime(globalEndTime);
    } else {
      Alert.alert('알림', '플레이헤드를 재생 영역 내에 위치시켜 주세요.');
    }
  }, [
    selectedTrack,
    timelinePosition,
    globalStartTime,
    globalEndTime,
    handleTrimmerUpdate,
  ]);

  const handleAlignTrackRight = useCallback(() => {
    if (!selectedTrack) return;
    const newPosition = selectedTrack.timelinePosition + 0.033;
    handleTrimmerUpdate(selectedTrack.id, { timelinePosition: newPosition });
  }, [selectedTrack, handleTrimmerUpdate]);

  const handleGlobalStartTimeUpdate = useCallback((newTime: number) => {
    setGlobalStartTime(newTime);
  }, []);

  const handleGlobalEndTimeUpdate = useCallback((newTime: number) => {
    setGlobalEndTime(newTime);
  }, []);

  const handlePositionChange = useCallback((time: number) => {
    console.log('[handlePositionChange] timelinePosition 변경:', time);
    setTimelinePosition(time);
  }, []);

  const onSeekComplete = useCallback(() => {
    if (seekCompleteCallback.current) {
      seekCompleteCallback.current();
    }
  }, []);

  // --- 5.3. 전역 컨트롤 핸들러 ---
  // 모든 비디오 동시 재생 (현재는 사용되지 않고 handleToggleGlobalPlay로 통합됨)
  const handleGlobalPlay = () => {
    trimmers.forEach(t => handlePlaybackUpdate(t.id, { isPaused: false }));
  };

  // [수정] 재생 요청이 들어오면 비디오를 재생하는 useEffect
  useEffect(() => {
    console.log('[useEffect] seekAndPlayRequest 변경:', seekAndPlayRequest);

    if (seekAndPlayRequest !== null) {
      const videoId = trimmers[0]?.id;
      console.log('[useEffect] seekAndPlayRequest 처리 - videoId:', videoId);

      if (videoId && previewSlotRefs.current[videoId]) {
        // seek가 완료된 후 실행할 콜백 설정
        seekCompleteCallback.current = () => {
          setTimelinePosition(seekAndPlayRequest);

          // 모든 비디오를 새로운 위치로 이동
          trimmersRef.current.forEach((t: any) => {
            const ref = previewSlotRefs.current[t.id];
            if (ref) {
              const trackStartTime = t.timelinePosition;
              const trackEndTime = trackStartTime + (t.endTime - t.startTime);

              let seekTime;
              if (seekAndPlayRequest < trackStartTime) {
                seekTime = t.startTime;
              } else if (seekAndPlayRequest > trackEndTime) {
                seekTime = t.endTime;
              } else {
                const timeIntoClip = seekAndPlayRequest - trackStartTime;
                seekTime = t.startTime + timeIntoClip;
              }

              if (isFinite(seekTime)) {
                ref.seek(seekTime);
                handlePlaybackUpdate(t.id, {
                  currentTime: seekTime,
                  isPaused: true,
                });
              }
            }
          });

          setPlayRequest(true);
          seekCompleteCallback.current = null;
        };
        // seek 실행
        console.log('[useEffect] seek 실행:', seekAndPlayRequest);
        previewSlotRefs.current[videoId]?.seek(seekAndPlayRequest);
      }
    } else {
      // 재생 요청이 취소되면 콜백도 취소
      console.log('[useEffect] seekAndPlayRequest null - 콜백 취소');
      seekCompleteCallback.current = null;
    }
  }, [seekAndPlayRequest, trimmers, playbackStates, handlePlaybackUpdate]);

  // [수정] 2단계: 재생 요청 처리
  useEffect(() => {
    console.log('[useEffect] playRequest 변경:', playRequest);

    if (!playRequest) return;

    console.log('[useEffect] 재생 시작 - isGloballyPlaying: true');
    setIsGloballyPlaying(true);
    trimmers.forEach(trimmer => {
      console.log('[useEffect] 비디오 재생:', trimmer.id);
      handlePlaybackUpdate(trimmer.id, { isPaused: false });
    });
    setPlayRequest(false);
  }, [playRequest, trimmers, handlePlaybackUpdate]);

  // [추가] 트랙 드래그 종료 핸들러
  const handleTrackDragEnd = useCallback(() => {
    // 현재는 아무 작업도 하지 않지만, 나중에 필요할 경우를 위해 안정적인 함수로 정의
  }, []);

  // 볼륨 변경 핸들러
  const handleVolumeChange = useCallback(
    (value: number) => {
      if (selectedTrack) {
        handleTrimmerUpdate(selectedTrack.id, { volume: value });
      }
    },
    [selectedTrack, handleTrimmerUpdate],
  );

  const memoizedPreviewPanel = useMemo(() => {
    return (
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
    );
  }, [
    previewHeightAnim,
    trimmers,
    playbackStates,
    previewScale,
    handlePreviewLayout,
    setPreviewSlotRef,
    handleVideoLoad,
    handleProgress,
    handlePlay,
    handlePause,
    handleStop,
    onSeekComplete,
    previewState,
  ]);

  return (
    <ScreenContainer edges={['bottom']}>
      {/* 7.1. 비디오 미리보기 영역 */}
      {memoizedPreviewPanel}

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
                onTrackDragEnd={handleTrackDragEnd} // [수정] 콜백 함수 사용
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
          {isActionMenuVisible && (
            <View style={styles.centeredActionMenuContainer}>
              <View style={styles.actionMenu}>
                <TouchableOpacity
                  onPress={handleAlignTrackLeft}
                  style={styles.actionMenuItem}
                >
                  <AlignStartVertical color="white" size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleMoveTrackLeft}
                  style={styles.actionMenuItem}
                >
                  <ArrowBigLeftDashIcon color="white" size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleToggleIndividualPlay}
                  style={styles.actionMenuItem}
                >
                  {(soloTrackId === selectedTrack?.id || isGloballyPlaying) &&
                  selectedTrack ? (
                    <CirclePause color="white" size={24} />
                  ) : (
                    <CirclePlay color="white" size={24} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleMoveTrackRight}
                  style={styles.actionMenuItem}
                >
                  <ArrowBigRightDashIcon color="white" size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAlignTrackRight}
                  style={styles.actionMenuItem}
                >
                  <AlignEndVertical color="white" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 볼륨 컨트롤 메뉴 */}
          {isVolumeMenuVisible && selectedTrack && (
            <View style={styles.centeredActionMenuContainer}>
              <View style={[styles.actionMenu, styles.volumeMenu]}>
                <View style={styles.volumeContainer}>
                  <Text style={styles.volumeLabel}>볼륨</Text>
                  <View style={styles.volumeSliderContainer}>
                    <Slider
                      style={styles.volumeSlider}
                      minimumValue={0}
                      maximumValue={2}
                      value={selectedTrack.volume}
                      onValueChange={handleVolumeChange}
                      minimumTrackTintColor="#ffffff"
                      maximumTrackTintColor="#666666"
                      thumbTintColor="transparent"
                    />
                  </View>
                  <Text style={styles.volumeValue}>
                    {Math.round(selectedTrack.volume * 100)}%
                  </Text>
                </View>
              </View>
            </View>
          )}

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
                onPress={() => setIsVolumeMenuVisible(v => !v)}
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

                  position: 'absolute',
                  right: 16,
                  padding: 20,
                }}
              >
                <SlidersVertical color="white" size={20} />
              </TouchableOpacity>
            )}
            {isSettingsButtonVisible && (
              <TouchableOpacity
                onPress={() => setIsActionMenuVisible(v => !v)}
                style={[
                  styles.actionButton,
                  { position: 'absolute', left: 16 },
                ]}
              >
                <Settings2 color="white" size={20} />
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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    backgroundColor: '#000',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 20,
  },
  centeredActionMenuContainer: {
    position: 'absolute',
    bottom: 76, // GlobalControls 높이(60) + 간격(16)
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionMenu: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 30,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    width: '100%',
    height: 60,
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
  },
  volumeMenu: {
    height: 100,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  volumeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volumeLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  volumeSliderContainer: {
    width: '100%',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  volumeSlider: {
    width: '100%',
    height: 30,
  },
  volumeValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  actionMenuItem: {
    // padding: 16,
  },
});

export default VideoEditScreen;
