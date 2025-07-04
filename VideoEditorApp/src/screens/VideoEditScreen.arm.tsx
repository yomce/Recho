import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RNFS from 'react-native-fs';
import axios from 'axios';

import { RootStackParamList, MediaItem } from '../../src/types';

type VideoEditScreenRouteProp = RouteProp<RootStackParamList, 'VideoEdit'>;
type VideoEditScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'VideoEdit'
>;

const { width: screenWidth } = Dimensions.get('window');

const VideoEditScreen: React.FC = () => {
  const route = useRoute<VideoEditScreenRouteProp>();
  const navigation = useNavigation<VideoEditScreenNavigationProp>();
  const { videos } = route.params;

  const videoPlayerRef = useRef<Video>(null);

  const [currentVideo, setCurrentVideo] = useState<MediaItem | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processedVideoUri, setProcessedVideoUri] = useState<string | null>(
    null,
  );
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

  useEffect(() => {
    if (videos && videos.length > 0) {
      setCurrentVideo(videos[0]);
    }
  }, [videos]);

  useEffect(() => {
    if (videoDuration > 0) {
      setTrimEnd(videoDuration);
    }
  }, [videoDuration]);

  const onProgress = (data: { currentTime: number }) => {
    setCurrentTime(data.currentTime);
  };

  const onLoad = (data: { duration: number }) => {
    setVideoDuration(data.duration);
    setTrimEnd(data.duration);
  };

  const onSliderValueChange = (value: number[]) => {
    setTrimStart(value[0]);
    setTrimEnd(value[1]);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seek(value[0]);
    }
  };

  const generateThumbnail = async (videoPath: string, outputPath: string) => {
    const command = `-i ${videoPath} -ss 00:00:01 -vframes 1 ${outputPath}`;
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
      console.log('Thumbnail generated successfully');
      return outputPath;
    } else if (ReturnCode.isCancel(returnCode)) {
      throw new Error('Thumbnail generation cancelled');
    } else {
      const error = await session.getFailStackTrace();
      console.error(`Thumbnail generation failed: ${error}`);
      throw new Error(`Thumbnail generation failed: ${error}`);
    }
  };

  const processVideo = async () => {
    if (!currentVideo) {
      Alert.alert('오류', '선택된 비디오가 없습니다.');
      return;
    }

    setProcessing(true);
    setProcessedVideoUri(null);
    setThumbnailUri(null);

    const inputPath = currentVideo.uri.replace('file://', '');
    const outputFileName = `trimmed_${Date.now()}.mp4`;
    const outputThumbnailName = `thumbnail_${Date.now()}.png`;
    const outputPath = `${RNFS.CachesDirectoryPath}/${outputFileName}`;
    const outputThumbnailPath = `${RNFS.CachesDirectoryPath}/${outputThumbnailName}`;

    const duration = trimEnd - trimStart;
    const command = `-ss ${trimStart} -i ${inputPath} -t ${duration} -c copy ${outputPath}`;

    try {
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        console.log('Video processed successfully');
        setProcessedVideoUri(outputPath);

        // Generate thumbnail after video processing
        const generatedThumbnailPath = await generateThumbnail(
          outputPath,
          outputThumbnailPath,
        );
        setThumbnailUri(generatedThumbnailPath);

        Alert.alert('성공', '비디오 처리 및 썸네일 생성이 완료되었습니다.');
      } else if (ReturnCode.isCancel(returnCode)) {
        Alert.alert('취소', '비디오 처리가 취소되었습니다.');
      } else {
        const error = await session.getFailStackTrace();
        Alert.alert('오류', `비디오 처리 실패: ${error}`);
        console.error(`Video processing failed: ${error}`);
      }
    } catch (e) {
      Alert.alert('오류', `비디오 처리 중 예외 발생: ${e.message}`);
      console.error('Error during video processing:', e);
    } finally {
      setProcessing(false);
    }
  };

  const uploadVideo = async () => {
    if (!processedVideoUri || !thumbnailUri) {
      Alert.alert('오류', '처리된 비디오 또는 썸네일이 없습니다.');
      return;
    }

    setProcessing(true);
    try {
      // 1. Get presigned URLs from backend
      const uploadUrlsRes = await axios.post(
        'http://localhost:3000/video-insert/upload-urls', // Replace with your backend URL
        {
          fileType: 'video/mp4', // Adjust as needed
        },
      );
      const { videoUrl, thumbnailUrl, videoKey, thumbnailKey } =
        uploadUrlsRes.data;

      // 2. Upload video to S3
      const videoFile = await RNFS.readFile(processedVideoUri, 'base64');
      await axios.put(videoUrl, videoFile, {
        headers: {
          'Content-Type': 'video/mp4',
        },
      });

      // 3. Upload thumbnail to S3
      const thumbnailFile = await RNFS.readFile(thumbnailUri, 'base64');
      await axios.put(thumbnailUrl, thumbnailFile, {
        headers: {
          'Content-Type': 'image/png',
        },
      });

      // 4. Notify backend of completion
      await axios.post(
        'http://localhost:3000/video-insert/complete', // Replace with your backend URL
        {
          user_id: 1, // Replace with actual user ID
          video_key: videoKey,
          thumbnail_key: thumbnailKey,
        },
      );

      Alert.alert('성공', '비디오가 성공적으로 업로드되었습니다!');
      navigation.goBack(); // Or navigate to another screen
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
      Alert.alert('오류', '비디오 업로드에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  if (!currentVideo) {
    return (
      <View style={styles.container}>
        <Text>비디오를 선택해주세요.</Text>
        <Button
          title="미디어 라이브러리에서 선택"
          onPress={() => navigation.navigate('MediaLibrary')}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>비디오 편집</Text>
      <Text style={styles.subtitle}>{currentVideo.filename}</Text>

      <View style={styles.videoContainer}>
        <Video
          ref={videoPlayerRef}
          source={{ uri: currentVideo.uri }}
          style={styles.videoPlayer}
          resizeMode="contain"
          onProgress={onProgress}
          onLoad={onLoad}
          paused={processing} // Processing 동안 비디오 일시 정지
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>트리밍</Text>
        <Text style={styles.timeText}>
          시작: {trimStart.toFixed(2)}s | 끝: {trimEnd.toFixed(2)}s | 현재:{' '}
          {currentTime.toFixed(2)}s
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={videoDuration}
          value={trimStart}
          onValueChange={setTrimStart}
          step={0.1}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="#bdc3c7"
          thumbTintColor="#2980b9"
        />
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={videoDuration}
          value={trimEnd}
          onValueChange={setTrimEnd}
          step={0.1}
          minimumTrackTintColor="#3498db"
          maximumTrackTintColor="#bdc3c7"
          thumbTintColor="#2980b9"
        />
      </View>

      <Button
        title={processing ? '처리 중...' : '비디오 처리 및 썸네일 생성'}
        onPress={processVideo}
        disabled={processing}
      />

      {processedVideoUri && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>처리된 비디오 미리보기</Text>
          <Video
            source={{ uri: processedVideoUri }}
            style={styles.videoPlayer}
            resizeMode="contain"
            controls={true}
          />
          <Text style={styles.sectionTitle}>생성된 썸네일</Text>
          <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
          <Button
            title={processing ? '업로드 중...' : 'S3에 업로드'}
            onPress={uploadVideo}
            disabled={processing}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#2c3e50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 20,
  },
  videoContainer: {
    width: screenWidth - 40, // 화면 너비에서 패딩을 뺀 값
    height: (screenWidth - 40) * (9 / 16), // 16:9 비율
    backgroundColor: '#000',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#34495e',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 10,
  },
  timeText: {
    color: '#ecf0f1',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#000',
  },
});

export default VideoEditScreen;
