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

// Styled Components 정의
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

// CommonButton을 확장하여 GlobalActionButton 정의
const GlobalActionButton = styled(CommonButton)`
  background-color: #3498db;
  padding-vertical: 10px;
  padding-horizontal: 12px;
  border-radius: 8px;
  margin-bottom: 0; /* CommonButton의 기본 마진 오버라이드 */
  flex: 1; /* 공간을 균등하게 분배 */
  margin-horizontal: 5px; /* 버튼 간 작은 간격 */
`;

// GlobalActionButton 내부에 사용될 텍스트 스타일
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

/**
 * VideoEditScreen 컴포넌트는 여러 비디오를 편집하고 콜라주를 생성하는 메인 편집 화면입니다.
 * 각 비디오는 SingleVideoEditor를 통해 개별적으로 제어되며, 전역 재생 컨트롤과
 * 콜라주 생성 및 저장 기능을 제공합니다. 모든 스타일은 styled-components로 정의되었습니다.
 */
const VideoEditScreen: React.FC<{ route: VideoEditScreenRouteProp }> = ({ route }) => {
  const { videos = [] } = route.params ?? {}; // 내비게이션 파라미터로부터 비디오 배열 가져오기
  const [trimmers, setTrimmers] = useState<TrimmerState[]>([]); // 각 비디오 슬롯의 상태 관리
  const editorRefs = useRef<Record<string, SingleEditorHandles | null>>({}); // SingleVideoEditor 컴포넌트들의 ref 관리
  const [isCreatingCollage, setIsCreatingCollage] = useState(false); // 콜라주 생성 중 로딩 상태
  const [collagePath, setCollagePath] = useState<string | null>(null); // 생성된 콜라주 비디오 경로

  // 컴포넌트 마운트 시 초기 트리머 상태 설정
  useEffect(() => {
    const initialTrimmers = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
      const video = videos[i] || null; // 전달된 비디오가 있으면 해당 슬롯에 할당
      return {
        id: `trimmer${i + 1}`,
        sourceVideo: video,
        startTime: 0,
        endTime: 0,
        duration: 0,
        equalizer: JSON.parse(JSON.stringify(defaultEQBands)), // 기본 EQ 밴드를 깊은 복사하여 할당
        volume: 1,
        aspectRatio: 'original',
        originalAspectRatioValue: '1.777', // 기본 화면 비율 (예: 16:9)
      };
    });
    console.log('[VideoEditScreen] Trimmer slots initialized:', initialTrimmers.map(t => ({ id: t.id, hasVideo: !!t.sourceVideo })));
    setTrimmers(initialTrimmers);
  }, [videos]); // videos 파라미터가 변경될 때마다 재실행

  // 특정 트리머의 상태 업데이트 핸들러
  const handleTrimmerUpdate = (id: string, newState: Partial<Omit<TrimmerState, 'id'>>) => {
    console.log(`[VideoEditScreen] '${id}' state update received:`, newState);
    setTrimmers(prevTrimmers =>
      prevTrimmers.map(trimmer =>
        trimmer.id === id ? { ...trimmer, ...newState } : trimmer
      )
    );
  };

  // 비디오 로드 완료 핸들러 (SingleVideoEditor로부터 호출됨)
  const handleVideoLoad = (id: string, data: OnLoadData, aspectRatio: string) => {
    console.log(`[VideoEditScreen] Video '${id}' loaded. DURATION: ${data.duration}, AR: ${aspectRatio}`);
    handleTrimmerUpdate(id, {
      duration: data.duration, // 비디오 전체 길이 설정
      endTime: data.duration, // 종료 시간을 전체 길이로 설정
      originalAspectRatioValue: aspectRatio, // 원본 화면 비율 설정
    });
  };

  // 모든 비디오 동시 재생
  const handleGlobalPlay = () => {
    console.log('[VideoEditScreen] Global Play button clicked');
    Object.values(editorRefs.current).forEach(ref => ref?.playVideo());
  };

  // 모든 비디오 동시 일시정지
  const handleGlobalPause = () => {
    console.log('[VideoEditScreen] Global Pause button clicked');
    Object.values(editorRefs.current).forEach(ref => ref?.pauseVideo());
  };

  // 모든 비디오 재생 위치 초기화 (시작 시간으로 이동)
  const handleGlobalSeekToStart = () => {
    console.log('[VideoEditScreen] Global Seek to Start button clicked');
    Object.values(editorRefs.current).forEach(ref => ref?.seekToStart());
  };

  /**
   * FFmpeg를 사용하여 비디오 콜라주를 생성합니다.
   */
  const createCollage = async () => {
    // 소스 비디오가 있는 활성화된 트리머만 필터링
    const activeTrimmers = trimmers.filter(t => t.sourceVideo && t.duration > 0);
    if (activeTrimmers.length === 0) {
      Alert.alert('오류', '콜라주를 만들려면 하나 이상의 비디오가 필요합니다.');
      return;
    }

    console.log('[VideoEditScreen] Starting collage creation...');
    setIsCreatingCollage(true); // 콜라주 생성 로딩 시작
    setCollagePath(null); // 이전 콜라주 경로 초기화

    try {
      // FFmpeg 필터 생성을 위한 데이터 준비
      const editData: EditData = {
        trimmers: activeTrimmers.map(t => ({
          startTime: t.startTime,
          endTime: t.endTime,
          volume: t.volume,
          // 'original'이면 originalAspectRatioValue 사용, 아니면 설정된 aspectRatio 사용
          aspectRatio: t.aspectRatio === 'original' && t.originalAspectRatioValue
            ? t.originalAspectRatioValue
            : t.aspectRatio,
          equalizer: t.equalizer.map(({ frequency, gain }) => ({ frequency, gain })),
        })),
      };

      console.log('[VideoEditScreen] Data for filter generation:', JSON.stringify(editData, null, 2));

      // FFmpeg 필터 복합 그래프 생성
      const filterComplexArray = generateCollageFilterComplex(editData);
      const filterComplexString = filterComplexArray.join('; ');

      // FFmpeg 입력 명령어 생성
      const inputVideos = activeTrimmers.map(t => t.sourceVideo!);
      const inputCommands = inputVideos.map(v => `-i "${v.uri}"`).join(' ');
      // 출력 파일 경로 설정
      const outputPath = `${RNFS.DocumentDirectoryPath}/collage_${Date.now()}.mp4`;

      // 오디오 믹싱 여부 확인 및 오디오 맵 명령어 생성
      const hasAudio = activeTrimmers.some(t => t.volume > 0);
      const audioMapCommand = hasAudio ? '-map "[a]"' : '';

      // 플랫폼별 비디오 인코더 설정
      const encoder = Platform.OS === 'ios'
        ? '-c:v h264_videotoolbox -b:v 2M' // iOS 하드웨어 가속 인코더
        : '-c:v libx264'; // Android 소프트웨어 인코더 (하드웨어 가속인 h264_mediacodec도 가능하지만 안정성 고려)

      // 최종 FFmpeg 명령어 조합
      const command = `${inputCommands} -filter_complex "${filterComplexString}" -map "[v]" ${audioMapCommand} ${encoder} -preset fast -crf 28 -shortest "${outputPath}"`;
      console.log('[VideoEditScreen] Final command to execute:', command);

      // FFmpeg 명령어 실행
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        setCollagePath(outputPath); // 콜라주 경로 설정
        Alert.alert('성공!', '비디오 콜라주가 성공적으로 생성되었습니다.');
      } else {
        const errorLogs = await session.getLogsAsString(); // 실패 시 상세 로그 가져오기
        Alert.alert('오류', '콜라주 생성 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.');
        console.error('[VideoEditScreen] FFmpeg execution failed! Detailed logs:', errorLogs);
      }
    } catch (error) {
      Alert.alert('오류', '콜라주 생성 중 예외가 발생했습니다.');
      console.error('Collage creation exception:', error);
    } finally {
      setIsCreatingCollage(false); // 콜라주 생성 로딩 종료
    }
  };

  /**
   * 생성된 콜라주 비디오를 갤러리에 저장합니다.
   */
  const saveCollageToGallery = async () => {
    if (!collagePath) {
        Alert.alert('알림', '저장할 콜라주가 없습니다. 먼저 콜라주를 생성해주세요.');
        return;
    }
    try {
      await CameraRoll.save(collagePath, { type: 'video', album: 'VideoEditorApp' }); // 갤러리에 저장
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
          {/* CommonButton의 children prop을 사용하도록 변경 */}
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

        {/* 각 비디오 슬롯 에디터 렌더링 */}
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

        {collagePath && ( // 콜라주가 생성되었을 때 결과 섹션 표시
          <ResultSection>
            <SectionHeader title="✨ 콜라주 결과" titleStyle={ResultSectionTitle} />
            <ResultVideoPlayer source={{ uri: collagePath }} controls={true} resizeMode="contain" />
            <SaveResultButton onPress={saveCollageToGallery}>
              <GlobalButtonText>결과물 사진첩에 저장</GlobalButtonText> {/* Text 컴포넌트를 children으로 전달 */}
            </SaveResultButton>
          </ResultSection>
        )}

        <CreateCollageSection>
          <CreateCollageButton
            onPress={createCollage}
            isLoading={isCreatingCollage}
            disabled={isCreatingCollage}
          >
            {/* 텍스트를 children으로 전달 */}
            <GlobalButtonText>콜라주 생성</GlobalButtonText>
          </CreateCollageButton>
        </CreateCollageSection>
      </ContentScrollView>
    </ScreenContainer>
  );
};

export default VideoEditScreen;
