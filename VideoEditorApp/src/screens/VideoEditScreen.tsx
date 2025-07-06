// React-Native-Video와 Android Compiler간 충돌 => Node_modules
// https://github.com/r0b0t3d/react-native-video/blob/master/android/src/main/java/com/brentvatne/common/react/VideoEventEmitter.kt
// 참고하여 해결하기

// Android FFmpeg 오류
// https://medium.com/@nooruddinlakhani/resolved-ffmpegkit-retirement-issue-in-react-native-a-complete-guide-0f54b113b390
// 참고하여 해결하기

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
} from '../types';
import CommonButton from '../components/Common/CommonButton';
import SectionHeader from '../components/Common/SectionHeader';
import axiosInstance from '../api/axiosInstance';

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

// Styled Components 정의
const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: #000000;
`;

const PreviewArea = styled.View`
  flex: 2; /* 화면의 남는 공간의 2/3를 차지 */
  width: 100%;
  background-color: #1a1a1a;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* 캔버스의 일부가 넘칠 경우를 대비 */
  border-radius: 10px;
`;

const VIRTUAL_WIDTH = 540;
const VIRTUAL_HEIGHT = 960;
const PADDING = 20; // FFMpeg 스크립트와 동일한 값
const CORNER_RADIUS = 15; // FFMpeg 스크립트와 동일한 값

// 아웃풋 프레임
const VirtualCanvas = styled.View<{ scale: number }>`
  width: ${VIRTUAL_WIDTH}px;
  height: ${VIRTUAL_HEIGHT}px;
  background-color: #000000;

  justify-content: center;
  align-items: center;
  transform: ${({ scale }) => `scale(${scale})`};
  padding: ${PADDING}px; /* 그리드 전체의 바깥 여백 */
  overflow: hidden;
`;

const PreviewGridContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  width: 100%; /* 패딩이 적용된 부모 컨테이너(VirtualCanvas)를 꽉 채움 */
  gap: ${PADDING}px; /* 아이템 사이의 수평/수직 간격 */
`;

const SlotContainer = styled.View<{ width: number; height: number }>`
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  background-color: #000000;
  border-radius: ${CORNER_RADIUS}px;
  overflow: hidden;
`;

const ControlsWrapper = styled.View`
  flex: 1;
  background-color: #000000; /* 배경색 추가 */
`;

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

const ControlsScrollView = styled.ScrollView`
  flex: 1;
`;

const GlobalActionsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  padding: 8px;
  background-color: #000000;
  align-items: center; /* 아이콘 정렬을 위해 추가 */
`;

const IconButton = styled.TouchableOpacity`
  padding: 10px;
`;

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

const VideoEditScreen: React.FC<{
  route: RouteProp<{ VideoEdit: LocalVideoEditParams }, 'VideoEdit'>;
}> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {
    videos: localVideos = [],
    total_slots = 1,
    sourceVideos: serverVideos = [],
  } = route.params ?? {};

  // 화면 및 높이 관련 상태
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  const minControlHeight = 120; // 컨트롤 영역의 최소 높이

  const maxPreviewHeight =
    screenHeight -
    insets.top -
    insets.bottom -
    minControlHeight -
    DRAGGER_HEIGHT;
  const minPreviewHeight = screenWidth * (3 / 4);

  const [previewHeight, setPreviewHeight] = useState(maxPreviewHeight);
  const dragStartHeight = useRef(0);
  const heightRef = useRef(previewHeight);

  // previewHeight 상태가 변경될 때마다 ref의 값도 동기화
  useEffect(() => {
    heightRef.current = previewHeight;
  }, [previewHeight]);

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

  const [trimmers, setTrimmers] = useState<TrimmerState[]>([]);
  const [playbackStates, setPlaybackStates] = useState<
    Record<string, { currentTime: number; isPaused: boolean }>
  >({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const previewSlotRefs = useRef<
    Record<string, VideoPreviewSlotHandles | null>
  >({});

  useEffect(() => {
    const finalVideos = localVideos || [];
    const numSlots = finalVideos.length > 0 ? finalVideos.length : total_slots;

    const initialTrimmers = Array.from({ length: numSlots }, (_, i) => {
      const video = finalVideos[i] || null;
      const id = `trimmer${i + 1}`;
      return {
        id,
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

  const handlePreviewLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      const scale = Math.min(width / VIRTUAL_WIDTH, height / VIRTUAL_HEIGHT);
      setPreviewScale(scale);
    }
  };

  const handleTrimmerUpdate = (
    id: string,
    newState: Partial<Omit<TrimmerState, 'id'>>,
  ) => {
    setTrimmers(prev =>
      prev.map(trimmer =>
        trimmer.id === id ? { ...trimmer, ...newState } : trimmer,
      ),
    );
  };

  const handlePlaybackUpdate = (
    id: string,
    newState: Partial<{ currentTime: number; isPaused: boolean }>,
  ) => {
    setPlaybackStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...newState },
    }));
  };

  const handleVideoLoad = (id: string, data: OnLoadData) => {
    handleTrimmerUpdate(id, {
      duration: data.duration,
      endTime: data.duration,
    });
    handlePlaybackUpdate(id, { currentTime: 0 });
  };

  const handleProgress = (id: string, data: OnProgressData) => {
    const trimmer = trimmers.find(t => t.id === id);
    if (trimmer && data.currentTime >= trimmer.endTime) {
      previewSlotRefs.current[id]?.seek(trimmer.startTime);
      handlePlaybackUpdate(id, { isPaused: true });
    } else {
      handlePlaybackUpdate(id, { currentTime: data.currentTime });
    }
  };

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

  const handleGlobalPlay = () => {
    trimmers.forEach(t => handlePlaybackUpdate(t.id, { isPaused: false }));
  };

  const handleGlobalPause = () => {
    trimmers.forEach(t => handlePlaybackUpdate(t.id, { isPaused: true }));
  };

  const handleGlobalSeekToStart = () => {
    trimmers.forEach(t => {
      previewSlotRefs.current[t.id]?.seek(t.startTime);
      handlePlaybackUpdate(t.id, { currentTime: t.startTime, isPaused: true });
    });
  };

  const setPreviewSlotRef = (
    id: string,
    ref: VideoPreviewSlotHandles | null,
  ) => {
    previewSlotRefs.current[id] = ref;
  };

  const processVideoForUpload = async () => {
    const activeTrimmers = trimmers.filter(
      t => t.sourceVideo && t.duration > 0,
    );
    if (activeTrimmers.length === 0) {
      Alert.alert('오류', '업로드할 비디오를 선택해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
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

      const outputPath = `${
        RNFS.DocumentDirectoryPath
      }/collage_${Date.now()}.mp4`;
      const hasAudio = activeTrimmers.some(t => t.volume > 0);
      const audioMapCommand = hasAudio ? '-map "[a]"' : '';

      const encoder =
        Platform.OS === 'ios' ? 'h264_videotoolbox' : 'h264_mediacodec';

      const command = `${inputCommands} -filter_complex "${filterComplexString}" ${audioMapCommand} -c:v ${encoder} -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`;

      console.log('[VideoEditScreen] Executing FFmpeg command:', command);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        Alert.alert('성공', '비디오 콜라주가 성공적으로 생성되었습니다.');
        console.log(`[VideoEditScreen] Collage video saved to: ${outputPath}`);

        const videoToUpload = {
          uri: `file://${outputPath}`,
          name: outputPath.split('/').pop()!,
          type: 'video/mp4',
        };

        await getPresignedUrlAndUpload(videoToUpload);
        await CameraRoll.save(outputPath, { type: 'video' });

        navigation.navigate('Home');
      } else {
        const logs = await session.getLogsAsString();
        console.error('[VideoEditScreen] FFmpeg process failed. Logs:', logs);
        Alert.alert('오류', 'FFmpeg 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('[VideoEditScreen] Error during video processing:', error);
      Alert.alert('오류', '비디오 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

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

      const response = await axiosInstance.post('/video-insert/presigned-url', {
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

  const uploadFile = async (
    url: string,
    file: { uri: string; type: string },
  ) => {
    try {
      const response = await RNFS.readFile(cleanUri(file.uri), 'base64');
      const fileBuffer = Buffer.from(response, 'base64');

      await axios.put(url, fileBuffer, {
        headers: { 'Content-Type': file.type },
      });

      console.log('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  return (
    <ScreenContainer>
      <Animated.View style={{ height: previewHeight }}>
        <PreviewArea onLayout={handlePreviewLayout}>
          <VirtualCanvas scale={previewScale}>
            <PreviewGridContainer>
              {trimmers.map((trimmer, index) => {
                const numSlots = trimmers.length;
                const isOddLayout = numSlots % 2 !== 0;
                const isLastItem = index === numSlots - 1;

                // 패딩이 적용된 컨테이너의 실제 콘텐츠 너비를 기준으로 계산
                const contentWidth = VIRTUAL_WIDTH - PADDING * 2;
                const baseSlotWidth = (contentWidth - PADDING) / 2;

                let slotWidth: number;
                if (isOddLayout && isLastItem) {
                  slotWidth = contentWidth;
                } else {
                  slotWidth = baseSlotWidth;
                }
                const slotHeight = slotWidth * (3 / 4); // 4:3 비율 유지

                return (
                  <SlotContainer
                    key={trimmer.id}
                    width={slotWidth}
                    height={slotHeight}
                  >
                    <VideoPreviewSlot
                      ref={ref => setPreviewSlotRef(trimmer.id, ref)}
                      sourceVideo={trimmer.sourceVideo}
                      volume={trimmer.volume}
                      isPaused={playbackStates[trimmer.id]?.isPaused ?? true}
                      startTime={trimmer.startTime}
                      endTime={trimmer.endTime}
                      onLoad={data => handleVideoLoad(trimmer.id, data)}
                      onProgress={data => handleProgress(trimmer.id, data)}
                      onPlay={() => handlePlay(trimmer.id)}
                      onPause={() => handlePause(trimmer.id)}
                      onStop={() => handleStop(trimmer.id)}
                    />
                  </SlotContainer>
                );
              })}
            </PreviewGridContainer>
          </VirtualCanvas>
        </PreviewArea>
      </Animated.View>

      <Dragger {...panResponder.panHandlers}>
        <DragHandle />
      </Dragger>

      <ControlsWrapper>
        <GlobalActionsContainer>
          <IconButton onPress={handleGlobalPlay}>
            <MaterialCommunityIcons name="play" size={30} color="#3498db" />
          </IconButton>
          <IconButton onPress={handleGlobalPause}>
            <MaterialCommunityIcons name="pause" size={30} color="#3498db" />
          </IconButton>
          <IconButton onPress={handleGlobalSeekToStart}>
            <MaterialCommunityIcons name="refresh" size={30} color="#3498db" />
          </IconButton>
        </GlobalActionsContainer>

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
          <CreateCollageSection>
            <CreateCollageButton
              onPress={processVideoForUpload}
              disabled={isProcessing || uploading}
            >
              <GlobalButtonText>
                {isProcessing
                  ? '콜라주 생성 중...'
                  : uploading
                  ? '업로드 중...'
                  : '콜라주 생성 및 업로드'}
              </GlobalButtonText>
            </CreateCollageButton>
          </CreateCollageSection>
        </ControlsScrollView>
      </ControlsWrapper>
    </ScreenContainer>
  );
};

export default VideoEditScreen;
