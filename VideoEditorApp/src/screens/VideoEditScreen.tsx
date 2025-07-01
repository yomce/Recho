// React-Native-Video와 Android Compiler간 충돌 => Node_modules
// https://github.com/r0b0t3d/react-native-video/blob/master/android/src/main/java/com/brentvatne/common/react/VideoEventEmitter.kt
// 참고하여 해결하기

// Android FFmpeg 오류
// https://medium.com/@nooruddinlakhani/resolved-ffmpegkit-retirement-issue-in-react-native-a-complete-guide-0f54b113b390
// 참고하여 해결하기

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components/native';
import { SafeAreaView, Alert, Platform, TextStyle } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import Video, { OnLoadData } from 'react-native-video';

import SingleVideoEditor from '../components/SingleVideoEditor'; // 리팩터링된 SingleVideoEditor 임포트
import { generateCollageFilterComplex } from '../utils/ffmpegFilters'; // ffmpegFilters 유틸리티 임포트
import {
  VideoEditScreenRouteProp,
  TrimmerState,
  SingleEditorHandles,
  EQBand,
  EditData,
} from '../types'; // 업데이트된 타입 임포트
import CommonButton from '../components/Common/CommonButton'; // CommonButton 임포트 (수정됨)
import SectionHeader from '../components/Common/SectionHeader'; // SectionHeader 임포트

// 기본 EQ 밴드 설정
const defaultEQBands: EQBand[] = [
  { id: 'band1', frequency: 60, gain: 0 },
  { id: 'band2', frequency: 250, gain: 0 },
  { id: 'band3', frequency: 1000, gain: 0 },
  { id: 'band4', frequency: 4000, gain: 0 },
  { id: 'band5', frequency: 12000, gain: 0 },
];

// 총 비디오 슬롯 개수
const TOTAL_SLOTS = 6;

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

const ResultSection = styled.View`
  margin-horizontal: 15px;
  margin-vertical: 20px;
  padding: 15px;
  background-color: #34495e;
  border-radius: 15px;
  border-width: 2px;
  border-color: #27ae60; /* 녹색 테두리로 결과 섹션 강조 */
`;

const ResultSectionTitle : TextStyle = {
  color: '#27ae60', /* 녹색 제목 */
  marginBottom: 15,
  textAlign: 'center',
  fontSize: 18,
  fontWeight: 'bold',
};

const ResultVideoPlayer = styled(Video)`
  width: 100%;
  height: 250px;
  background-color: #000;
  border-radius: 10px;
  margin-bottom: 15px;
`;

const SaveResultButton = styled(CommonButton)`
  background-color: #f39c12; /* 주황색으로 저장 버튼 강조 */
  margin-bottom: 0; /* CommonButton의 기본 마진 오버라이드 */
`;

const VideoEditScreen: React.FC<{ route: VideoEditScreenRouteProp }> = ({ route }) => {
  const { videos = [] } = route.params ?? {};
  const [trimmers, setTrimmers] = useState<TrimmerState[]>([]);
  const editorRefs = useRef<Record<string, SingleEditorHandles | null>>({});
  const [isCreatingCollage, setIsCreatingCollage] = useState(false);
  const [collagePath, setCollagePath] = useState<string | null>(null);

  useEffect(() => {
    const initialTrimmers = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
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
    console.log('[VideoEditScreen] Trimmer slots initialized:', initialTrimmers.map(t => ({ id: t.id, hasVideo: !!t.sourceVideo })));
    setTrimmers(initialTrimmers);
  }, [videos]);

  const handleTrimmerUpdate = (id: string, newState: Partial<Omit<TrimmerState, 'id'>>) => {
    console.log(`[VideoEditScreen] '${id}' state update received:`, newState);
    setTrimmers(prevTrimmers =>
      prevTrimmers.map(trimmer =>
        trimmer.id === id ? { ...trimmer, ...newState } : trimmer
      )
    );
  };

  const handleVideoLoad = (id: string, data: OnLoadData, aspectRatio: string) => {
    console.log(`[VideoEditScreen] Video '${id}' loaded. DURATION: ${data.duration}, AR: ${aspectRatio}`);
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

  const createCollage = async () => {
    const activeTrimmers = trimmers.filter(t => t.sourceVideo && t.duration > 0);
    if (activeTrimmers.length === 0) {
      Alert.alert('오류', '콜라주를 만들려면 하나 이상의 비디오가 필요합니다.');
      return;
    }

    console.log('[VideoEditScreen] Starting collage creation...');
    setIsCreatingCollage(true);
    setCollagePath(null);

    try {
      const editData: EditData = {
        trimmers: activeTrimmers.map(t => ({
          startTime: t.startTime,
          endTime: t.endTime,
          volume: t.volume,
          aspectRatio: t.aspectRatio === 'original' && t.originalAspectRatioValue
            ? t.originalAspectRatioValue
            : t.aspectRatio,
          equalizer: t.equalizer.map(({ frequency, gain }) => ({ frequency, gain })),
        })),
      };

      console.log('[VideoEditScreen] Data for filter generation:', JSON.stringify(editData, null, 2));

      const filterComplexArray = generateCollageFilterComplex(editData);
      const filterComplexString = filterComplexArray.join('; ');

      // [수정] cleanUri를 사용하여 각 비디오의 경로를 정제
      const inputVideos = activeTrimmers.map(t => t.sourceVideo!);
      const inputCommands = inputVideos.map(v => `-i "${cleanUri(v.uri)}"`).join(' ');

      const outputPath = `${RNFS.DocumentDirectoryPath}/collage_${Date.now()}.mp4`;
      const hasAudio = activeTrimmers.some(t => t.volume > 0);
      const audioMapCommand = hasAudio ? '-map "[a]"' : '';

      // [수정] 안드로이드 인코더를 하드웨어 가속(h264_mediacodec)으로 변경하여 성능 향상
      const encoder = Platform.OS === 'ios'
        ? '-c:v h264_videotoolbox -b:v 2M'
        : '-c:v h264_mediacodec';

      const command = `${inputCommands} -filter_complex "${filterComplexString}" -map "[v]" ${audioMapCommand} ${encoder} -preset fast -crf 28 -shortest "${outputPath}"`;
      console.log('[VideoEditScreen] Final command to execute:', command);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        setCollagePath(outputPath);
        Alert.alert('성공!', '비디오 콜라주가 성공적으로 생성되었습니다.');
      } else {
        const errorLogs = await session.getLogsAsString();
        Alert.alert('오류', '콜라주 생성 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.');
        console.error('[VideoEditScreen] FFmpeg execution failed! Detailed logs:', errorLogs);
      }
    } catch (error) {
      Alert.alert('오류', '콜라주 생성 중 예외가 발생했습니다.');
      console.error('Collage creation exception:', error);
    } finally {
      setIsCreatingCollage(false);
    }
  };

  const saveCollageToGallery = async () => {
    if (!collagePath) {
      Alert.alert('알림', '저장할 콜라주가 없습니다. 먼저 콜라주를 생성해주세요.');
      return;
    }
    try {
      // [수정] 저장 경로를 file:// 접두사와 함께 전달해야 CameraRoll이 인식
      await CameraRoll.save(`file://${collagePath}`, { type: 'video', album: 'VideoEditorApp' });
      Alert.alert('성공', '콜라주가 사진첩에 저장되었습니다!');
    } catch (error) {
      Alert.alert('오류', '사진첩 저장 중 오류가 발생했습니다.');
      console.error('Saving to gallery failed:', error);
    }
  };

  return (
    <ScreenContainer>
      <ContentScrollView contentInsetAdjustmentBehavior="automatic">
        <SectionHeader title="6-Video Collage Editor" />

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

        {collagePath && (
          <ResultSection>
            <SectionHeader title="✨ 콜라주 결과" titleStyle={ResultSectionTitle} />
            {/* [수정] file:// 접두사를 붙여 Video 컴포넌트가 인식하도록 함 */}
            <ResultVideoPlayer source={{ uri: `file://${collagePath}` }} controls={true} resizeMode="contain" />
            <SaveResultButton onPress={saveCollageToGallery}>
              <GlobalButtonText>결과물 사진첩에 저장</GlobalButtonText>
            </SaveResultButton>
          </ResultSection>
        )}

        <CreateCollageSection>
          <CreateCollageButton
            onPress={createCollage}
            isLoading={isCreatingCollage}
            disabled={isCreatingCollage}
          >
            <GlobalButtonText>콜라주 생성</GlobalButtonText>
          </CreateCollageButton>
        </CreateCollageSection>
      </ContentScrollView>
    </ScreenContainer>
  );
};

export default VideoEditScreen;