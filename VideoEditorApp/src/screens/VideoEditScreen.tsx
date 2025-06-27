import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import Video from 'react-native-video';

type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  VideoEdit: { videoUri: string; videoName: string };
  MediaLibrary: undefined;
};

type VideoEditScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'VideoEdit'
>;

type VideoEditScreenRouteProp = RouteProp<RootStackParamList, 'VideoEdit'>;

interface Props {
  navigation: VideoEditScreenNavigationProp;
  route: VideoEditScreenRouteProp;
}

const VideoEditScreen: React.FC<Props> = ({
  navigation: _navigation,
  route,
}) => {
  const params = route?.params ?? { videoUri: '', videoName: '' };
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [outputPath, setOutputPath] = useState<string>('');
  const videoRef = useRef<any>(null);

  // route에서 전달받은 비디오 정보 사용
  useEffect(() => {
    if (params.videoUri) {
      setSelectedVideo(params.videoUri);
      setVideoName(params.videoName);
      setStartTime(0);
      setEndTime(0);
      setOutputPath('');
      getVideoInfo(params.videoUri);
    }
  }, [params.videoUri, params.videoName]);

  // 비디오 정보 가져오기
  const getVideoInfo = async (videoPath: string) => {
    try {
      const command = `-i "${videoPath}" -v quiet -print_format json -show_format -show_streams`;
      const result = await FFmpegKit.execute(command);
      const output = await result.getOutput();

      if (output) {
        const info = JSON.parse(output);
        const duration = parseFloat(info.format.duration);
        setVideoDuration(duration);
        setEndTime(duration);
      }
    } catch (error) {
      console.error('비디오 정보 가져오기 실패:', error);
    }
  };

  // 비디오 편집 실행
  const editVideo = async () => {
    if (!selectedVideo || endTime <= startTime) {
      Alert.alert('오류', '올바른 시간 범위를 설정해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      const outputFileName = `edited_video_${Date.now()}.mp4`;
      const outputDir = `${RNFS.DocumentDirectoryPath}/Videos`;

      // 출력 디렉토리 생성
      await RNFS.mkdir(outputDir);

      const outputFilePath = `${outputDir}/${outputFileName}`;

      // FFmpeg 명령어: 비디오 자르기
      const duration = endTime - startTime;
      const command = `-i "${selectedVideo}" -ss ${startTime} -t ${duration} -c copy "${outputFilePath}"`;

      const result = await FFmpegKit.execute(command);
      const returnCode = await result.getReturnCode();

      if (returnCode.isValueSuccess()) {
        setOutputPath(outputFilePath);
        Alert.alert('성공', '비디오 편집이 완료되었습니다!');
      } else {
        const logs = await result.getLogs();
        console.error('FFmpeg 로그:', logs);
        Alert.alert('오류', '비디오 편집 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('편집 오류:', error);
      Alert.alert('오류', '비디오 편집 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 비디오를 사진첩에 저장
  const saveVideoToGallery = async () => {
    if (!outputPath) {
      Alert.alert('오류', '편집된 비디오가 없습니다.');
      return;
    }

    try {
      // 사진첩에 저장
      await CameraRoll.save(outputPath, {
        type: 'video',
        album: 'VideoEditorApp',
      });

      Alert.alert('성공', '비디오가 사진첩에 저장되었습니다!');
    } catch (error) {
      console.error('사진첩 저장 오류:', error);
      Alert.alert('오류', '사진첩에 저장 중 오류가 발생했습니다.');
    }
  };

  // 시간을 MM:SS 형식으로 변환
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>🎬 비디오 편집</Text>

        {/* 비디오 정보 */}
        {selectedVideo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📁 선택된 비디오</Text>
            <View style={styles.videoInfo}>
              <Text style={styles.infoText}>파일명: {videoName}</Text>
              <Text style={styles.infoText}>
                전체 길이: {formatTime(videoDuration)}
              </Text>
              <Text style={styles.infoText}>경로: {selectedVideo}</Text>
            </View>
          </View>
        )}

        {/* 비디오 미리보기 */}
        {selectedVideo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👁️ 비디오 미리보기</Text>
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: selectedVideo }}
                style={styles.video}
                resizeMode="contain"
                paused={true}
                repeat={false}
              />
            </View>
          </View>
        )}

        {/* 시간 설정 */}
        {selectedVideo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ 편집 시간 설정</Text>

            <View style={styles.timeInputContainer}>
              <Text style={styles.timeLabel}>시작 시간 (초):</Text>
              <TextInput
                style={styles.timeInput}
                value={startTime.toString()}
                onChangeText={text => setStartTime(parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.timeInputContainer}>
              <Text style={styles.timeLabel}>종료 시간 (초):</Text>
              <TextInput
                style={styles.timeInput}
                value={endTime.toString()}
                onChangeText={text => setEndTime(parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder={videoDuration.toString()}
              />
            </View>

            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>
                편집 구간: {formatTime(startTime)} ~ {formatTime(endTime)}
              </Text>
              <Text style={styles.timeText}>
                편집 길이: {formatTime(endTime - startTime)}
              </Text>
            </View>
          </View>
        )}

        {/* 편집 실행 */}
        {selectedVideo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✂️ 편집 실행</Text>
            <TouchableOpacity
              style={[styles.button, isProcessing && styles.buttonDisabled]}
              onPress={editVideo}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.buttonText}>편집 중...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>비디오 편집하기</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 결과 및 저장 */}
        {outputPath && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 편집 결과</Text>
            <View style={styles.resultContainer}>
              <Text style={styles.infoText}>편집 완료!</Text>
              <Text style={styles.infoText}>저장 경로: {outputPath}</Text>

              <TouchableOpacity
                style={styles.button}
                onPress={saveVideoToGallery}
              >
                <Text style={styles.buttonText}>사진첩에 저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495e',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  videoInfo: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#ecf0f1',
    marginBottom: 5,
  },
  videoContainer: {
    backgroundColor: '#2c3e50',
    borderRadius: 10,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 200,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timeLabel: {
    fontSize: 16,
    color: '#ecf0f1',
    width: 120,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#2c3e50',
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ecf0f1',
    fontSize: 16,
  },
  timeDisplay: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
  },
  timeText: {
    fontSize: 14,
    color: '#ecf0f1',
    marginBottom: 5,
  },
  resultContainer: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
  },
});

export default VideoEditScreen;
