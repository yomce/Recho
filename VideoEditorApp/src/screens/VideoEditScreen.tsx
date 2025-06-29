import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import Video, { OnLoadData } from 'react-native-video';

// --- 분리된 모듈 Import ---
import SingleVideoEditor from '../components/SingleVideoEditor';
import { generateCollageFilterComplex } from '../utils/ffmpegFilters';
import {
  VideoEditScreenRouteProp,
  TrimmerState,
  SingleEditorHandles,
  EQBand,
  EditData,
} from '../types';

// 기본 EQ 밴드 설정 (웹 버전과 동일)
const defaultEQBands: EQBand[] = [
  { id: 'band1', frequency: 60, gain: 0 },
  { id: 'band2', frequency: 250, gain: 0 },
  { id: 'band3', frequency: 1000, gain: 0 },
  { id: 'band4', frequency: 4000, gain: 0 },
  { id: 'band5', frequency: 12000, gain: 0 },
];

// 총 비디오 슬롯 개수
const TOTAL_SLOTS = 6;

// --- 메인 화면 컴포넌트 ---
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
    // ✨ [로그] 화면이 처음 로드될 때 슬롯들의 초기 상태를 확인합니다.
    console.log('[Parent-INIT] Trimmer 슬롯 초기화 완료:', initialTrimmers.map(t => ({ id: t.id, hasVideo: !!t.sourceVideo })));
    setTrimmers(initialTrimmers);
  }, [videos]);

  const handleTrimmerUpdate = (id: string, newState: Partial<Omit<TrimmerState, 'id'>>) => {
    // ✨ [로그] 자식으로부터 업데이트 요청이 올 때마다 확인합니다.
    console.log(`[Parent-UPDATE] '${id}'로부터 상태 업데이트 받음:`, newState);
    setTrimmers(prevTrimmers =>
      prevTrimmers.map(trimmer =>
        trimmer.id === id ? { ...trimmer, ...newState } : trimmer
      )
    );
  };

  const handleVideoLoad = (id: string, data: OnLoadData, aspectRatio: string) => {
    // ✨ [로그] 자식에서 비디오 로드가 완료되었을 때 확인합니다.
    console.log(`[Parent-LOAD] '${id}' 비디오 로드 완료. DURATION: ${data.duration}, AR: ${aspectRatio}`);
    handleTrimmerUpdate(id, {
      duration: data.duration,
      endTime: data.duration,
      originalAspectRatioValue: aspectRatio,
    });
  };

  const handleGlobalPlay = () => {
    // ✨ [로그] 전역 컨트롤 버튼 클릭 확인
    console.log('[Parent-ACTION] 동시 재생(Play) 버튼 클릭');
    Object.values(editorRefs.current).forEach(ref => ref?.playVideo());
  };
  const handleGlobalPause = () => {
    // ✨ [로그] 전역 컨트롤 버튼 클릭 확인
    console.log('[Parent-ACTION] 동시 정지(Pause) 버튼 클릭');
    Object.values(editorRefs.current).forEach(ref => ref?.pauseVideo());
  };
  const handleGlobalSeekToStart = () => {
    // ✨ [로그] 전역 컨트롤 버튼 클릭 확인
    console.log('[Parent-ACTION] 위치 초기화(Seek) 버튼 클릭');
    Object.values(editorRefs.current).forEach(ref => ref?.seekToStart());
  };

  const createCollage = async () => {
    const activeTrimmers = trimmers.filter(t => t.sourceVideo);
    if (activeTrimmers.length === 0) {
      Alert.alert('오류', '콜라주를 만들려면 하나 이상의 비디오가 필요합니다.');
      return;
    }

    console.log('[Parent-COLLAGE] 콜라주 생성 시작...');
    setIsCreatingCollage(true);
    setCollagePath(null);

    try {
      const editData: EditData = {
        trimmers: activeTrimmers.map(t => ({
          startTime: t.startTime,
          endTime: t.endTime,
          volume: t.volume,
          aspectRatio: t.aspectRatio === 'original' ? t.originalAspectRatioValue : t.aspectRatio,
          equalizer: t.equalizer.map(({ frequency, gain }) => ({ frequency, gain })),
        })),
      };

      // ✨ [로그] FFmpeg 필터 생성 함수에 전달될 최종 데이터 객체를 확인합니다.
      console.log('[Parent-COLLAGE] 필터 생성을 위한 데이터:', JSON.stringify(editData, null, 2));
      
      const filterComplexArray = generateCollageFilterComplex(editData);
      const filterComplexString = filterComplexArray.join('; ');
      const inputVideos = activeTrimmers.map(t => t.sourceVideo!);
      const inputCommands = inputVideos.map(v => `-i "${v.uri}"`).join(' ');
      const outputPath = `${RNFS.DocumentDirectoryPath}/collage_${Date.now()}.mp4`;
      const audioMapCommand = editData.trimmers.length > 0 ? '-map "[a]"' : '';

      const encoder = Platform.OS === 'ios' 
    ? '-c:v h264_videotoolbox -b:v 2M' // iOS는 비트레이트 지정이 필요할 수 있습니다.
    : '-c:v h264_mediacodec';

      const command = `${inputCommands} -filter_complex "${filterComplexString}" -map "[v]" ${audioMapCommand} ${encoder} -preset fast -crf 28 -shortest "${outputPath}"`;
      // ✨ [로그] FFmpeg에 실제로 실행될 최종 명령어를 확인합니다. (가장 중요!)
      console.log('[Parent-FFMPEG] 최종 실행 명령어:', command);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        setCollagePath(outputPath);
        Alert.alert('성공!', '비디오 콜라주가 성공적으로 생성되었습니다.');
      } else {
        Alert.alert('오류', '콜라주 생성 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.');
        // ✨ [로그] FFmpeg 실패 시 상세 로그를 확인하여 원인을 파악합니다.
        console.error('[Parent-FFMPEG_ERROR] FFmpeg 실행 실패! 상세 로그:', await session.getLogsAsString());
      }
    } catch (error) {
      Alert.alert('오류', '콜라주 생성 중 예외가 발생했습니다.');
      console.error(error);
    } finally {
      setIsCreatingCollage(false);
    }
  };

  const saveCollageToGallery = async () => {
    if (!collagePath) return;
    try {
      await CameraRoll.save(collagePath, { type: 'video', album: 'VideoEditorApp' });
      Alert.alert('성공', '콜라주가 사진첩에 저장되었습니다!');
    } catch (error) {
      Alert.alert('오류', '사진첩 저장 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>6-Video Collage Editor</Text>
        <View style={styles.globalActions}>
          <TouchableOpacity style={styles.globalButton} onPress={handleGlobalSeekToStart}>
            <Text style={styles.buttonText}>위치 초기화</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.globalButton} onPress={handleGlobalPlay}>
            <Text style={styles.buttonText}>동시 재생</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.globalButton} onPress={handleGlobalPause}>
            <Text style={styles.buttonText}>동시 정지</Text>
          </TouchableOpacity>
        </View>

        {trimmers.map(trimmerState => (
          <SingleVideoEditor
            key={trimmerState.id}
            ref={el => (editorRefs.current[trimmerState.id] = el)}
            trimmerState={trimmerState}
            onUpdate={handleTrimmerUpdate}
            onVideoLoad={handleVideoLoad}
          />
        ))}

        {collagePath && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>✨ 콜라주 결과</Text>
            <Video source={{ uri: collagePath }} style={styles.resultVideo} controls={true} resizeMode="contain" />
            <TouchableOpacity style={styles.saveButton} onPress={saveCollageToGallery}>
              <Text style={styles.buttonText}>결과물 사진첩에 저장</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.saveSection}>
          <TouchableOpacity 
            style={[styles.saveButton, isCreatingCollage && styles.buttonDisabled]} 
            onPress={createCollage}
            disabled={isCreatingCollage}
          >
            {isCreatingCollage ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>콜라주 생성</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  scrollContainer: {
    paddingBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
    textAlign: 'center',
    marginVertical: 20,
  },
  globalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#34495e',
    padding: 10,
    borderRadius: 10,
  },
  globalButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  saveSection: {
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 40
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  resultSection: {
    marginHorizontal: 15,
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#34495e',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#27ae60'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 15,
    textAlign: 'center'
  },
  resultVideo: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
    borderRadius: 10,
    marginBottom: 15,
  },
});

export default VideoEditScreen;